const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Use hardcoded URI for now since .env has formatting issues
    const uri = "mongodb+srv://admin:Psingh%4012345@cluster0.dti89.mongodb.net/mini_ai_hrms?retryWrites=true&w=majority";
    const conn = await mongoose.connect(uri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB Connection Failed");
    console.log(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
