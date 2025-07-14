import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../model/Admin.js';
import Organizer from '../model/Organizer.js';
import User from '../model/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = (await Admin.findOne({ email })) ||
               (await Organizer.findOne({ email })) ||
               (await User.findOne({ email }));

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' },
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use https in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        img: user.img, // Fixed typo: 'Img' to 'img' to match schema
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const refreshToken = (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const newAccessToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' },
    );

    res.json({ accessToken: newAccessToken });
  });
};



 const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Create token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // valid 1 hour
    await user.save();

    // Email setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,     // Gmail
        pass: process.env.EMAIL_PASS      // Gmail app password
      }
    });

    const resetURL = `http://localhost:3000/reset-password/${user._id}/${token}`;

    await transporter.sendMail({
      to: user.email,
      subject: 'Reset your password',
      html: `<p>Click <a href="${resetURL}">here</a> to reset your password. Link valid for 1 hour.</p>`
    });

    res.json({ message: 'Reset link sent to your email' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



 const resetPassword = async (req, res) => {
  const { userId, token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      _id: userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired link' });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password updated successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export { login, refreshToken, forgotPassword, resetPassword };