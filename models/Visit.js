const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  date: String,
  visits: {
    type: Number,
    default: 0
  },
  logins: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Visit", visitSchema);