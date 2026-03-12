const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: '👤'
  },
  color: {
    type: String,
    default: '#6C5CE7'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
