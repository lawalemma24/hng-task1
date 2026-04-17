const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const profileRoutes = require('./route/profileRoute');

require('dotenv').config();

// PORT = process.env.PORT || 7000;

const app = express();

app.use(cors({
  origin: '*'
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("MongoDB Connected"))
.catch(err => console.log(err));

app.use('/api/profiles', profileRoutes);

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

module.exports = app;