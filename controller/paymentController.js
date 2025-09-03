import Stripe from "stripe";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from 'cloudinary';
import Donation from "../model/Donation.js";
import Event from "../model/Event.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for bank slip uploads with memory storage for Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only images and PDFs
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG, and PDF files are allowed'));
        }
    }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, options) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: 'donation-receipts',
                ...options
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(buffer);
    });
};

// ✅ Create Checkout Session (Fixed)
export const createCheckoutSession = async (req, res) => {
    try {
        const {
            eventId,
            userId,
            amount,
            currency,
            email,
            firstName,
            lastName,
            mobileNumber,
            anonymous,
            supportMessage
        } = req.body;

        console.log('Creating checkout session with data:', req.body);

        const amountMinor = amount * 100; // Stripe needs cents

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: currency || 'lkr',
                        product_data: {
                            name: `Donation for Event ${eventId}`,
                        },
                        unit_amount: amountMinor,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            customer_email: email,
            success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/cancel`,
            metadata: {
                eventId,
                userId: userId || "guest",
                firstName,
                lastName,
                mobileNumber,
                anonymous: anonymous?.toString() || "false",
                supportMessage: supportMessage || "",
            },
        });

        console.log('✅ Checkout session created:', session.id);
        res.json({ url: session.url });

    } catch (err) {
        console.error("Error creating checkout session:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ Bank Slip Donation (Updated with Cloudinary)
export const handleBankSlipDonation = async (req, res) => {
    try {
        const {
            eventId,
            amount,
            email,
            firstName,
            lastName,
            mobileNumber,
            anonymous,
            supportMessage
        } = req.body;

        const bankSlipFile = req.file;

        console.log('Bank slip donation data:', req.body);

        if (!bankSlipFile) {
            return res.status(400).json({ error: "Bank slip file is required" });
        }

        if (!eventId || !amount || !email || !firstName || !lastName) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Upload bank slip to Cloudinary
        let bankSlipUrl;
        try {
            const uploadResult = await uploadToCloudinary(bankSlipFile.buffer, {
                public_id: `bank-slip-${Date.now()}`,
                resource_type: 'auto'
            });
            bankSlipUrl = uploadResult.secure_url;
            console.log('✅ Bank slip uploaded to Cloudinary:', bankSlipUrl);
        } catch (uploadError) {
            console.error('Error uploading to Cloudinary:', uploadError);
            return res.status(500).json({ error: "Failed to upload bank slip" });
        }

        // Create donation with 'processing' status for bank slip donations
        const donation = await Donation.create({
            event: eventId,
            user: req.body.userId || null, // Set from request if available
            amountMinor: amount * 100, // Convert to minor unit for consistency
            currency: 'lkr',
            paymentIntentId: null, // No payment intent for bank slip
            status: 'processing', // Bank slip donations need manual verification
            email: email,
            firstName: firstName,
            lastName: lastName,
            mobileNumber: mobileNumber,
            anonymous: anonymous === 'true' || anonymous === true,
            supportMessage: supportMessage || '',
            bankSlipPath: bankSlipUrl, // Store Cloudinary URL instead of local path
        });

        console.log("✅ Bank slip donation created:", donation._id);

        res.json({
            success: true,
            message: "Bank slip donation submitted successfully",
            donationId: donation._id
        });

    } catch (err) {
        console.error("Error processing bank slip donation:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ✅ Webhook handler (Updated with Event auto-updates)
export const handleWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("⚠️ Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            console.log("💰 Donation completed:", session.id);

            try {
                // 1️⃣ Save Donation in DB
                const donation = await Donation.create({
                    event: session.metadata.eventId,
                    user: session.metadata.userId !== "guest" ? session.metadata.userId : null,
                    amountMinor: session.amount_total / 100, // save in major units
                    currency: session.currency,
                    paymentIntentId: session.payment_intent,
                    status: "succeeded",
                    email: session.customer_details?.email || session.metadata.email,
                    firstName: session.metadata.firstName,
                    lastName: session.metadata.lastName,
                    mobileNumber: session.metadata.mobileNumber,
                    anonymous: session.metadata.anonymous === "true",
                    supportMessage: session.metadata.supportMessage || "",
                });

                console.log("✅ Donation saved:", donation._id);

                // 2️⃣ Update Event raisedAmount + JoinedUsers
                const updatedEvent = await Event.findByIdAndUpdate(
                    session.metadata.eventId,
                    {
                        $inc: { raisedAmount: session.amount_total / 100 },
                        $addToSet: {
                            JoinedUsers: session.metadata.userId !== "guest" ? session.metadata.userId : null
                        }
                    },
                    { new: true }
                );

                console.log("✅ Event updated:", updatedEvent?._id, "raised =", updatedEvent?.raisedAmount);

                // 3️⃣ Auto mark event as Completed if goal reached
                if (updatedEvent && updatedEvent.raisedAmount >= updatedEvent.fundingGoal) {
                    if (updatedEvent.programmeStatus !== "Completed") {
                        updatedEvent.programmeStatus = "Completed";
                        await updatedEvent.save();
                        console.log("🎉 Event goal reached! Marked Completed:", updatedEvent._id);
                    }
                }

                // 4️⃣ Generate and upload receipt
                try {
                    const receiptData = {
                        donationId: donation._id,
                        amount: session.amount_total / 100,
                        currency: session.currency,
                        donorName: `${session.metadata.firstName} ${session.metadata.lastName}`,
                        email: session.customer_details?.email,
                        date: new Date().toISOString(),
                        paymentIntentId: session.payment_intent,
                    };

                    const receiptText = `
DONATION RECEIPT
================
Donation ID: ${receiptData.donationId}
Amount: ${receiptData.currency.toUpperCase()} ${receiptData.amount}
Donor: ${receiptData.donorName}
Email: ${receiptData.email}
Date: ${new Date(receiptData.date).toLocaleString()}
Payment ID: ${receiptData.paymentIntentId}
================
Thank you for your generous donation!
          `;

                    const receiptUpload = await uploadToCloudinary(Buffer.from(receiptText, "utf-8"), {
                        public_id: `receipt-${donation._id}`,
                        resource_type: "raw",
                        format: "txt",
                    });

                    await Donation.findByIdAndUpdate(donation._id, {
                        receiptUrl: receiptUpload.secure_url,
                    });

                    console.log("✅ Receipt uploaded:", receiptUpload.secure_url);
                } catch (receiptError) {
                    console.error("⚠️ Receipt upload failed:", receiptError);
                }
            } catch (dbError) {
                console.error("❌ Database error in webhook:", dbError);
                return res.status(500).json({ error: "Database error" });
            }

            break;
        }

        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object;
            console.log("❌ Payment failed:", paymentIntent.id);

            try {
                await Donation.findOneAndUpdate(
                    { paymentIntentId: paymentIntent.id },
                    { status: "canceled" }
                );
            } catch (error) {
                console.error("Error updating failed payment:", error);
            }
            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};


// ✅ Approve Bank Slip Donation (Updated)
export const approveBankSlipDonation = async (req, res) => {
    try {
        const { donationId } = req.params;
        const adminUserId = req.user?.id; // Assuming you have auth middleware

        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ error: "Donation not found" });
        }

        if (donation.status !== 'processing') {
            return res.status(400).json({ error: "Donation is not in processing status" });
        }

        // Update donation status to succeeded
        donation.status = 'succeeded';
        donation.verifiedAt = new Date();
        donation.verifiedBy = adminUserId;
        await donation.save();

        // Update event raised amount
        const updatedEvent = await Event.findByIdAndUpdate(
            donation.event,
            { $inc: { raisedAmount: donation.amountMinor / 100 } },
            { new: true }
        );

        console.log("✅ Bank slip donation approved:", donationId);
        console.log("✅ Event raised amount updated:", updatedEvent?.raisedAmount);

        res.json({
            success: true,
            message: "Bank slip donation approved successfully",
            newRaisedAmount: updatedEvent?.raisedAmount
        });

    } catch (err) {
        console.error("Error approving bank slip donation:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Export multer upload middleware
export { upload };