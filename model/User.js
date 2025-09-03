import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    email: { 
      type: String,
      required: true, 
      unique: true,
    },
    password: { 
      type: String, 
      required: true
    },
    img: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      default: 'user'
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
