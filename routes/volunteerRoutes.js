import express from 'express';
import  registerVolunteerToEvent  from '../controller/registerVolunteerToEvent.js';

const router = express.Router();

// POST /api/volunteers/register
router.post('/registervolunteerstoevents', registerVolunteerToEvent.registerVolunteer);
router.post('/checkRegistration/:eventId', registerVolunteerToEvent.checkRegistration);

export default router;
