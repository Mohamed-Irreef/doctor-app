const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is required");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== "production",
  });
}

module.exports = { connectDB };
