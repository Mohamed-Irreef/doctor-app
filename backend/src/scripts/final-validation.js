/* eslint-disable no-console */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const crypto = require("crypto");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const { connectDB } = require("../config/db");

const BASE = "http://localhost:5000/api";

const results = [];

function addResult(name, ok, detail) {
  results.push({ name, ok, detail });
}

async function request(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_err) {
    data = { raw: text };
  }

  return { ok: res.ok, status: res.status, data };
}

async function main() {
  const stamp = Date.now();
  const labEmail = `lab.final.${stamp}@nividoc.test`;
  const phEmail = `ph.final.${stamp}@nividoc.test`;
  const patientEmail = `patient.final.${stamp}@nividoc.test`;

  const labPayload = {
    fullName: "Lab Final",
    email: labEmail,
    phone: "9876600001",
    password: "Lab@12345",
    profilePhoto: "https://example.com/l.png",
    labName: `Lab Final ${stamp}`,
    labType: "diagnostic",
    registrationNumber: `LABF${stamp}`,
    yearsOfExperience: 5,
    availableTests: ["CBC"],
    address: "12 Main",
    city: "BLR",
    state: "KA",
    pincode: "560001",
    location: { latitude: 12.9716, longitude: 77.5946 },
    supportPhone: "9876600002",
    supportEmail: labEmail,
    governmentLicense: {
      name: "g.pdf",
      url: "https://example.com/g.pdf",
      mimeType: "application/pdf",
    },
    labCertification: {
      name: "c.pdf",
      url: "https://example.com/c.pdf",
      mimeType: "application/pdf",
    },
    ownerIdProof: {
      name: "i.pdf",
      url: "https://example.com/i.pdf",
      mimeType: "application/pdf",
    },
    addressProof: {
      name: "a.pdf",
      url: "https://example.com/a.pdf",
      mimeType: "application/pdf",
    },
    termsAccepted: true,
    declarationAccepted: true,
  };

  const pharmacyPayload = {
    fullName: "Ph Final",
    email: phEmail,
    phone: "9876600011",
    password: "Pharmacy@12345",
    profilePhoto: "https://example.com/p.png",
    pharmacyName: `Ph Final ${stamp}`,
    licenseNumber: `PHF${stamp}`,
    gstNumber: `GSTF${stamp}`,
    yearsOfExperience: 4,
    address: "22 Main",
    city: "BLR",
    state: "KA",
    pincode: "560001",
    location: { latitude: 12.9716, longitude: 77.5946 },
    supportPhone: "9876600012",
    supportEmail: phEmail,
    drugLicense: {
      name: "d.pdf",
      url: "https://example.com/d.pdf",
      mimeType: "application/pdf",
    },
    gstCertificate: {
      name: "g.pdf",
      url: "https://example.com/g2.pdf",
      mimeType: "application/pdf",
    },
    ownerIdProof: {
      name: "i.pdf",
      url: "https://example.com/i2.pdf",
      mimeType: "application/pdf",
    },
    termsAccepted: true,
    declarationAccepted: true,
  };

  const labRegister = await request(
    "POST",
    "/business/register/lab",
    labPayload,
  );
  addResult("Lab registration", labRegister.ok, `HTTP ${labRegister.status}`);

  const dupLab = await request("POST", "/business/register/lab", labPayload);
  addResult(
    "Duplicate registration blocked",
    !dupLab.ok && dupLab.status === 409,
    `HTTP ${dupLab.status}`,
  );

  const phRegister = await request(
    "POST",
    "/business/register/pharmacy",
    pharmacyPayload,
  );
  addResult(
    "Pharmacy registration",
    phRegister.ok,
    `HTTP ${phRegister.status}`,
  );

  const badLogin = await request("POST", "/auth/login", {
    email: labEmail,
    password: "wrong",
    role: "lab_admin",
  });
  addResult(
    "Invalid login blocked",
    !badLogin.ok && [400, 401].includes(badLogin.status),
    `HTTP ${badLogin.status}`,
  );

  const preLab = await request("POST", "/auth/login", {
    email: labEmail,
    password: "Lab@12345",
    role: "lab_admin",
  });
  addResult(
    "Lab pre-approval blocked",
    !preLab.ok && preLab.status === 403,
    `HTTP ${preLab.status}`,
  );

  const prePh = await request("POST", "/auth/login", {
    email: phEmail,
    password: "Pharmacy@12345",
    role: "pharmacy_admin",
  });
  addResult(
    "Pharmacy pre-approval blocked",
    !prePh.ok && prePh.status === 403,
    `HTTP ${prePh.status}`,
  );

  const adminLogin = await request("POST", "/auth/login", {
    email: "admin@nividoc.com",
    password: "Admin@12345",
    role: "admin",
  });
  const adminToken = adminLogin.data?.data?.accessToken;
  if (!adminToken) throw new Error("Admin login failed");

  const labRequests = await request(
    "GET",
    "/admin/approvals/labs",
    null,
    adminToken,
  );
  const phRequests = await request(
    "GET",
    "/admin/approvals/pharmacies",
    null,
    adminToken,
  );

  const labReq = (labRequests.data?.data || []).find(
    (x) => x.email === labEmail,
  );
  const phReq = (phRequests.data?.data || []).find((x) => x.email === phEmail);

  if (!labReq || !phReq) throw new Error("Partner approval requests not found");

  await request(
    "PUT",
    `/admin/approvals/labs/${labReq._id}`,
    { approved: true },
    adminToken,
  );
  await request(
    "PUT",
    `/admin/approvals/pharmacies/${phReq._id}`,
    { approved: true },
    adminToken,
  );
  addResult("Admin approvals complete", true, "approved");

  const labLogin = await request("POST", "/auth/login", {
    email: labEmail,
    password: "Lab@12345",
    role: "lab_admin",
  });
  const phLogin = await request("POST", "/auth/login", {
    email: phEmail,
    password: "Pharmacy@12345",
    role: "pharmacy_admin",
  });

  const labToken = labLogin.data?.data?.accessToken;
  const phToken = phLogin.data?.data?.accessToken;
  if (!labToken || !phToken)
    throw new Error("Partner login failed after approval");

  addResult("Post-approval lab login", true, "ok");
  addResult("Post-approval pharmacy login", true, "ok");

  const roleBlock = await request(
    "GET",
    "/admin/ecosystem/metrics",
    null,
    labToken,
  );
  addResult(
    "Role security lab->admin blocked",
    !roleBlock.ok && roleBlock.status === 403,
    `HTTP ${roleBlock.status}`,
  );

  const invalidToken = await request(
    "GET",
    "/partner/lab/dashboard",
    null,
    "bad.token.value",
  );
  addResult(
    "Expired/invalid token blocked",
    !invalidToken.ok && invalidToken.status === 401,
    `HTTP ${invalidToken.status}`,
  );

  const labTestCreate = await request(
    "POST",
    "/partner/lab/tests",
    {
      name: `CBC Final ${stamp}`,
      category: "Blood",
      description: "qa",
      originalPrice: 1000,
      price: 800,
      turnaround: "24 hrs",
    },
    labToken,
  );

  const medCreate = await request(
    "POST",
    "/partner/pharmacy/medicines",
    {
      name: `Med Final ${stamp}`,
      category: "General",
      description: "qa",
      price: 250,
      stock: 20,
      prescriptionRequired: false,
    },
    phToken,
  );

  const labTestId = labTestCreate.data?.data?._id;
  const medId = medCreate.data?.data?._id;
  addResult(
    "Partner content created pending",
    Boolean(labTestId && medId),
    `lab=${labTestId || "none"} med=${medId || "none"}`,
  );

  const patientRegister = await request("POST", "/auth/register", {
    name: "Patient Final",
    email: patientEmail,
    phone: "9876600021",
    password: "Patient@12345",
    gender: "Male",
    dateOfBirth: "1994-01-01",
    bloodGroup: "O+",
    address: "Patient Addr",
    emergencyContact: "9876600022",
    image: "https://example.com/patient.png",
    allergies: [],
    medicalConditions: [],
  });
  addResult(
    "Patient registration",
    patientRegister.ok,
    `HTTP ${patientRegister.status}`,
  );

  const patientLogin = await request("POST", "/auth/login", {
    email: patientEmail,
    password: "Patient@12345",
    role: "patient",
  });
  const patientToken = patientLogin.data?.data?.accessToken;
  if (!patientToken) throw new Error("Patient login failed");

  const labsBefore = await request("GET", "/labs");
  const medsBefore = await request("GET", "/pharmacy/medicines");
  const labVisibleBefore = (labsBefore.data?.data || []).some(
    (x) => x._id === labTestId,
  );
  const medVisibleBefore = (medsBefore.data?.data || []).some(
    (x) => x._id === medId,
  );

  addResult(
    "Pending lab hidden from patient list",
    !labVisibleBefore,
    `visible=${labVisibleBefore}`,
  );
  addResult(
    "Pending medicine hidden from patient list",
    !medVisibleBefore,
    `visible=${medVisibleBefore}`,
  );

  const bookBefore = await request(
    "POST",
    "/labs/book",
    { labTestId, bookingDate: "2026-04-11" },
    patientToken,
  );
  const orderBefore = await request(
    "POST",
    "/pharmacy/orders",
    { items: [{ medicineId: medId, quantity: 1 }] },
    patientToken,
  );

  addResult(
    "Pending lab booking blocked",
    !bookBefore.ok,
    `HTTP ${bookBefore.status}`,
  );
  addResult(
    "Pending medicine order blocked",
    !orderBefore.ok && orderBefore.status === 400,
    `HTTP ${orderBefore.status}`,
  );

  await request(
    "PUT",
    `/admin/content/lab-tests/${labTestId}/decision`,
    { approved: true },
    adminToken,
  );
  await request(
    "PUT",
    `/admin/content/medicines/${medId}/decision`,
    { approved: true },
    adminToken,
  );

  const labsAfter = await request("GET", "/labs");
  const medsAfter = await request("GET", "/pharmacy/medicines");
  const labVisibleAfter = (labsAfter.data?.data || []).some(
    (x) => x._id === labTestId,
  );
  const medVisibleAfter = (medsAfter.data?.data || []).some(
    (x) => x._id === medId,
  );

  addResult(
    "Approved lab visible to patient list",
    labVisibleAfter,
    `visible=${labVisibleAfter}`,
  );
  addResult(
    "Approved medicine visible to patient list",
    medVisibleAfter,
    `visible=${medVisibleAfter}`,
  );

  const bookAfter = await request(
    "POST",
    "/labs/book",
    { labTestId, bookingDate: "2026-04-12" },
    patientToken,
  );
  const orderAfter = await request(
    "POST",
    "/pharmacy/orders",
    { items: [{ medicineId: medId, quantity: 2 }] },
    patientToken,
  );

  const labBookingId = bookAfter.data?.data?._id;
  const orderId = orderAfter.data?.data?._id;
  addResult(
    "Approved lab booking works",
    Boolean(labBookingId),
    `id=${labBookingId || "none"}`,
  );
  addResult(
    "Approved medicine order works",
    Boolean(orderId),
    `id=${orderId || "none"}`,
  );

  const paymentCreate = await request(
    "POST",
    "/payments/create-order",
    { type: "lab", relatedId: labBookingId },
    patientToken,
  );
  const paymentId = paymentCreate.data?.data?.paymentId;
  const orderToken = paymentCreate.data?.data?.orderId;

  const forgedPaymentId = "pay_forged_validation";
  const forgedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${orderToken}|${forgedPaymentId}`)
    .digest("hex");

  const forgedVerify = await request(
    "POST",
    "/payments/verify",
    {
      paymentId,
      razorpayOrderId: orderToken,
      razorpayPaymentId: forgedPaymentId,
      razorpaySignature: forgedSignature,
    },
    patientToken,
  );

  addResult(
    "Forged signature without real Razorpay payment blocked",
    !forgedVerify.ok && forgedVerify.status === 400,
    `HTTP ${forgedVerify.status}`,
  );

  const badVerify1 = await request(
    "POST",
    "/payments/verify",
    {
      paymentId,
      razorpayOrderId: orderToken,
      razorpayPaymentId: "pay_fake",
      razorpaySignature: "sig_fake",
    },
    patientToken,
  );

  const badVerify2 = await request(
    "POST",
    "/payments/verify",
    {
      paymentId,
      razorpayOrderId: orderToken,
      razorpayPaymentId: "pay_fake2",
      razorpaySignature: "sig_fake2",
    },
    patientToken,
  );

  addResult(
    "Payment failure rejected (signature check)",
    !badVerify1.ok && badVerify1.status === 400,
    `HTTP ${badVerify1.status}`,
  );
  addResult(
    "Payment retry path preserved",
    !badVerify2.ok && badVerify2.status === 400,
    `HTTP ${badVerify2.status}`,
  );

  await connectDB();
  const paymentDoc = await Payment.findById(paymentId).lean();
  const split = paymentDoc?.revenueSplit || {};
  const splitOk =
    split.adminSharePercent === 20 &&
    split.partnerSharePercent === 80 &&
    Number((split.adminShare + split.partnerShare).toFixed(2)) ===
      Number(split.total.toFixed(2));
  addResult(
    "Revenue split stored 20/80 with correct totals",
    splitOk,
    `admin=${split.adminShare} partner=${split.partnerShare} total=${split.total}`,
  );

  const uploadFail = await request("POST", "/upload-public");
  addResult(
    "Upload failure handled",
    !uploadFail.ok && [400, 500].includes(uploadFail.status),
    `HTTP ${uploadFail.status}`,
  );

  const missingFields = await request("POST", "/business/register/lab", {
    fullName: "x",
  });
  addResult(
    "Missing fields validation handled",
    !missingFields.ok && [400, 422].includes(missingFields.status),
    `HTTP ${missingFields.status}`,
  );

  for (const row of results) {
    console.log(`${row.ok ? "PASS" : "FAIL"}|${row.name}|${row.detail}`);
  }

  const pass = results.filter((x) => x.ok).length;
  const fail = results.length - pass;
  console.log(
    `SUMMARY|PASS=${pass}|FAIL=${fail}|LAB=${labEmail}|PHARMACY=${phEmail}|PATIENT=${patientEmail}`,
  );

  await mongoose.disconnect();

  if (fail > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
