const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Update profile image
router.post('/profile-image', auth, async (req, res) => {
  console.log('Profile image update request received:', req.body);
  try {
    const { profileImage } = req.body;
    const firebaseUid = req.user.userId;
    const email = req.user.email;
    console.log('Updating profile image for user:', firebaseUid);

    if (!profileImage) {
      console.log('No profile image URL provided');
      return res.status(400).json({ message: 'Profile image URL is required' });
    }

    if (!firebaseUid) {
      console.log('No user ID found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!email) {
      console.log('No email found in request');
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the user first to verify they exist
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
      // Create new user if they don't exist
      user = new User({
        firebaseUid,
        name: 'New User',
        email: email,
        shopName: 'My Shop',
        profileImage
      });
      await user.save();
    } else {
      // Update existing user's profile image
      user = await User.findOneAndUpdate(
        { firebaseUid },
        { profileImage },
        { new: true }
      );
    }

    console.log('Profile image updated successfully for user:', firebaseUid);
    res.json({ profileImage: user.profileImage });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ message: 'Error updating profile image', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, shopName } = req.body;
    const firebaseUid = req.user.userId;
    const userEmail = req.user.email;
    console.log('Updating profile for user:', firebaseUid);

    // Find the user first to verify they exist
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
      // Create new user if they don't exist
      user = new User({
        firebaseUid,
        name: name || 'New User',
        email: userEmail,
        shopName: shopName || 'My Shop'
      });
      await user.save();
    } else {
      // Update existing user
      const updateData = {
        name,
        shopName
      };

      // If email is being changed, verify it's not already in use
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email, firebaseUid: { $ne: firebaseUid } });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        updateData.email = email;
      }

      user = await User.findOneAndUpdate(
        { firebaseUid },
        updateData,
        { new: true }
      ).select('-password');
    }

    console.log('Profile updated successfully for user:', firebaseUid);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      shopName: user.shopName,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router; 