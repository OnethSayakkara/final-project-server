const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: { 
    type: String, 
    required: true 
},
  userEmail: { 
    type: String,
     required: true, 
     unique: true 
    },
  password: { 
    type: String, 
    required: true 
},
userImg: {
    type:String,

},

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
