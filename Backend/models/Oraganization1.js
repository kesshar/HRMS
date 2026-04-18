const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    industry: {
      type: String,
    },

    companySize: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization1", organizationSchema);