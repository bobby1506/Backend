const Contact = require('../models/contactModel');

// Controller action for handling the contact form submission
exports.createContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Create a new Contact instance
    const newContact = new Contact({
      name,
      email,
      message,
    });

    // Save the new contact to the database
    const savedContact = await newContact.save();

    res.status(201).json({ message: 'Contact created successfully', contact: savedContact });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while creating the contact', error: error.message });
  }
};
