const { connectDB } = require("../config/db");
const User = require("../models/User");
const Plan = require("../models/Plan");
const PlatformSetting = require("../models/PlatformSetting");
const { DEFAULTS } = require("../services/commissionService");

async function seed() {
  await connectDB();

  const plans = [
    {
      name: "Free",
      code: "FREE",
      price: 0,
      interval: "monthly",
      appointmentLimit: 20,
      hasPriorityListing: false,
      hasPatientChat: false,
      hasMarketingBoost: false,
      description: "Limited appointments and basic listing",
    },
    {
      name: "Pro",
      code: "PRO",
      price: 1999,
      interval: "monthly",
      appointmentLimit: 0,
      hasPriorityListing: true,
      hasPatientChat: true,
      hasMarketingBoost: false,
      description: "Unlimited appointments and chat",
    },
    {
      name: "Premium",
      code: "PREMIUM",
      price: 4999,
      interval: "monthly",
      appointmentLimit: 0,
      hasPriorityListing: true,
      hasPatientChat: true,
      hasMarketingBoost: true,
      description: "Featured listing with marketing boost",
    },
  ];

  for (const plan of plans) {
    await Plan.findOneAndUpdate({ code: plan.code }, plan, {
      upsert: true,
      new: true,
    });
  }

  for (const [key, value] of Object.entries(DEFAULTS)) {
    await PlatformSetting.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true },
    );
  }

  const existingAdmin = await User.findOne({
    role: "admin",
    email: "admin@nividoc.com",
  });
  if (!existingAdmin) {
    const admin = new User({
      name: "NiviDoc Admin",
      email: "admin@nividoc.com",
      phone: "+91 9000000000",
      role: "admin",
      authProvider: "local",
      doctorApprovalStatus: "none",
      isEmailVerified: true,
    });
    await admin.setPassword("Admin@12345");
    await admin.save();
  }

  console.log("Seed complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
