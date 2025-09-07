import BankSlipDonation from "../model/BankSlipDonation.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const createBankSlipDonation = async (req, res) => {
  try {
    const { eventId, userId, amount, firstName, lastName, email, phoneNumber } = req.body;

    // Upload image to Cloudinary
    let imageUrl = null;
    if (req.files?.Img && req.files.Img[0]) {
      const file = req.files.Img[0];
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: "bank-slip-donations",
        resource_type: "image",
      });
      imageUrl = uploadResult.secure_url;

      // Remove local file
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error("Error deleting local file:", err);
      }
    } else {
      return res.status(400).json({ message: "Bank slip image is required" });
    }

    // Save donation
    const donation = new BankSlipDonation({
      eventId,
      userId,
      amount,
      firstName,
      lastName,
      email,
      phoneNumber,
      img: imageUrl,
    });

    const savedDonation = await donation.save();

    res.status(201).json({
      message: "Donation submitted successfully. Awaiting admin approval.",
      donation: savedDonation,
    });
  } catch (error) {
    console.error("Error creating bank slip donation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all donations
export const getAllBankSlipDonations = async (req, res) => {
  try {
    const donations = await BankSlipDonation.find()
      .populate("eventId", "title")
      .populate("userId", "firstName lastName email");
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update donation status (Admin use)
export const updateBankSlipDonationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const donation = await BankSlipDonation.findById(id);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    donation.DonationAdminStatus = status;
    await donation.save();

    res.json({ message: "Donation status updated successfully", donation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {  createBankSlipDonation, updateBankSlipDonationStatus };
