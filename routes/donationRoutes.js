import express from 'express';
import DonationdetailsController from '../controller/DonationdetailsController.js';


const router = express.Router();


router.get('/summary/:userId', DonationdetailsController.getUserDonationSummary);
router.get("/donationhistory/:userId", DonationdetailsController.getDonationHistoryByUser);

// Export router
export default router;