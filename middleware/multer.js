// middleware/multer.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.jpeg', '.jpg', '.png', '.pdf'];
  if (allowed.includes(ext)) return cb(null, true);
  cb(new Error('Only PDF/JPEG/JPG/PNG files are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB each
  fileFilter,
}).fields([
  { name: 'Img', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]);

const handleMulterError = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

export default handleMulterError;
