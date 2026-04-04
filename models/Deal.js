const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema({
  title: String,
  discount: String,
  price: String,
  link: String
});

module.exports = mongoose.model("Deal", dealSchema,"deals collection");