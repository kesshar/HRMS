const mongoose = require("mongoose");

const leavePolicySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
    },
    default_CL: {
      type: Number,
      default: 10,
    },
    default_SL: {
      type: Number,
      default: 5,
    },
    default_PL: {
      type: Number,
      default: 15,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeavePolicy", leavePolicySchema);
