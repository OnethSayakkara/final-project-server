const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  email: { 
    type: String,
     required: true, 
     unique: true 
    },
  password: { 
    type: String, 
    required: true, 
     unique: true 
},
Img: {
    type:String,
    required: false, 

},
role: {
    type: String,
    default: 'user'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
