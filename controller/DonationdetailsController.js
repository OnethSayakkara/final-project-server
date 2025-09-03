import mongoose from "mongoose";
import Donation from "../model/Donation.js";

export const getUserDonationSummary = async (req, res) => {
  try {
    const userId = req.params.userId; // Get userId from route parameter

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Aggregation pipeline
    const summary = await Donation.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId), // Match by user
          status: "succeeded", // Only successful donations
        },
      },
      {
        $group: {
          _id: null,
          totalAmountMinor: { $sum: "$amountMinor" }, // Sum of all donations
          donationCount: { $sum: 1 }, // Count all donations (not unique)
        },
      },
      {
        $project: {
          _id: 0,
          totalAmountMinor: 1,
          donationCount: 1,
        },
      },
    ]);

    // If no donations found, return zeros
    const result =
      summary.length > 0
        ? summary[0]
        : { totalAmountMinor: 0, donationCount: 0 };

    res.json({
      success: true,
      data: {
        totalAmountMinor: result.totalAmountMinor,
        totalAmount: result.totalAmountMinor / 100, // Convert minor → major unit
        donationCount: result.donationCount, // ✅ total number of donations
      },
    });
  } catch (err) {
    console.error("Error fetching donation summary:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getDonationHistoryByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find all donations by this user & populate event details
    const donations = await Donation.find({
      user: new mongoose.Types.ObjectId(userId),
      status: "succeeded", // only successful donations
    })
      .populate("event", "_id title category greetingSentence") // only bring event title & category
      .sort({ createdAt: -1 }); // newest first

    // Map to required fields
    const history = donations.map((donation) => ({
      eventName: donation.event?.title || "Unknown Event",
      donatedDate: donation.createdAt,
      eventCategory: donation.event?.category || "Unknown",
      greetingSentence: donation.event?.greetingSentence,
      amountMinor: donation.amountMinor,
      event: donation.event,
    }));

    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    console.error("Error fetching donation history:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default { getUserDonationSummary, getDonationHistoryByUser };
