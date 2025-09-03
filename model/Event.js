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
  programmeStatus: {
    type: String,
    enum: ['Active', 'Expired', 'Completed'],
    default: 'Active'
  },
  raisedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    enum: ['Healthcare', 'Community', 'Animal Welfare', 'Education', 'Emergency', 'Environment', 'Cancer', 'sports'],
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
  },
  greetingSentence:{
      type: String,
      required: false

  },
documents: [{
  type: String,
  validate: {
    validator: function(v) {
      return /\.(pdf|png|jpeg|jpg)$/i.test(v);
    },
    message: props => `${props.value} is not a valid file!`
  }
}]


}, {
  timestamps: true
});

export default mongoose.model('Event', eventSchema);