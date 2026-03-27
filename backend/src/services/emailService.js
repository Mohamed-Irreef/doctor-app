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

module.exports = {
  sendEmail,
  sendDoctorApprovalEmail,
  sendAppointmentEmail,
  sendPaymentReceiptEmail,
};
