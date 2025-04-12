const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user' // 👈 isko 'user' likhna zaruri hai, jaisa tumne user model banaya hai
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
