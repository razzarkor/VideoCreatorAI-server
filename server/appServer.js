const express = require('express');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// הגדרת CORS מעודכנת
app.use(cors({
  origin: ['https://razzarkor.github.io', 'http://localhost:3000'], // עדכן לדומיין שלך
  methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true
}));

// Express middleware לטיפול בקבצי מדיה
app.use((req, res, next) => {
  // בדוק אם הנתיב הוא של קובץ מדיה
  if (req.path.match(/\.(mp3|mp4|webm|png|jpg|jpeg|gif)$/i)) {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Encoding, Content-Length, Content-Range',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
  }
  next();
});

// הגדרות CORS ספציפיות לנתיבי מדיה
app.use('/audio', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use('/generated', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use('/videos', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// הגדרות נוספות
app.use(express.json({limit: '500mb', parameterLimit: 100000}));
app.use(express.urlencoded({limit: '500mb', extended: true, parameterLimit: 100000}));
app.use(express.text({ limit: '500mb' }));
app.use(express.raw({ limit: '500mb' }));

// יצירת תיקיות אם לא קיימות
const dirs = ['public/generated', 'public/audio', 'public/videos', 'uploads'];
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// שימוש בקבצים סטטיים
app.use(express.static(path.join(__dirname, 'public')));
app.use('/generated', express.static(path.join(__dirname, 'public/generated')));
app.use('/audio', express.static(path.join(__dirname, 'public/audio')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));

// נתיב בדיקה
app.get('/', (req, res) => {
  res.json({ message: "Server is running!" });
});

// יצירת תמונה
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    
    const imageUrl = response.data.data[0].url;
    
    // הורדת התמונה
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageName = `${Date.now()}-generated.png`;
    const imagePath = path.join(__dirname, 'public', 'generated', imageName);
    
    fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));
    
    // שליחת הכתובת המלאה של התמונה
    const fullImageUrl = `${req.protocol}://${req.get('host')}/generated/${imageName}`;
    
    // הוסף כותרות CORS לתגובה
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    
    res.json({ imageUrl: fullImageUrl });
    
  } catch (error) {
    console.error('Error generating image:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// יצירת אודיו
app.post('/api/generate-audio', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        input: text,
        voice: 'alloy',
        response_format: 'mp3'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    
    const audioFileName = `audio_${Date.now()}.mp3`;
    const audioPath = path.join(__dirname, 'public', 'audio', audioFileName);
    
    fs.writeFileSync(audioPath, Buffer.from(response.data));
    
    // שליחת הכתובת המלאה של האודיו
    const fullAudioUrl = `${req.protocol}://${req.get('host')}/audio/${audioFileName}`;
    
    // הוסף כותרות CORS לתגובה
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    
    // שליחת גם תוכן האודיו כ-Base64 לעקיפת בעיות CORS
    const audioBase64 = Buffer.from(response.data).toString('base64');
    
    res.json({ 
      audioUrl: fullAudioUrl,
      audioData: `data:audio/mp3;base64,${audioBase64}`,
      success: true
    });
    
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});

// שמירת סרטון
app.post('/api/save-video', (req, res) => {
  try {
    const { videoBlob } = req.body;
    if (!videoBlob) {
      return res.status(400).json({ error: 'No video data received' });
    }

    const videoFileName = `video_${Date.now()}.webm`;
    const videoPath = path.join(__dirname, 'public', 'videos', videoFileName);
    
    // המרת Base64 ושמירת הקובץ
    const base64Data = videoBlob.split(';base64,').pop();
    fs.writeFileSync(videoPath, base64Data, { encoding: 'base64' });
    
    // שליחת הכתובת המלאה של הסרטון
    const fullVideoUrl = `${req.protocol}://${req.get('host')}/videos/${videoFileName}`;
    
    // הוסף כותרות CORS לתגובה
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS, POST',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    
    res.json({ 
      videoUrl: fullVideoUrl,
      success: true
    });
    
  } catch (error) {
    console.error('Error saving video:', error);
    res.status(500).json({ error: 'Failed to save video', details: error.message });
  }
});

// התקנת multer לטיפול בקבצים
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  })
});

// שיתוף סרטון
app.post('/api/share-video', upload.single('video'), async (req, res) => {
  try {
    const { email } = req.body;
    const videoFile = req.file;
    
    if (!email || !videoFile) {
      return res.status(400).json({ error: 'Email and video file are required' });
    }
    
    // הגדרת transporter לשליחת מייל
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // שליחת המייל
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Generated Video',
      text: 'Here is your generated video.',
      attachments: [
        {
          filename: 'generated-video.webm',
          path: videoFile.path
        }
      ]
    });
    
    res.json({ success: true, message: 'Video shared successfully' });
    
  } catch (error) {
    console.error('Error sharing video:', error);
    res.status(500).json({ error: 'Failed to share video' });
  }
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});