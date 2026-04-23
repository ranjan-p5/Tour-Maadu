const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    unique: true,
    sparse: true // allows users without email
  },

  mobile: {
    type: String,
    unique: true,
    sparse: true // allows users without mobile
  },

  password: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("User", userSchema);
