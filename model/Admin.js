import mongoose from 'mongoose';

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
  img: {
    type: String,
    required: false 
  },
  role: {
    type: String,
    default: 'admin'
  }
}, { timestamps: true });

export default mongoose.model('Admin', userSchema);