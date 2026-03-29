const dayjs = require("dayjs");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Slot = require("../models/Slot");
const DoctorProfile = require("../models/DoctorProfile");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { requirePatientProfileComplete } = require("../utils/profileCompletion");
const { sendAppointmentEmail } = require("../services/emailService");

const createAppointment = catchAsync(async (req, res) => {
  await requirePatientProfileComplete(req.user._id);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const slot = await Slot.findById(req.body.slotId).session(session);
    if (!slot || slot.status !== "available")
      throw new ApiError(400, "Slot is not available");
    if (String(slot.doctor) !== req.body.doctorId)
      throw new ApiError(400, "Slot-doctor mismatch");

    const profile = await DoctorProfile.findOne({
      user: req.body.doctorId,
    }).session(session);
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
          fee: profile.consultationFee,
        },
      ],
      { session },
    );

    slot.status = "booked";
    slot.appointment = appointment[0]._id;
    await slot.save({ session });

    await session.commitTransaction();

    await sendAppointmentEmail(req.user.email, req.user.name, {
      date: dayjs(slot.date).format("DD MMM YYYY"),
      time: slot.startTime,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Appointment created", appointment[0]));
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

const getPatientAppointments = catchAsync(async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate("doctor", "name image email phone")
    .sort({ date: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, "Patient appointments fetched", appointments));
});

const getDoctorAppointments = catchAsync(async (req, res) => {
  const appointments = await Appointment.find({ doctor: req.user._id })
    .populate("patient", "name image email phone")
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
  await appointment.save();

  if (req.body.status === "cancelled") {
    await Slot.findByIdAndUpdate(appointment.slot, {
      status: "available",
      appointment: null,
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

  const newSlot = await Slot.findById(req.body.slotId);
  if (!newSlot || newSlot.status !== "available")
    throw new ApiError(400, "New slot unavailable");

  await Slot.findByIdAndUpdate(appointment.slot, {
    status: "available",
    appointment: null,
  });
  newSlot.status = "booked";
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

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
};
