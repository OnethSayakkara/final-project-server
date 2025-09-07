
import Event from '../model/Event.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      fundingGoal,
      eventDate,
      location,
      organizer,
      category,
      greetingSentence,
      startTime,
      endTime
    } = req.body;

    // 🔹 Validate required fields
    if (!title || !description || !type || !location || !organizer || !category) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // 🔹 Check fundraising requirement
    if ((type === 'fundraising' || type === 'mixed') && !fundingGoal) {
      return res.status(400).json({ message: 'fundingGoal is required for fundraising or mixed events' });
    }

    // 🔹 Check volunteer requirement
    if ((type === 'volunteer' || type === 'mixed') && (!eventDate || !startTime || !endTime)) {
      return res.status(400).json({ message: 'eventDate, startTime and endTime are required for volunteer or mixed events' });
    }

    let imageUrl = null;

    // 🔹 Upload event image
    if (req.files?.Img && req.files.Img[0]) {
      const imgFile = req.files.Img[0];
      const imgResult = await cloudinary.uploader.upload(imgFile.path, {
        folder: 'events/images',
        resource_type: 'image',
      });
      imageUrl = imgResult.secure_url;
      try { fs.unlinkSync(imgFile.path); } catch (e) {}
    }

    // 🔹 Upload documents
    const documentUrls = [];
    if (req.files?.documents && req.files.documents.length > 0) {
      for (const file of req.files.documents) {
        const isPdf = file.mimetype === 'application/pdf' ||
                     file.originalname.toLowerCase().endsWith('.pdf');

        let uploadResult;

        if (isPdf) {
          uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'events/documents',
            resource_type: 'raw',
            public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_')}`,
            access_mode: 'public',
            type: 'upload'
          });
          documentUrls.push(uploadResult.secure_url);
        } else {
          uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'events/documents',
            resource_type: 'image',
            access_mode: 'public',
          });
          documentUrls.push(uploadResult.secure_url);
        }

        try { fs.unlinkSync(file.path); } catch (e) {}
      }
    }

    // 🔹 Build event object
    const eventData = {
      title,
      description,
      type,
      fundingGoal: (type === 'fundraising' || type === 'mixed') ? fundingGoal : undefined,
      eventDate: (type === 'volunteer' || type === 'mixed') ? eventDate : undefined,
      startTime: (type === 'volunteer' || type === 'mixed') ? startTime : undefined,
      endTime: (type === 'volunteer' || type === 'mixed') ? endTime : undefined,
      location,
      organizer,
      category,
      raisedAmount: 0,
      img: imageUrl,
      documents: documentUrls,
      greetingSentence,
    };

    const event = new Event(eventData);
    const savedEvent = await event.save();

    res.status(201).json({ message: 'Event created successfully', event: savedEvent });
  } catch (error) {
    console.error('Error creating event:', error);

    // 🔹 Cleanup local files
    try {
      if (req.files?.Img?.[0]) fs.unlinkSync(req.files.Img[0].path);
      if (req.files?.documents) {
        req.files.documents.forEach(f => {
          try { fs.unlinkSync(f.path); } catch(e) {}
        });
      }
    } catch (e) {}

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



export const getEventsByOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;

    // Fetch events with organizerId
    const events = await Event.find({ organizer: organizerId })
      .populate("organizer", "name email") // populate organizer basic info
      .sort({ createdAt: -1 }); // latest first

    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No events found for this organizer" });
    }

    res.json(events);
  } catch (error) {
    console.error("Error fetching events by organizer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getVolunteerEventsWithUsers = async (req, res) => {
  try {
    const { organizerId } = req.params;

    // find only volunteer events for this organizer
    const events = await Event.find({
      organizer: organizerId,
      type: "volunteer",
    })
      .select("_id title JoinedUsers") // only id, title, and joined users
      .populate("JoinedUsers", "firstName lastName email") // only these fields from User
      .sort({ createdAt: -1 });

    if (!events || events.length === 0) {
      return res
        .status(404)
        .json({ message: "No volunteer events found for this organizer" });
    }

    // format response
    const response = events.map((event) => ({
      eventId: event._id,
      eventName: event.title,
      joinedUsers: event.JoinedUsers.map((user) => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })),
    }));

    res.json(response);
  } catch (error) {
    console.error("Error fetching volunteer events:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default { createEvent, getAllEvents, getEventById, getEventsByOrganizer, getVolunteerEventsWithUsers };