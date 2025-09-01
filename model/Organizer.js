import mongoose from 'mongoose';

const organizerSchema = new mongoose.Schema({

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
    type:String,
    required: false, 

},
role: {
    type: String,
    default: 'organizer'
  }
}, { timestamps: true });

export default mongoose.model('Organizer', organizerSchema);
