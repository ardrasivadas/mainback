const mongoose = require("mongoose");

const UserSignInLogSchema = new mongoose.Schema({
    username: { type: String, required: true },
    ipAddress: String,
    userAgent: String,
    loginTime: { type: Date, default: Date.now },
    role: { type: String, default: "user" } 
});

const UserSignInLog = mongoose.model("UserSignInLog", UserSignInLogSchema);

module.exports = UserSignInLog;
