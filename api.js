const express = require('express');
const router = express.Router();

// Mock database storage
let submissions = [];

// @route   GET /api/status
// @desc    Get API status or configuration data
router.get('/status', (req, res) => {
  res.json({
    project: 'Build-Rush',
    version: '1.0.0',
    activeConnections: submissions.length
  });
});

// @route   POST /api/submit
// @desc    Handle incoming data payloads (scores, builds, stats)
router.post('/submit', (req, res) => {
  const { username, score, buildData } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const newEntry = {
    id: Date.now().toString(),
    username,
    score: score || 0,
    buildData: buildData || {},
    createdAt: new Date()
  };

  submissions.push(newEntry);

  res.status(201).json({
    message: 'Data successfully recorded!',
    data: newEntry
  });
});

// @route   GET /api/submissions
// @desc    Retrieve saved submissions/leaderboard
router.get('/submissions', (req, res) => {
  const sortedSubmissions = [...submissions].sort((a, b) => b.score - a.score);
  res.json(sortedSubmissions);
});

module.exports = router;
