// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Supabase config from .env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_BUCKET_1 = process.env.SUPABASE_BUCKET_1;
const SUPABASE_BUCKET_2 = process.env.SUPABASE_BUCKET_2;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload to icons bucket
app.post('/upload/icon', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const fileName = Date.now() + path.extname(file.originalname);

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET_1)
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) throw error;

    const { data: publicURLData } = supabase.storage
      .from(SUPABASE_BUCKET_1)
      .getPublicUrl(fileName);

    res.json({ success: true, url: publicURLData.publicUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload to apks bucket
app.post('/upload/apk', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const fileName = Date.now() + path.extname(file.originalname);

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET_2)
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) throw error;

    const { data: publicURLData } = supabase.storage
      .from(SUPABASE_BUCKET_2)
      .getPublicUrl(fileName);

    res.json({ success: true, url: publicURLData.publicUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback to index.html for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
