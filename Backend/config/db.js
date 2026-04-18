const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use hardcoded URI for now since .env has formatting issues
    const uri = process.env.MONGO_URI;
    const conn = await mongoose.connect(uri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB Connection Failed");
    console.log(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
