const jwt = require('jsonwebtoken');
   const Admin = require('../model/Admin');
   const Organizer = require('../model/Organizer');
   const User = require('../model/User');

   // Unified login function
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

       // Note: In production, use bcrypt to compare hashed passwords
       if (user.password !== password) {
         return res.status(401).json({ message: 'Invalid credentials' });
       }

       // Generate JWT
       const token = jwt.sign(
         { 
           id: user._id,
           email: user.email,
           role: user.role 
         },
         process.env.JWT_SECRET,
         { expiresIn: '1h' }
       );

       res.json({
         token,
         user: {
           id: user._id,
           email: user.email,
           role: user.role,
           img: user.img
         }
       });
     } catch (error) {
       res.status(500).json({ message: 'Server error', error: error.message });
     }
   };

   module.exports = { login };