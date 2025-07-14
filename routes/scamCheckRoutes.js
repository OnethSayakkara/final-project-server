import express from 'express';
import { scamCheck } from '../controller/scamCheckHuggingFace.js';


const router = express.Router();

router.post('/check-scam', scamCheck);

export default router;