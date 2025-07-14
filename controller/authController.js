import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../model/Admin.js';
import Organizer from '../model/Organizer.js';
import User from '../model/User.js';

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

export { login, refreshToken };