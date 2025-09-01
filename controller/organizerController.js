import Organizer from '../model/Organizer.js'; // Adjust path
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

    const { email, password, category } = req.body; // Note: 'category' was a typo in your request; assuming it's not needed for organizers

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if email already exists
    let existingOrganizer = await Organizer.findOne({ email });
    if (existingOrganizer) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Construct organizer data
    const organizerData = {
      email,
      password: hashedPassword,
      img: req.file ? `/uploads/${req.file.filename}` : null, // Store image path if uploaded
      role: 'organizer', // Default from schema
    };

    // Create new organizer
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

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send response with access token and organizer info
    res.status(201).json({
      accessToken,
      user: {
        id: newOrganizer._id,
        email: newOrganizer.email,
        img: newOrganizer.img,
        role: newOrganizer.role,
      },
    });
  } catch (error) {
    console.error('Error registering organizer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export default { registerOrganizer };
