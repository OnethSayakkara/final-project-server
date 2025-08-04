import Event from '../model/Event.js';

// Create a new event
const createEvent = async (req, res) => {
  try {
    const eventData = req.body;

    // Create and save event
    const event = new Event(eventData);
    const savedEvent = await event.save();

    res.status(201).json({ message: 'Event created successfully', event: savedEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

module.exports = {
  createEvent
};
