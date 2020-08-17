const express = require('express');
const path = require('path');
const cloudinary = require('cloudinary');
const scheduler = require('../utility/scheduler');
cloudinary.config({
  cloud_name: 'coc-vjti',
  api_key: '552242973352355',
  api_secret: process.env.CLOUDINARY_SECRET
});
const Event = require('../models/Event');
const mongoose = require('mongoose');

module.exports = {
  async getEvents(_req, res) {
    const events = await Event.find();
    res.json(events);
  },
  async getEventById(req, res) {
    try {
      const eventId = req.params.id;
      const event = await Event.findById(eventId);
      res.json(event);
    } catch (err) {
      res.status(203).send({
        err: err
      });
    }
  },
  async uploadEvent(req, res) {
    try {
      const file = req.file;
      const event = await Event.create(req.body);
      if (file) {
        const image = await cloudinary.v2.uploader.upload(file.path, {
          public_id: event._id,
          tags: ['event'],
          invalidate: true
        });
        req.body.image = {
          url: image.secure_url,
          public_id: image.public_id
        };
      }
      res.json({
        id: event._id
      });
    } catch (err) {
      res.status(203).send({
        err: err
      });
    }
  },
  async updateEvent(req, res) {
    try {
      const eventId = req.params.id;
      const file = req.file;
      let event = await Event.updateOne({_id: mongoose.Types.ObjectId(eventId)}, req.body);
      event = await Event.findById(eventId);
      const eventDate = event.date.split('-');
      const notificationDate = new Date(
        parseInt(eventDate[0]), 
        parseInt(eventDate[1])-1, 
        parseInt(eventDate[2]), 
        9
      );
      scheduler.rescheduleNotification(notificationDate, { prefix: eventId });
      if (file) {
        try {
          await cloudinary.api.resource(eventId);
          try {
            await cloudinary.v2.uploader.destroy(eventId);
          } catch(error) {
            res.status(500).json({});
          }
        } catch(error) {}
        const image = await cloudinary.v2.uploader.upload(file.path, {
          public_id: eventId,
          tags: ['event'],
          invalidate: true
        });
        req.body.image = {
          url: image.secure_url,
          public_id: image.public_id
        };
      }
      res.json(event);
    } catch (err) {
      res.status(400).send({
        err: err
      });
    }
  },
  async deleteEvent(req, res) {
    const eventId = req.params.id;
    scheduler.removeNotification({ substring: eventId });
    const event = await Event.findById(eventId);
    await event.remove();
    try {
      await cloudinary.api.resource(eventId);
      try {
        await cloudinary.v2.uploader.destroy(eventId);
      } catch(error) {
        res.status(500).json({});
      }
    } catch(error) {}
    res.status(204).json({});
  },
  async addForm(req, res) {
    const formURL = req.body.formURL;
    const eventId = req.params.id;

    try {
      const event = await Event.findByIdAndUpdate(eventId, {
        form: formURL
      });

      res.status(200).send({
        message: 'Form added successfully'
      });
    } catch (err) {
      res.status(403).send({
        error: err
      });
    }
  },
  async addReminder(req, res) {
    try {
      const eventId = req.body.id;
      const userEmail = req.body.email;
      const event = await Event.findById(eventId);
      const eventDate = event.date.split('-');
      const notificationDate = new Date(
        parseInt(eventDate[0]), 
        parseInt(eventDate[1])-1, 
        parseInt(eventDate[2]), 
        9
      ); // Sends notification at 09:00 at the day of the event
      const data = {
        jobName: `${eventId}-${userEmail}`,
        to: userEmail,
        subject: `${event.eventName} Reminder!!`,
        message: `Reminder email for ${event.eventName} event`,
      }
      scheduler.scheduleEmailNotification(notificationDate, data);
      res.status(200).json({mssg: 'Successfully added reminder'});
    } catch (error) {
      res.status(400).json({error: error.message});
    }
  },
  async cancelReminder(req, res) {
    const eventId = req.params.id;
    const userEmail = req.body.email;
    try {
      scheduler.removeNotification({ substring: `${eventId}-${userEmail}` });
      res.status(200).json({ mssg: 'Successfully cancelled reminder' });
    } catch(error) {
      res.status(400).json({error: error.message});
    }
  }
};
