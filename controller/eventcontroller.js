import Event from '../model/Event.js';
import cloudinary from '../config/cloudinary.js'; 
import fs from 'fs';

const createEvent = async (req, res) => {
  try {
    const { title, description, type, fundingGoal, eventDate, location, organizer, category } = req.body;

    // Validate required fields
    if (!title || !description || !type || !eventDate || !location || !organizer || !category) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate fundingGoal based on event type
    if ((type === 'fundraising' || type === 'mixed') && !fundingGoal) {
      return res.status(400).json({ message: 'fundingGoal is required for fundraising or mixed events' });
    }

    let imageUrl = null;

    if (req.file) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "events", 
      });
      imageUrl = result.secure_url;

      // Optional: delete local file after upload
      fs.unlinkSync(req.file.path);
    }

    // Construct event data
    const eventData = {
      title,
      description,
      type,
      fundingGoal: type === 'fundraising' || type === 'mixed' ? fundingGoal : undefined,
      eventDate,
      location,
      organizer,
      category,
      raisedAmount: 0,
      img: imageUrl,
    };

    const event = new Event(eventData);
    const savedEvent = await event.save();

    res.status(201).json({ message: 'Event created successfully', event: savedEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('organizer', 'name email'); // populate organizer details if needed
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate('organizer', 'name email');

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default { createEvent, getAllEvents, getEventById };