const { transporter } = require("../config/mailer");
const env = require("../config/env");

async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
  });
}

async function sendDoctorApprovalEmail(to, doctorName, approved) {
  const subject = approved
    ? "NiviDoc doctor account approved"
    : "NiviDoc doctor application update";
  const html = approved
    ? `<p>Hi ${doctorName}, your NiviDoc doctor profile has been approved. You can now login.</p>`
    : `<p>Hi ${doctorName}, your NiviDoc doctor profile has been rejected. Please contact support for guidance.</p>`;
  return sendEmail({ to, subject, html });
}

async function sendAppointmentEmail(to, name, appointment) {
  return sendEmail({
    to,
    subject: "NiviDoc appointment confirmation",
    html: `<p>Hi ${name}, your appointment is confirmed for ${appointment.date} at ${appointment.time}.</p>`,
  });
}

async function sendPaymentReceiptEmail(to, name, payment) {
  return sendEmail({
    to,
    subject: "NiviDoc payment receipt",
    html: `<p>Hi ${name}, your payment of INR ${payment.amount} is successful. Ref: ${payment.razorpayPaymentId}</p>`,
  });
}

async function sendPartnerApprovalEmail({
  to,
  partnerName,
  partnerType,
  approved,
  reason,
}) {
  const roleLabel = partnerType === "lab" ? "Lab" : "Pharmacy";
  const subject = approved
    ? `NiviDoc ${roleLabel} account approved`
    : `NiviDoc ${roleLabel} application update`;
  const html = approved
    ? `<p>Hi ${partnerName}, your ${roleLabel.toLowerCase()} partner profile has been approved. You can now login to your dashboard.</p>`
    : `<p>Hi ${partnerName}, your ${roleLabel.toLowerCase()} partner profile was rejected.${reason ? ` Reason: ${reason}.` : ""} Please contact support for guidance.</p>`;
  return sendEmail({ to, subject, html });
}

async function sendLabBookingConfirmationEmail({
  to,
  patientName,
  testName,
  bookingDate,
}) {
  return sendEmail({
    to,
    subject: "NiviDoc lab booking confirmed",
    html: `<p>Hi ${patientName}, your lab booking for <strong>${testName}</strong> is confirmed for ${bookingDate}.</p>`,
  });
}

async function sendLabReportUploadedEmail({
  to,
  patientName,
  testName,
  reportUrl,
}) {
  return sendEmail({
    to,
    subject: "NiviDoc lab report is ready",
    html: `<p>Hi ${patientName}, your report for <strong>${testName}</strong> is uploaded.</p><p>View report: <a href="${reportUrl}">${reportUrl}</a></p>`,
  });
}

async function sendLabBookingStatusEmail({
  to,
  patientName,
  testName,
  status,
  dateTime,
  labName,
}) {
  return sendEmail({
    to,
    subject: "Your Lab Test Status Updated",
    html: `
      <p>Hi ${patientName},</p>
      <p>Your lab test booking status has been updated.</p>
      <ul>
        <li><strong>Test:</strong> ${testName || "Lab Test"}</li>
        <li><strong>New Status:</strong> ${status}</li>
        <li><strong>Date & Time:</strong> ${dateTime || "-"}</li>
        <li><strong>Lab:</strong> ${labName || "NiviDoc Lab Partner"}</li>
      </ul>
      <p>Thank you for choosing NiviDoc.</p>
    `,
  });
}

async function sendPharmacyOrderPlacedEmail({
  to,
  patientName,
  orderId,
  amount,
}) {
  return sendEmail({
    to,
    subject: "NiviDoc pharmacy order placed",
    html: `<p>Hi ${patientName}, your pharmacy order <strong>#${String(orderId).slice(-6)}</strong> is placed successfully. Total amount: INR ${amount}.</p>`,
  });
}

async function sendPharmacyOrderStatusEmail({
  to,
  patientName,
  orderId,
  status,
}) {
  return sendEmail({
    to,
    subject: `NiviDoc order ${status}`,
    html: `<p>Hi ${patientName}, your pharmacy order <strong>#${String(orderId).slice(-6)}</strong> status is now <strong>${status}</strong>.</p>`,
  });
}

module.exports = {
  sendEmail,
  sendDoctorApprovalEmail,
  sendAppointmentEmail,
  sendPaymentReceiptEmail,
  sendPartnerApprovalEmail,
  sendLabBookingConfirmationEmail,
  sendLabReportUploadedEmail,
  sendLabBookingStatusEmail,
  sendPharmacyOrderPlacedEmail,
  sendPharmacyOrderStatusEmail,
};
