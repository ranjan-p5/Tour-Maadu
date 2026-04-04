const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  email: String,
  destination: String,
  date: String,
  budget: String
});

module.exports = mongoose.model("Trip", tripSchema);