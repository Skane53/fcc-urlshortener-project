const mongoose = require("mongoose");

const shortUrlSchema = {
  original_url: { type: String, required: true, unique: true },
  short_url: { type: Number, unique: true },
};

const ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);

module.exports = ShortUrl;
