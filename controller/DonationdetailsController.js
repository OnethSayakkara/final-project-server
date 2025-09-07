import mongoose from "mongoose";
import Donation from "../model/Donation.js";
import BankSlipDonation from "../model/BankSlipDonation.js";
import Event from "../model/Event.js";

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


export const getOrganizerDonationProgress = async (req, res) => {
  try {
    const { organizerId } = req.params;

    // 1. Get only FUNDRAISING events owned by this organizer
    const events = await Event.find({
      organizer: organizerId,
      type: "fundraising"
    }).select("_id title createdAt");

    if (!events.length) {
      return res.status(404).json({ message: "No fundraising events found for this organizer" });
    }

    const eventIds = events.map(e => e._id);

    // 2. Donations aggregation (group by month)
    const donationAgg = await Donation.aggregate([
      { $match: { event: { $in: eventIds } } },
      {
        $group: {
          _id: {
            event: "$event",
            month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
          },
          donationTotal: { $sum: "$amountMinor" }  // ✅ direct sum in LKR
        }
      }
    ]);

    // 3. BankSlipDonation aggregation (group by month)
    const bankSlipAgg = await BankSlipDonation.aggregate([
      { $match: { eventId: { $in: eventIds }, DonationAdminStatus: "Approved" } },
      {
        $group: {
          _id: {
            event: "$eventId",
            month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
          },
          bankSlipTotal: { $sum: "$amount" } // ✅ already in LKR
        }
      }
    ]);

    // 4. Merge results
    const merged = {};

    donationAgg.forEach(d => {
      const key = `${d._id.event}_${d._id.month}`;
      merged[key] = {
        event: d._id.event.toString(),
        month: d._id.month,
        donationTotal: d.donationTotal,
        bankSlipTotal: 0,
      };
    });

    bankSlipAgg.forEach(b => {
      const key = `${b._id.event}_${b._id.month}`;
      if (!merged[key]) {
        merged[key] = {
          event: b._id.event.toString(),
          month: b._id.month,
          donationTotal: 0,
          bankSlipTotal: b.bankSlipTotal,
        };
      } else {
        merged[key].bankSlipTotal = b.bankSlipTotal;
      }
    });

    // 5. Attach event names + overall summary + start month
    const response = {};

    for (let e of events) {
      const monthlyTotals = Object.values(merged)
        .filter(r => r.event === e._id.toString())
        .map(r => ({
          month: r.month, // format "2025-09"
          donationTotal: r.donationTotal,
          bankSlipTotal: r.bankSlipTotal,
          grandTotal: r.donationTotal + r.bankSlipTotal,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const totalDonation = monthlyTotals.reduce((a, b) => a + b.donationTotal, 0);
      const totalBankSlip = monthlyTotals.reduce((a, b) => a + b.bankSlipTotal, 0);

      // Event start month from createdAt
      const createdAt = new Date(e.createdAt);
      const startMonth = createdAt.toLocaleString("en-US", { month: "long", year: "numeric" });

      response[e.title] = {
        startMonth,
        monthlyTotals,
        overallSummary: {
          totalDonation,
          totalBankSlip,
          grandTotal: totalDonation + totalBankSlip,
        }
      };
    }

    res.json(response);

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



export default { getUserDonationSummary, getDonationHistoryByUser, getOrganizerDonationProgress };
