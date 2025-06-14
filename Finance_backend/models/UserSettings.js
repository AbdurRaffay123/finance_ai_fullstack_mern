const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  preferences: {
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'English' },
    theme: { type: String, default: 'light' }
  },
  profile: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    profilePhoto: { type: String, default: '' } // Store image URL or base64 string
  }
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', userSettingsSchema);
