const express = require('express');
const app = express();
const PORT = 3000;
require('dotenv').config();
const mongoose = require('mongoose');


app.use(express.json());



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use('/auth/', require('./routes/authRouter'));


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log(' DB connection error:', err));


