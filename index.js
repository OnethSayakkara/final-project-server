const express = require('express');
const app = express();
const PORT = 3000;
require('dotenv').config();
const mongoose = require('mongoose');


app.use(express.json());


app.get('/', (req, res) => {
  res.send('Welcome to United Charities backend!');
});




app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log(' DB connection error:', err));