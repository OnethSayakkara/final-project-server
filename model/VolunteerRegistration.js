import mongoose from 'mongoose';

const volunteerRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    specialRequirements: {
      type: String,
      required: false,
      trim: true,
    },
    status: {
      type: String,
      enum: ['registered', 'cancelled'],
      default: 'registered',
    },
    isParticipated: {
      type: Boolean,
      default: false, // initially false until event ends and marked by organizer
    },
  },
  { timestamps: true }
);

export default mongoose.model('VolunteerRegistration', volunteerRegistrationSchema);
