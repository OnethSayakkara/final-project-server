// Fixed createEvent controller
import Event from '../model/Event.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

export const createEvent = async (req, res) => {
  try {
    const { title, description, type, fundingGoal, eventDate, location, organizer, category } = req.body;
    
    // Validate required fields
    if (!title || !description || !type || !eventDate || !location || !organizer || !category) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    
    if ((type === 'fundraising' || type === 'mixed') && !fundingGoal) {
      return res.status(400).json({ message: 'fundingGoal is required for fundraising or mixed events' });
    }

    let imageUrl = null;
    
    // Upload event image (Img)
    if (req.files?.Img && req.files.Img[0]) {
      const imgFile = req.files.Img[0];
      const imgResult = await cloudinary.uploader.upload(imgFile.path, {
        folder: 'events/images',
        resource_type: 'image',
      });
      imageUrl = imgResult.secure_url;
      try { fs.unlinkSync(imgFile.path); } catch (e) {}
    }

    // Upload documents with proper handling for different file types
    const documentUrls = [];
    if (req.files?.documents && req.files.documents.length > 0) {
      for (const file of req.files.documents) {
        const isPdf = file.mimetype === 'application/pdf' || 
                     file.originalname.toLowerCase().endsWith('.pdf');
        
        let uploadResult;
        
        if (isPdf) {
          // Upload PDF as raw file with public access
          uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'events/documents',
            resource_type: 'raw', // Keep as 'raw' for PDFs
            public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_')}`, // Remove extension from filename
            access_mode: 'public',
            type: 'upload'
          });
          
          // Use the original secure_url from Cloudinary - it's already correct
          console.log('PDF Upload Result:', {
            secure_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            resource_type: uploadResult.resource_type
          });
          
          // Just use the secure_url directly - no need to reconstruct
          documentUrls.push(uploadResult.secure_url);
        } else {
          // Handle images normally
          uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'events/documents',
            resource_type: 'image',
            access_mode: 'public',
          });
          
          documentUrls.push(uploadResult.secure_url);
        }
        
        // Delete local copy
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
    }

    const eventData = {
      title,
      description,
      type,
      fundingGoal: (type === 'fundraising' || type === 'mixed') ? fundingGoal : undefined,
      eventDate,
      location,
      organizer,
      category,
      raisedAmount: 0,
      img: imageUrl,
      documents: documentUrls,
    };

    const event = new Event(eventData);
    const savedEvent = await event.save();
    
    console.log('Event created with documents:', savedEvent.documents);
    
    res.status(201).json({ message: 'Event created successfully', event: savedEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    
    // Cleanup local files if present
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

export default { createEvent, getAllEvents, getEventById };