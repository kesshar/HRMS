const mongoose = require("mongoose");

const groupTaskSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupProject",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Submitted", "Completed"],
      default: "Pending",
    },
    deadline: {
      type: Date,
    },
    proofType: {
      type: String,
      enum: ["text", "url", "image", "none"],
      default: "none",
    },
    proofContent: {
      type: String, // Can store base64 image data, a URL, or pure text
      default: "",
    },
    hrFeedback: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GroupTask", groupTaskSchema);
