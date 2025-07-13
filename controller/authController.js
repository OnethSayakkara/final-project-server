const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../model/Admin');
const Organizer = require('../model/Organizer');
const User = require('../model/User');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check all three collections
    let user = await Admin.findOne({ email }) ||
              await Organizer.findOne({ email }) ||
              await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate access token (expires in 5 hours)
    const accessToken = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    // Generate refresh token (expires in 7 days)
    const refreshToken = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in user document
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        img: user.Img
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user with matching refresh token
    let user = await Admin.findOne({ _id: decoded.id, refreshToken }) ||
              await Organizer.findOne({ _id: decoded.id, refreshToken }) ||
              await User.findOne({ _id: decoded.id, refreshToken });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        img: user.Img
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token', error: error.message });
  }
};

module.exports = { login, refreshAccessToken };