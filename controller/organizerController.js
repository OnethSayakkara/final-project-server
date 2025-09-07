import Organizer from '../model/Organizer.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import handleMulterError from '../middleware/multer.js';

const registerOrganizer = async (req, res) => {
  try {
    // Handle Multer upload
    await new Promise((resolve, reject) => {
      handleMulterError(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Destructure all required fields from the request body
    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      password,
      bank,
      accountName,
      accountNumber,
      Branch
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !bank || !accountName || !accountNumber || !Branch) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check if email already exists
    const existingOrganizer = await Organizer.findOne({ email });
    if (existingOrganizer) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Construct organizer data
    const organizerData = {
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      img: req.files?.Img ? `/uploads/${req.files.Img[0].filename}` : null, // Multer saves file under Img field
      role: 'organizer',
      bank,
      accountName,
      accountNumber,
      Branch
    };

    // Save new organizer
    const newOrganizer = new Organizer(organizerData);
    await newOrganizer.save();

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        id: newOrganizer._id,
        email: newOrganizer.email,
        role: newOrganizer.role,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      {
        id: newOrganizer._id,
        email: newOrganizer.email,
        role: newOrganizer.role,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response
    res.status(201).json({
      accessToken,
      user: {
        id: newOrganizer._id,
        firstName: newOrganizer.firstName,
        lastName: newOrganizer.lastName,
        phoneNumber: newOrganizer.phoneNumber,
        email: newOrganizer.email,
        img: newOrganizer.img,
        role: newOrganizer.role,
        bank: newOrganizer.bank,
        accountName: newOrganizer.accountName,
        accountNumber: newOrganizer.accountNumber,
        Branch: newOrganizer.Branch
      },
    });
  } catch (error) {
    console.error('Error registering organizer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export default { registerOrganizer };
