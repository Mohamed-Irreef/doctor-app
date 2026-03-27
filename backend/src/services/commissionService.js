const PlatformSetting = require("../models/PlatformSetting");

const DEFAULTS = {
  APPOINTMENT_COMMISSION_PERCENT: 10,
  LAB_COMMISSION_PERCENT: 20,
  PHARMACY_COMMISSION_PERCENT: 15,
};

async function getPercent(key) {
  const setting = await PlatformSetting.findOne({ key }).lean();
  return Number(setting?.value ?? DEFAULTS[key] ?? 0);
}

async function calculateCommission(type, amount) {
  const keyMap = {
    appointment: "APPOINTMENT_COMMISSION_PERCENT",
    lab: "LAB_COMMISSION_PERCENT",
    pharmacy: "PHARMACY_COMMISSION_PERCENT",
  };

  const percent = await getPercent(
    keyMap[type] || "APPOINTMENT_COMMISSION_PERCENT",
  );
  const commissionAmount = Number(((amount * percent) / 100).toFixed(2));
  return { percent, commissionAmount };
}

module.exports = { calculateCommission, DEFAULTS };
