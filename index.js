import express from 'express';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';

config(); // Initialize dotenv to load environment variables

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
}));

app.use(express.json());
app.use(cookieParser());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use('/auth/', (await import('./routes/authRouter.js')).default);
app.use('/user/', (await import('./routes/userRouter.js')).default);
app.use('/admin/', (await import('./routes/adminRouter.js')).default);
app.use('/scamDetection/', (await import('./routes/scamCheckRoutes.js')).default);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log(' DB connection error:', err));

