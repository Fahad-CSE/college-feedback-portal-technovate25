// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/feedbackApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ===== User Model =====
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'student' },
  badges: [String],
  createdAt: { type: Date, default: Date.now }
}));

// ===== Feedback Model =====
const Feedback = mongoose.model('Feedback', new mongoose.Schema({
  type: { type: String, enum: ['suggestion', 'complaint'] },
  title: String,
  category: String,
  description: String,
  urgency: String,
  image: String,
  status: { type: String, default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

// ===== Vote Model =====
const Vote = mongoose.model('Vote', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  feedbackId: mongoose.Schema.Types.ObjectId,
  feedbackType: String,
  createdAt: { type: Date, default: Date.now }
}));

// ===== Comment Model =====
const Comment = mongoose.model('Comment', new mongoose.Schema({
  feedbackId: mongoose.Schema.Types.ObjectId,
  feedbackType: String,
  userId: mongoose.Schema.Types.ObjectId,
  authorName: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
}));

// ===== Routes =====

// Register
app.post('/api/users/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ msg: 'Registration error' });
  }
});

// Login
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ msg: 'Login error' });
  }
});

// Create Feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const feedback = await Feedback.create(req.body);
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ msg: 'Error submitting feedback' });
  }
});

// Get All Feedback
app.get('/api/feedback', async (req, res) => {
  const feedback = await Feedback.find();
  res.json(feedback);
});

// Create Comment
app.post('/api/comments', async (req, res) => {
  try {
    const comment = await Comment.create(req.body);
    res.json(comment);
  } catch (err) {
    res.status(500).json({ msg: 'Error adding comment' });
  }
});

// Get Comments by Feedback
app.get('/api/comments/:feedbackId', async (req, res) => {
  const comments = await Comment.find({ feedbackId: req.params.feedbackId });
  res.json(comments);
});

// Toggle Vote
app.post('/api/votes', async (req, res) => {
  const { userId, feedbackId, feedbackType } = req.body;
  const existing = await Vote.findOne({ userId, feedbackId });
  if (existing) {
    await Vote.deleteOne({ _id: existing._id });
    return res.json({ msg: 'Vote removed' });
  } else {
    const vote = await Vote.create({ userId, feedbackId, feedbackType });
    return res.json(vote);
  }
});

// Get Votes by Feedback
app.get('/api/votes/:feedbackId', async (req, res) => {
  const votes = await Vote.find({ feedbackId: req.params.feedbackId });
  res.json(votes);
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
