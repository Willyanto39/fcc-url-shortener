const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true
  },
  shortUrl: Number
});

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;