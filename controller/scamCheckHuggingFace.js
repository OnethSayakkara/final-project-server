import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const scamCheck = async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description required' });
  }

  const input = `${title}. ${description}`;

  try {
    const hfRes = await axios.post(
      'https://api-inference.huggingface.co/models/joeddav/xlm-roberta-large-xnli',
      {
        inputs: input,
        parameters: {
          candidate_labels: ['safe', 'suspicious', 'scam']
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      label: hfRes.data.labels[0],
      confidence: hfRes.data.scores[0],
      all: hfRes.data
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      error: 'Scam detection failed',
      detail: err.response?.data?.error || err.message
    });
  }
};
