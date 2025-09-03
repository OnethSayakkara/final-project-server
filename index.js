import express from 'express';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';

config();

const app = express();
const PORT = 3000;

// CORS setup
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// ⚠️ Webhook must be defined BEFORE express.json()
import paymentRouter from './routes/paymentRouter.js';

// Use webhook path first (raw body)
app.use('/payment/webhook',
  express.raw({ type: 'application/json' }), 
  paymentRouter
);

// Normal JSON parsing for everything else
app.use(express.json());
app.use(cookieParser());

// Other routes
app.use('/auth/', (await import('./routes/authRouter.js')).default);
app.use('/user/', (await import('./routes/userRouter.js')).default);
app.use('/admin/', (await import('./routes/adminRouter.js')).default);
app.use('/organizer/', (await import('./routes/organizerRouter.js')).default);
app.use('/scamDetection/', (await import('./routes/scamCheckRoutes.js')).default);
app.use('/event/', (await import('./routes/eventRouter.js')).default);

// Payment (except webhook handled above)
app.use('/payment/', paymentRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log('DB connection error:', err));
