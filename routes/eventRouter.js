import express from 'express';
import eventController from '../controller/eventcontroller.js';
import handleMulterError from '../middleware/multer.js';

const router = express.Router();

router.post('/registerEvent', handleMulterError, eventController.createEvent);
router.get('/allEvents', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

export default router;