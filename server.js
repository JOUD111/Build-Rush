const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Base Health Check Route
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Build-Rush Backend is running smoothly!' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
