import express from 'express';
import { createEvent } from '../controller/eventcontroller.js';

const router = express.Router();
// POST /api/events - Create a new event
router.post('/create-event', createEvent);


export default router;
