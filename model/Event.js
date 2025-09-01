import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['fundraising', 'goods_collection', 'volunteer', 'mixed'],
    required: true
  },
  fundingGoal: {
    type: Number,
    required: function() {
      return this.type === 'fundraising' || this.type === 'mixed';
    }
  },
  raisedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  img: {
    type: String, // Store image URL or path
    required: false,
    default: null
  },
  eventDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  JoinedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['pending_review', 'approved', 'rejected'],
    default: 'pending_review'
  },
  predictionType: {
    type: String,
    required: false,
  },
  predictionValue: {
    type: Number,
    required: false
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Event', eventSchema);