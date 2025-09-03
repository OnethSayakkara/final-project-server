import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },

    amountMinor: { type: Number, required: true }, // Amount in minor currency units (cents)
    currency: { type: String, default: 'lkr' },

    paymentIntentId: { type: String, index: true }, // Not required for bank slip donations
    status: {
      type: String,
      enum: ['succeeded', 'processing', 'canceled', 'requires_payment_method'],
      default: 'processing' // Default to processing for bank slip donations
    },

    // Donor Information
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    anonymous: { type: Boolean, default: false },

    // Bank slip specific fields
    bankSlipPath: { type: String }, // Cloudinary URL for uploaded bank slip file
    verifiedAt: { type: Date }, // When the donation was verified
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who verified

    // Receipt URL from Cloudinary
    receiptUrl: { type: String }, // Generated receipt stored in Cloudinary

    // Support message from donor
    supportMessage: { type: String, default: '' },

    // Metadata for tracking
    paymentMethod: { 
      type: String, 
      enum: ['card', 'bank_slip'], 
      default: function() {
        return this.paymentIntentId ? 'card' : 'bank_slip';
      }
    },
  },
  { 
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// Ensure paymentIntentId is unique only when it exists (not for bank slip donations)
DonationSchema.index({ paymentIntentId: 1 }, { 
  unique: true, 
  partialFilterExpression: { paymentIntentId: { $exists: true } } 
});

// Index for faster queries
DonationSchema.index({ event: 1, status: 1 });
DonationSchema.index({ user: 1, status: 1 });
DonationSchema.index({ email: 1 });

// Virtual for full name
DonationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for amount in major currency units
DonationSchema.virtual('amount').get(function() {
  return this.amountMinor / 100;
});

// Ensure virtuals are included in JSON output
DonationSchema.set('toJSON', { virtuals: true });
DonationSchema.set('toObject', { virtuals: true });

export default mongoose.model('Donation', DonationSchema);