import mongoose from "mongoose";

const signInLogSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
});

const SignInLog = mongoose.model("SignInLog", signInLogSchema);

export default SignInLog;