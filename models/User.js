const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: String,
  account: {
    username: String,
    phone: Number,
    picture: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  token: String,
  hash: String,
  salt: String,
  purchase: [{ type: mongoose.Schema.Types.Mixed, default: {} }],
});

module.exports = User;
