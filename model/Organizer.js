import mongoose from 'mongoose';

const organizerSchema = new mongoose.Schema({


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
    unique: true
  },
  password: {
    type: String,
    required: true,
    unique: true
  },
  img: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    default: 'organizer'
  },
  bank: {
    type: String,
    required: true,
  },
  accountName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  Branch: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model('Organizer', organizerSchema);
