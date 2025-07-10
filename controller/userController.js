const bcrypt = require('bcryptjs');
   const jwt = require('jsonwebtoken');
   const User = require('../model/User');

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

       // Save user
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

   module.exports = { register };