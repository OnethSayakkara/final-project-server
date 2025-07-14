import bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import Admin from '../model/Admin.js';
import Organizer from '../model/Organizer.js';
import User from '../model/User.js';
import cloudinary from '../config/cloudinary.js';

///////////////////////////////////////// Create a new Admin ///////////////////////////////////////
const createAdmin = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  const { email, password } = req.body;
  const file = req.file;

  try {
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check for existing user
    const existingUser = await Admin.findOne({ email }); // Assuming only Admin model is relevant
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    let imgUrl = '';
    if (file) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET, // Ensure this is set in .env
          folder: 'admins',
        });
        imgUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        throw new Error('Failed to upload image to Cloudinary');
      } finally {
        // Clean up the uploaded file
        await fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      email,
      password: hashedPassword,
      img: imgUrl,
      role: 'admin',
    });

    await newAdmin.save();

    res.status(201).json({
      user: {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role,
        img: newAdmin.img,
      },
    });
  } catch (error) {
    // Ensure file is deleted on error if it exists
    if (file) {
      await fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/////////////////////////////////////////// Get all Admins /////////////////////////////////////////
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password'); // Exclude password
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/////////////////////////////////////////// Get Admin by ID ////////////////////////////////////////
const getAdminById = async (req, res) => {
  const { id } = req.params;

  try {
    const admin = await Admin.findById(id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//////////////////////////////////////////// Update Admin /////////////////////////////////////
const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { email, password, img } = req.body;

  try {
    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check for email conflict
    if (email && email !== admin.email) {
      const existingUser = (await Admin.findOne({ email })) ||
                          (await Organizer.findOne({ email })) ||
                          (await User.findOne({ email }));
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    // Update fields
    if (email) admin.email = email;
    if (password) admin.password = await bcrypt.hash(password, 10);
    if (img) admin.img = img;

    // Save updated admin
    await admin.save();

    res.json({
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        img: admin.img,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/////////////////////////////////////////////// Delete Admin /////////////////////////////////////
const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await admin.deleteOne();
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { createAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin };