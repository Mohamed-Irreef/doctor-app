const dayjs = require("dayjs");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Slot = require("../models/Slot");
const DoctorProfile = require("../models/DoctorProfile");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { requirePatientProfileComplete } = require("../utils/profileCompletion");

const HOLD_MINUTES = 5;

function isTransactionUnsupportedError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("transaction numbers are only allowed") ||
    message.includes("replica set member") ||
    message.includes("mongos")
  );
}

function parseTimeToMinutes(label) {
  const [timePart, period] = String(label).trim().split(" ");
  const [rawHour, minute] = timePart.split(":").map(Number);
  let hour = rawHour;
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function getSlotWindow(date, startTime, endTime) {
  const base = dayjs(date).startOf("day");
  const start = base.add(parseTimeToMinutes(startTime), "minute");
  const end = base.add(parseTimeToMinutes(endTime), "minute");
  return { start, end };
}

const createAppointment = catchAsync(async (req, res) => {
  await requirePatientProfileComplete(req.user._id);

  const reserveAndCreate = async (session = null) => {
    const writeOptions = session ? { session } : {};

    await Slot.updateOne(
      {
        _id: req.body.slotId,
        status: "blocked",
        holdExpiresAt: { $lte: new Date() },
      },
      {
        $set: { status: "available" },
        $unset: { heldBy: 1, holdExpiresAt: 1, appointment: 1 },
      },
      writeOptions,
    );

    const slot = await Slot.findOneAndUpdate(
      {
        _id: req.body.slotId,
        doctor: req.body.doctorId,
        status: "available",
      },
      {
        $set: {
          status: "blocked",
          heldBy: req.user._id,
          holdExpiresAt: dayjs().add(HOLD_MINUTES, "minute").toDate(),
        },
      },
      { ...writeOptions, new: true },
    );
    if (!slot) throw new ApiError(400, "Slot is not available");

    const profileQuery = DoctorProfile.findOne({
      user: req.body.doctorId,
    });
    if (session) profileQuery.session(session);
    const profile = await profileQuery;
    if (!profile) throw new ApiError(404, "Doctor profile not found");

    const appointment = await Appointment.create(
      [
        {
          patient: req.user._id,
          doctor: req.body.doctorId,
          slot: slot._id,
          date: slot.date,
          time: slot.startTime,
          type: req.body.type,
          status: "pending",
          paymentStatus: "pending",
          fee: profile.consultationFee,
          medicalDetails: req.body.medicalDetails || undefined,
        },
      ],
      writeOptions,
    );

    slot.appointment = appointment[0]._id;
    await slot.save(writeOptions);

    appointment[0].consultationRoomId = `nividoc-${appointment[0]._id}`;
    await appointment[0].save(writeOptions);

    return { appointment: appointment[0], slot };
  };

  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const result = await reserveAndCreate(session);
    await session.commitTransaction();

    return res.status(201).json(
      new ApiResponse(201, "Appointment created. Complete payment to confirm", {
        ...result.appointment.toObject(),
        holdExpiresAt: result.slot.holdExpiresAt,
      }),
    );
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (_ignored) {
        // Session may already be ended/invalid in fallback scenarios.
      }
    }

    if (isTransactionUnsupportedError(error)) {
      const fallback = await reserveAndCreate();
      return res.status(201).json(
        new ApiResponse(
          201,
          "Appointment created. Complete payment to confirm",
          {
            ...fallback.appointment.toObject(),
            holdExpiresAt: fallback.slot.holdExpiresAt,
          },
        ),
      );
    }

    throw error;
  } finally {
    if (session) session.endSession();
  }
});

const getPatientAppointments = catchAsync(async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate("doctor", "name image email phone")
    .populate("slot")
    .sort({ date: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Patient appointments fetched", appointments));
});

const getDoctorAppointments = catchAsync(async (req, res) => {
  const appointments = await Appointment.find({ doctor: req.user._id })
    .populate("patient", "name image email phone")
    .populate("slot")
    .sort({ date: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Doctor appointments fetched", appointments));
});

const updateAppointmentStatus = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  const isOwner = [
    String(appointment.patient),
    String(appointment.doctor),
  ].includes(String(req.user._id));
  if (!isOwner && req.user.role !== "admin")
    throw new ApiError(403, "Not allowed");

  appointment.status = req.body.status;
  if (req.body.cancellationReason)
    appointment.cancellationReason = req.body.cancellationReason;
  if (req.body.notes) appointment.notes = req.body.notes;
  if (req.body.prescription) appointment.prescription = req.body.prescription;
  if (req.body.status === "completed")
    appointment.consultationEndedAt = new Date();
  await appointment.save();

  if (req.body.status === "cancelled") {
    await Slot.findByIdAndUpdate(appointment.slot, {
      status: "available",
      appointment: null,
      heldBy: null,
      holdExpiresAt: null,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment updated", appointment));
});

const rescheduleAppointment = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (
    String(appointment.patient) !== String(req.user._id) &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Only patient or admin can reschedule");
  }

  const newSlot = await Slot.findOneAndUpdate(
    {
      _id: req.body.slotId,
      status: "available",
      doctor: appointment.doctor,
    },
    { $set: { status: "booked" } },
    { new: true },
  );
  if (!newSlot) throw new ApiError(400, "New slot unavailable");

  await Slot.findByIdAndUpdate(appointment.slot, {
    status: "available",
    appointment: null,
    heldBy: null,
    holdExpiresAt: null,
  });

  newSlot.appointment = appointment._id;
  await newSlot.save();

  appointment.slot = newSlot._id;
  appointment.date = newSlot.date;
  appointment.time = newSlot.startTime;
  appointment.status = "upcoming";
  await appointment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment rescheduled", appointment));
});

const releasePendingAppointment = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (
    String(appointment.patient) !== String(req.user._id) &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Not allowed");
  }

  if (appointment.paymentStatus === "paid") {
    throw new ApiError(400, "Cannot release a paid appointment");
  }

  appointment.status = "cancelled";
  appointment.paymentStatus = "failed";
  if (req.body.reason) appointment.cancellationReason = req.body.reason;
  await appointment.save();

  await Slot.findByIdAndUpdate(appointment.slot, {
    status: "available",
    appointment: null,
    heldBy: null,
    holdExpiresAt: null,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Pending appointment released", appointment));
});

const getConsultationAccess = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate(
    "slot",
  );
  if (!appointment) throw new ApiError(404, "Appointment not found");

  const isOwner = [
    String(appointment.patient),
    String(appointment.doctor),
  ].includes(String(req.user._id));
  if (!isOwner && req.user.role !== "admin")
    throw new ApiError(403, "Not allowed");

  if (appointment.type !== "video") {
    throw new ApiError(
      400,
      "Consultation access is only available for video appointments",
    );
  }

  const slot = appointment.slot;
  if (!slot) throw new ApiError(400, "Slot not found for appointment");

  const { start, end } = getSlotWindow(
    appointment.date,
    slot.startTime,
    slot.endTime,
  );
  const now = dayjs();
  if (now.isBefore(start) || now.isAfter(end)) {
    throw new ApiError(
      403,
      "Consultation can only be started during the slot time",
    );
  }

  if (!appointment.consultationStartedAt) {
    appointment.consultationStartedAt = new Date();
    await appointment.save();
  }

  const roomId = appointment.consultationRoomId || `nividoc-${appointment._id}`;
  return res.status(200).json(
    new ApiResponse(200, "Consultation access granted", {
      roomId,
      meetingUrl: `https://meet.jit.si/${roomId}`,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    }),
  );
});

const submitPrescription = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (
    String(appointment.doctor) !== String(req.user._id) &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Only doctor can submit prescription");
  }

  if (appointment.status === "cancelled") {
    throw new ApiError(
      400,
      "Cannot submit prescription for cancelled appointment",
    );
  }

  if (!appointment.consultationStartedAt) {
    throw new ApiError(
      400,
      "Prescription can be submitted only after consultation starts",
    );
  }

  appointment.prescription = req.body.text;
  appointment.prescriptionDetails = {
    text: req.body.text,
    pdfUrl: req.body.pdfUrl,
    prescribedAt: new Date(),
    prescribedBy: req.user._id,
  };
  appointment.status = "completed";
  appointment.consultationEndedAt = new Date();
  await appointment.save();

  await Notification.create({
    title: "Prescription available",
    message: "Doctor has uploaded your prescription",
    type: "prescription",
    audienceType: "single",
    recipient: appointment.patient,
    targetEntityType: "Appointment",
    targetEntityId: appointment._id,
  });

  await Notification.create({
    title: "Prescription submitted",
    message: "Doctor submitted prescription for admin review",
    type: "prescription-admin",
    audienceType: "all",
    targetEntityType: "Appointment",
    targetEntityId: appointment._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Prescription submitted", appointment));
});

const verifyAppointmentRevenue = catchAsync(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate(
    "payment",
  );
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (req.user.role !== "admin")
    throw new ApiError(403, "Only admin can verify payout");
  if (appointment.paymentStatus !== "paid") {
    throw new ApiError(400, "Appointment payment is not completed");
  }

  const payoutStatus = appointment?.revenueSplit?.doctorPayoutStatus;
  if (appointment.adminReviewStatus === "verified" && payoutStatus === "paid") {
    throw new ApiError(400, "Revenue already finalized and paid");
  }

  if (!req.body.approved) {
    appointment.adminReviewStatus = "rejected";
    appointment.revenueSplit = {
      ...appointment.revenueSplit,
      doctorPayoutStatus: "pending",
      verifiedByAdmin: req.user._id,
      verifiedAt: new Date(),
    };
    await appointment.save();
    return res
      .status(200)
      .json(new ApiResponse(200, "Appointment revenue rejected", appointment));
  }

  const doctorAmount = Number((appointment.fee * 0.8).toFixed(2));
  const platformAmount = Number((appointment.fee * 0.2).toFixed(2));

  appointment.adminReviewStatus = "verified";
  appointment.revenueSplit = {
    doctorAmount,
    platformAmount,
    doctorPayoutStatus: req.body.payoutReference ? "paid" : "processing",
    payoutReference: req.body.payoutReference,
    payoutProcessedAt: req.body.payoutReference ? new Date() : undefined,
    verifiedByAdmin: req.user._id,
    verifiedAt: new Date(),
  };
  await appointment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment revenue verified", appointment));
});

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  releasePendingAppointment,
  getConsultationAccess,
  submitPrescription,
  verifyAppointmentRevenue,
};
