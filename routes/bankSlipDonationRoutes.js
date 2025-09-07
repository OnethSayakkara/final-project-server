import express from "express";
import handleMulterError from "../middleware/multer.js";
import bankSlipDonationController from "../controller/bankSlipDonationController.js";

const router = express.Router();

// Create donation
router.post("/registerbankslip", handleMulterError, bankSlipDonationController.createBankSlipDonation);

// Update donation status (Admin)
router.put("/updatebankslip/:id", bankSlipDonationController.updateBankSlipDonationStatus);

export default router;
