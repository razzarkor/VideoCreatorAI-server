// const express = require('express');
// const path = require('path');
// const multer = require('multer');
// const axios = require('axios');
// const fs = require('fs');
// const nodemailer = require('nodemailer');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const http = require('http');

// // הגדרת גודל מקסימלי להודעות HTTP
// http.maxHeaderSize = 100 * 1024 * 1024; // 100MB

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3001;

// // הגדרות גודל מקסימלי - חייב להיות לפני middleware אחרים
// app.use(express.json({limit: '500mb', parameterLimit: 100000}));
// app.use(express.urlencoded({limit: '500mb', extended: true, parameterLimit: 100000}));
// app.use(express.text({ limit: '500mb' }));
// app.use(express.raw({ limit: '500mb' }));

// // CORS configuration
// app.use(cors({
//   origin: 'http://localhost:3000',
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type'],
//   maxAge: 86400
// }));

// // שימוש בקבצים סטטיים
// app.use(express.static(path.join(__dirname, 'public')));

// // התקנת multer לטיפול בקבצים
// const upload = multer({
//   limits: {
//     fileSize: 100 * 1024 * 1024 // 100MB
//   },
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       const dir = path.join(__dirname, 'uploads');
//       if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//       }
//       cb(null, dir);
//     },
//     filename: (req, file, cb) => {
//       cb(null, `${Date.now()}-${file.originalname}`);
//     }
//   })
// });

// // יצירת תיקיות נדרשות
// const dirs = ['public/generated', 'public/audio', 'public/videos', 'uploads'];
// dirs.forEach(dir => {
//   const fullPath = path.join(__dirname, dir);
//   if (!fs.existsSync(fullPath)) {
//     fs.mkdirSync(fullPath, { recursive: true });
//   }
// });

// // נתיב בדיקה
// app.get('/', (req, res) => {
//   res.json({ message: "Server is running!" });
// });

// // יצירת תמונה
// app.post('/api/generate-image', async (req, res) => {
//   try {
//     const { prompt } = req.body;
    
//     if (!prompt) {
//       return res.status(400).json({ error: 'Prompt is required' });
//     }
    
//     const response = await axios.post(
//       'https://api.openai.com/v1/images/generations',
//       {
//         prompt,
//         n: 1,
//         size: '1024x1024',
//         response_format: 'url'
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
//         }
//       }
//     );
    
//     const imageUrl = response.data.data[0].url;
    
//     // הורדת התמונה
//     const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//     const imageName = `${Date.now()}-generated.png`;
//     const imagePath = path.join(__dirname, 'public', 'generated', imageName);
    
//     fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));
    
//     res.json({ imageUrl: `/generated/${imageName}` });
    
//   } catch (error) {
//     console.error('Error generating image:', error.response?.data || error.message);
//     res.status(500).json({ error: 'Failed to generate image' });
//   }
// });

// // app.post('/api/generate-animation', async (req, res) => {
// //   try {
// //     const { imageUrl } = req.body;
    
// //     // קבלת התמונה המלאה מהשרת
// //     const fullImageUrl = `${req.protocol}://${req.get('host')}${imageUrl}`;
    
// //     // קריאה ל-Runway API עם הנתיב המעודכן
// //     const response = await axios.post(
// //       'https://api.runwayml.com/v1/model/text-to-video/generate',  // נתיב מעודכן
// //       {
// //         input: {
// //           image_url: fullImageUrl,
// //           motion_strength: 0.5,    // עוצמת התנועה (0-1)
// //           duration: 3,             // משך האנימציה בשניות
// //           num_frames: 30,          // מספר פריימים לשנייה
// //           guidance_scale: 7.5      // מידת ההנחיה (1-20)
// //         }
// //       },
// //       {
// //         headers: {
// //           'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
// //           'Content-Type': 'application/json'
// //         }
// //       }
// //     );
    
// //     if (response.data && response.data.output && response.data.output.video_url) {
// //       // הורדת הסרטון מ-Runway
// //       const videoResponse = await axios.get(response.data.output.video_url, { 
// //         responseType: 'arraybuffer' 
// //       });
      
// //       const fileName = `animation_${Date.now()}.mp4`;
// //       const filePath = path.join(__dirname, 'public', 'animations', fileName);
      
// //       // וודא שהתיקייה קיימת
// //       if (!fs.existsSync(path.join(__dirname, 'public', 'animations'))) {
// //         fs.mkdirSync(path.join(__dirname, 'public', 'animations'), { recursive: true });
// //       }
      
// //       fs.writeFileSync(filePath, Buffer.from(videoResponse.data));
      
// //       res.json({ 
// //         animationUrl: `/animations/${fileName}`,
// //         success: true 
// //       });
// //     } else {
// //       throw new Error('Invalid response from Runway API');
// //     }
    
// //   } catch (error) {
// //     console.error('Error details:', error.response?.data || error.message);
// //     res.status(500).json({ 
// //       error: 'Failed to generate animation',
// //       details: error.response?.data || error.message 
// //     });
// //   }
// // });

// // יצירת אודיו
// app.post('/api/generate-audio', async (req, res) => {
//   try {
//     const { text } = req.body;
    
//     if (!text) {
//       return res.status(400).json({ error: 'Text is required' });
//     }
    
//     const response = await axios.post(
//       'https://api.openai.com/v1/audio/speech',
//       {
//         model: 'tts-1',
//         input: text,
//         voice: 'alloy',
//         response_format: 'mp3'
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//           'Content-Type': 'application/json'
//         },
//         responseType: 'arraybuffer'
//       }
//     );
    
//     const audioFileName = `audio_${Date.now()}.mp3`;
//     const audioPath = path.join(__dirname, 'public', 'audio', audioFileName);
    
//     fs.writeFileSync(audioPath, Buffer.from(response.data));
    
//     res.json({ 
//       audioUrl: `/audio/${audioFileName}`,
//       success: true
//     });
    
//   } catch (error) {
//     console.error('Error generating audio:', error);
//     res.status(500).json({ error: 'Failed to generate audio' });
//   }
// });

// // שמירת סרטון
// app.post('/api/save-video', (req, res) => {
//   try {
//     const { videoBlob } = req.body;
//     if (!videoBlob) {
//       return res.status(400).json({ error: 'No video data received' });
//     }

//     const videoFileName = `video_${Date.now()}.webm`;
//     const videoPath = path.join(__dirname, 'public', 'videos', videoFileName);
    
//     // המרת Base64 ושמירת הקובץ
//     const base64Data = videoBlob.split(';base64,').pop();
//     fs.writeFileSync(videoPath, base64Data, { encoding: 'base64' });
    
//     res.json({ 
//       videoUrl: `/videos/${videoFileName}`,
//       success: true
//     });
    
//   } catch (error) {
//     console.error('Error saving video:', error);
//     res.status(500).json({ error: 'Failed to save video', details: error.message });
//   }
// });

// // שיתוף סרטון
// app.post('/api/share-video', upload.single('video'), async (req, res) => {
//   try {
//     const { email } = req.body;
//     const videoFile = req.file;
    
//     if (!email || !videoFile) {
//       return res.status(400).json({ error: 'Email and video file are required' });
//     }
    
//     // הגדרת transporter לשליחת מייל
//     const transporter = nodemailer.createTransport({
//       service: process.env.EMAIL_SERVICE,
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD
//       }
//     });
    
//     // שליחת המייל
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Your Generated Video',
//       text: 'Here is your generated video.',
//       attachments: [
//         {
//           filename: 'generated-video.webm',
//           path: videoFile.path
//         }
//       ]
//     });
    
//     res.json({ success: true, message: 'Video shared successfully' });
    
//   } catch (error) {
//     console.error('Error sharing video:', error);
//     res.status(500).json({ error: 'Failed to share video' });
//   }
// });



// // הפעלת השרת
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Maximum header size: ${http.maxHeaderSize} bytes`);
// });

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

// הגדרת CORS כדי לאפשר גישה מדומיין GitHub Pages
app.use(cors({
  origin: '*', // בהמשך תגביל זאת לדומיין ה-GitHub Pages שלך
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// הגדרות נוספות
app.use(express.json({limit: '500mb', parameterLimit: 100000}));
app.use(express.urlencoded({limit: '500mb', extended: true, parameterLimit: 100000}));
app.use(express.text({ limit: '500mb' }));
app.use(express.raw({ limit: '500mb' }));

// יצירת תיקיות אם לא קיימות
const dirs = ['public/generated', 'public/audio', 'public/videos'];
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
    
    res.json({ 
      audioUrl: fullAudioUrl,
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