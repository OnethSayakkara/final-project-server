import express from "express";
import { 
  createCheckoutSession, 
  handleWebhook, 
  handleBankSlipDonation,
  approveBankSlipDonation,
  upload 
} from "../controller/paymentController.js";

const router = express.Router();

// Stripe checkout
router.post("/create-checkout-session", createCheckoutSession);

// Stripe webhook (⚠️ raw body already applied in server.js)
router.post("/webhook", handleWebhook);

// Bank slip
router.post("/bank-slip-donation", upload.single('bankSlip'), handleBankSlipDonation);

// Approve bank slip
router.patch("/approve-bank-slip/:donationId", approveBankSlipDonation);

export default router;
