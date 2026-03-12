const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Category type is required']
  },
  emoji: {
    type: String,
    default: '📋'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

categorySchema.index({ type: 1, name: 1 });

module.exports = mongoose.model('Category', categorySchema);
