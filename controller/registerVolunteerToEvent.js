import Event from '../model/Event.js';
import VolunteerRegistration from '../model/VolunteerRegistration.js';
import User from '../model/User.js';

// Register Volunteer
export const registerVolunteer = async (req, res) => {
  try {
    const { eventId, userId, fullName, email, phoneNumber, specialRequirements } = req.body;

    // ✅ Check required fields
    if (!eventId || !userId || !fullName || !email || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // ✅ Check if user already registered for this event
    const alreadyRegistered = await VolunteerRegistration.findOne({ eventId, userId });
    if (alreadyRegistered) {
      return res.status(400).json({ message: 'User already registered for this event' });
    }

    // ✅ Create a new volunteer registration
    const registration = new VolunteerRegistration({
      eventId,
      userId,
      fullName,
      email,
      phoneNumber,
      specialRequirements,
    });

    await registration.save();

    // ✅ Add user to event's JoinedUsers if not already in it
    if (!event.JoinedUsers.includes(userId)) {
      event.JoinedUsers.push(userId);
      await event.save();
    }

    res.status(201).json({
      message: 'Volunteer registered successfully',
      registration,
    });
  } catch (error) {
    console.error('Error registering volunteer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const checkRegistration = async (req, res) => {
  try {
    const { userId } = req.body;
    const { eventId } = req.params;

    const registration = await VolunteerRegistration.findOne({ eventId, userId });
    res.json({ isRegistered: !!registration });
  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default { registerVolunteer, checkRegistration };
