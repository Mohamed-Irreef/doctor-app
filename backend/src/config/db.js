const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is required");
  }

  mongoose.set("strictQuery", true);
  const mongoDb = await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== "production",
  });
  console.log("Mongodb Database Name: "+mongoDb.connection.db.databaseName);
}

module.exports = { connectDB };
