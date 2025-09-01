import express from 'express';
import organizerController from '../controller/organizerController.js'; // Adjust path

const router = express.Router();

router.post('/registerOrganizer', organizerController.registerOrganizer);


export default router;