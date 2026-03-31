const User = require("../models/User");
const LabPartnerProfile = require("../models/LabPartnerProfile");
const PharmacyPartnerProfile = require("../models/PharmacyPartnerProfile");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

async function assertEmailNotUsed(email) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "Email already registered");
}

const registerLabPartner = catchAsync(async (req, res) => {
  await assertEmailNotUsed(req.body.email);

  const user = new User({
    name: req.body.fullName,
    email: req.body.email.toLowerCase(),
    phone: req.body.phone,
    role: "lab_admin",
    image: req.body.profilePhoto,
    labApprovalStatus: "pending",
    isEmailVerified: false,
  });
  await user.setPassword(req.body.password);
  await user.save();

  const profile = await LabPartnerProfile.create({
    user: user._id,
    fullName: req.body.fullName,
    email: req.body.email.toLowerCase(),
    phone: req.body.phone,
    profilePhoto: req.body.profilePhoto,
    labName: req.body.labName,
    labType: req.body.labType,
    registrationNumber: req.body.registrationNumber,
    yearsOfExperience: req.body.yearsOfExperience,
    availableTests: req.body.availableTests,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    location: req.body.location,
    supportPhone: req.body.supportPhone,
    supportEmail: req.body.supportEmail.toLowerCase(),
    governmentLicense: req.body.governmentLicense,
    labCertification: req.body.labCertification,
    ownerIdProof: req.body.ownerIdProof,
    addressProof: req.body.addressProof,
    termsAccepted: req.body.termsAccepted,
    declarationAccepted: req.body.declarationAccepted,
    status: "PENDING",
    isApproved: false,
    approvalStatus: "pending",
  });

  await Notification.create({
    title: "New Lab Partner Registration",
    message: `${req.body.labName} has submitted onboarding documents for approval.`,
    type: "lab-partner-registration",
    audienceType: "all",
    targetEntityType: "LabPartnerProfile",
    targetEntityId: profile._id,
  });

  return res.status(201).json(
    new ApiResponse(201, "Lab registration submitted for admin approval", {
      userId: user._id,
      status: "PENDING",
      isApproved: false,
      approvalStatus: "pending",
    }),
  );
});

const registerPharmacyPartner = catchAsync(async (req, res) => {
  await assertEmailNotUsed(req.body.email);

  const user = new User({
    name: req.body.fullName,
    email: req.body.email.toLowerCase(),
    phone: req.body.phone,
    role: "pharmacy_admin",
    image: req.body.profilePhoto,
    pharmacyApprovalStatus: "pending",
    isEmailVerified: false,
  });
  await user.setPassword(req.body.password);
  await user.save();

  const profile = await PharmacyPartnerProfile.create({
    user: user._id,
    fullName: req.body.fullName,
    email: req.body.email.toLowerCase(),
    phone: req.body.phone,
    profilePhoto: req.body.profilePhoto,
    pharmacyName: req.body.pharmacyName,
    licenseNumber: req.body.licenseNumber,
    gstNumber: req.body.gstNumber,
    yearsOfExperience: req.body.yearsOfExperience,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    location: req.body.location,
    supportPhone: req.body.supportPhone,
    supportEmail: req.body.supportEmail.toLowerCase(),
    drugLicense: req.body.drugLicense,
    gstCertificate: req.body.gstCertificate,
    ownerIdProof: req.body.ownerIdProof,
    termsAccepted: req.body.termsAccepted,
    declarationAccepted: req.body.declarationAccepted,
    status: "PENDING",
    isApproved: false,
    approvalStatus: "pending",
  });

  await Notification.create({
    title: "New Pharmacy Partner Registration",
    message: `${req.body.pharmacyName} has submitted onboarding documents for approval.`,
    type: "pharmacy-partner-registration",
    audienceType: "all",
    targetEntityType: "PharmacyPartnerProfile",
    targetEntityId: profile._id,
  });

  return res.status(201).json(
    new ApiResponse(201, "Pharmacy registration submitted for admin approval", {
      userId: user._id,
      status: "PENDING",
      isApproved: false,
      approvalStatus: "pending",
    }),
  );
});

module.exports = {
  registerLabPartner,
  registerPharmacyPartner,
};
