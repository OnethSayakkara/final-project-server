import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import cloudinary from 'cloudinary';
import handleMulterError from '../middleware/multer.js';


///////////////////////////////////////////// Register a new User ///////////////////////////////////////
const register = async (req, res) => {
  const { firstName, lastName, phoneNumber, email, password, img } = req.body;

  try {
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email and password are required' });
    }

    // Check if email already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      phoneNumber, // optional
      email,
      password: hashedPassword,
      img,
    });

    await newUser.save();

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' } // short lived
    );

    const refreshToken = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' } // longer lived
    );

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // https only in prod
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response with access token and user info
    res.status(201).json({
      accessToken,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        img: newUser.img,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


///////////////////////////////////////////// Get all Users /////////////////////////////////////////
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//////////////////////////////////////////// Get User by ID ////////////////////////////////////////
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//////////////////////////////////////////// Update User /////////////////////////////////////
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const updateUser = async (req, res) => {
  try {
    // Handle multer errors first
    await new Promise((resolve, reject) => {
      handleMulterError(req, res, (err) => (err ? reject(err) : resolve()));
    });

    const { id } = req.params;
    const { firstName, lastName, phoneNumber, password } = req.body;
    const file = req.files?.Img?.[0]; // multer field name is 'Img'

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update optional fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (password) user.password = await bcrypt.hash(password, 10);

    // Handle image upload if a file is provided
    if (file) {
      const result = await cloudinary.v2.uploader.upload(file.path, {
        folder: 'users/',
        use_filename: true,
        unique_filename: false,
      });
      user.img = result.secure_url; // save Cloudinary URL in MongoDB
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        img: user.img,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//////////////////////////////////////////// Delete User /////////////////////////////////////
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { register, getAllUsers, getUserById, updateUser, deleteUser };