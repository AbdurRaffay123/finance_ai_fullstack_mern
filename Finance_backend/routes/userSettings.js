const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const UserSettings = require('../models/UserSettings');
const User = require('../models/User');

// JWT middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access denied' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Multer setup for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public/uploads/profilePhotos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'), false);
    }
    cb(null, true);
  },
}).single('photo');

// GET UserSettings for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = new UserSettings({ userId: req.user.id });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user settings' });
  }
});

// UPDATE UserSettings (profile info + preferences)
router.put('/', verifyToken, async (req, res) => {
  try {
    const { profile, preferences } = req.body;

    let settings = await UserSettings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = new UserSettings({ userId: req.user.id });
    }

    if (profile) {
      settings.profile.fullName = profile.fullName ?? settings.profile.fullName;
      settings.profile.email = profile.email ?? settings.profile.email;
      settings.profile.phone = profile.phone ?? settings.profile.phone;
      // Do not update profilePhoto here; use upload endpoint
    }
    if (preferences) {
      settings.preferences.currency = preferences.currency ?? settings.preferences.currency;
      settings.preferences.language = preferences.language ?? settings.preferences.language;
      settings.preferences.theme = preferences.theme ?? settings.preferences.theme;
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user settings' });
  }
});

// Upload profile photo
router.post('/profile/photo', verifyToken, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Profile photo upload error:', err);
      return res.status(400).json({ message: err.message || 'Failed to upload profile photo' });
    }

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
      let settings = await UserSettings.findOne({ userId: req.user.id });
      if (!settings) {
        settings = new UserSettings({ userId: req.user.id });
      }

      settings.profile.profilePhoto = `/uploads/profilePhotos/${req.file.filename}`;
      await settings.save();

      res.json({ profilePhoto: settings.profile.profilePhoto });
    } catch (error) {
      console.error('Error saving profile photo URL:', error);
      res.status(500).json({ message: 'Failed to save profile photo info' });
    }
  });
});

/* ----------- Security Routes (email + password update) -------------- */

// PUT update email and/or password
router.put('/security', verifyToken, async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check email uniqueness if changed
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

      user.password = newPassword; // password hashing handled by pre-save hook
    }

    await user.save();

    res.json({ message: 'User security info updated successfully' });
  } catch (err) {
    console.error('Failed to update user security:', err);
    res.status(500).json({ message: 'Failed to update user security info' });
  }
});

module.exports = router;
