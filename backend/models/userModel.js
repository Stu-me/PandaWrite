const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetPasswordToken:{
      type:String
    },
    resetPasswordExpire:{
      type:Date
    },
    loginOtpHash: {
      type: String,
    },
    loginOtpExpires: {
      type: Date,
    },
    loginOtpAttempts: {
      type: Number,
      default: 0,
    },
    loginOtpRequestedAt: {
      type: Date,
    },
    currentStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    role: {
      type: String,
      enum: ['user', 'masterAdmin'],
      default: 'user',
    },
    // Stores recent authenticated activity for the admin's online/offline indicator.
    lastSeenAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Supports the activity lookup used by the scalable admin user table.
userSchema.index({ role: 1, lastSeenAt: -1 });

module.exports = mongoose.model("User", userSchema);
