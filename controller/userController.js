const bcrypt = require('bcryptjs');
   const jwt = require('jsonwebtoken');
   const User = require('../model/User');

    ///////////////////////////////////////////// Register a new User ///////////////////////////////////////
   const register = async (req, res) => {
     const { email, password, img } = req.body;

     try {
       // Validate input
       if (!email || !password) {
         return res.status(400).json({ message: 'Email and password are required' });
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
         email,
         password: hashedPassword,
         img
       });

       await newUser.save();

       // Generate JWT
       const token = jwt.sign(
         { 
           id: newUser._id,
           email: newUser.email
         },
         process.env.JWT_SECRET,
         { expiresIn: '1h' }
       );

       res.status(201).json({
         token,
         user: {
           id: newUser._id,
           email: newUser.email,
           img: newUser.img
         }
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

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, img } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email }) ||
                          await Admin.findOne({ email }) ||
                          await Organizer.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (img) user.img = img;

    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: 'user',
        img: user.img
      }
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

module.exports = { register, getAllUsers, getUserById, updateUser, deleteUser };

