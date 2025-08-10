// server.js - Supabase-backed APK Store with dummy auth (admin/dev) and app management
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Load env (SUPABASE_URL and SUPABASE_KEY expected)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jkybgwsxdkfyqxywcmaf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'REPLACE_ME';
const SUPABASE_BUCKET_ICONS = process.env.SUPABASE_BUCKET_1 || 'icons';
const SUPABASE_BUCKET_APKS = process.env.SUPABASE_BUCKET_2 || 'apks';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Simple file storage for app metadata (backend/apps.json)
const APPS_FILE = path.join(__dirname, 'apps.json');
if (!fs.existsSync(APPS_FILE)) fs.writeFileSync(APPS_FILE, '[]', 'utf8');

function readApps(){
  try { return JSON.parse(fs.readFileSync(APPS_FILE, 'utf8') || '[]'); }
  catch(e){ return []; }
}
function writeApps(list){ fs.writeFileSync(APPS_FILE, JSON.stringify(list, null, 2), 'utf8'); }

// Dummy users
const USERS = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'dev', password: 'dev123', role: 'developer' }
];

// Multer memory storage for upload handling
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Login endpoint (dummy)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  res.json({ success: true, role: user.role, username: user.username });
});

// Upload app (developer) - accepts formdata: appName, description, uploader, icon (file), apk (file)
app.post('/upload-app', upload.fields([{ name: 'icon' }, { name: 'apk' }]), async (req, res) => {
  try {
    const { appName, description, uploader } = req.body;
    if (!appName || !description || !uploader) return res.status(400).json({ success:false, message: 'Missing fields' });

    // upload icon
    let iconUrl = '';
    if (req.files && req.files.icon && req.files.icon[0]) {
      const iconFile = req.files.icon[0];
      const iconName = `${Date.now()}_${iconFile.originalname}`;
      const { error: iconError } = await supabase.storage.from(SUPABASE_BUCKET_ICONS).upload(iconName, iconFile.buffer, { contentType: iconFile.mimetype, upsert: true });
      if (iconError) throw iconError;
      iconUrl = supabase.storage.from(SUPABASE_BUCKET_ICONS).getPublicUrl(iconName).data.publicUrl;
    }

    // upload apk
    let apkUrl = '';
    if (req.files && req.files.apk && req.files.apk[0]) {
      const apkFile = req.files.apk[0];
      const apkName = `${Date.now()}_${apkFile.originalname}`;
      const { error: apkError } = await supabase.storage.from(SUPABASE_BUCKET_APKS).upload(apkName, apkFile.buffer, { contentType: apkFile.mimetype, upsert: true });
      if (apkError) throw apkError;
      apkUrl = supabase.storage.from(SUPABASE_BUCKET_APKS).getPublicUrl(apkName).data.publicUrl;
    }

    const apps = readApps();
    const newApp = {
      id: Date.now(),
      appName,
      description,
      icon: iconUrl,
      apk: apkUrl,
      uploader,
      approved: false,
      createdAt: new Date().toISOString()
    };
    apps.push(newApp);
    writeApps(apps);
    res.json({ success: true, app: newApp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, message: err.message });
  }
});

// Get approved apps (public)
app.get('/apps', (req, res) => {
  const apps = readApps().filter(a => a.approved);
  res.json(apps);
});

// Get all apps (admin) - includes pending
app.get('/all-apps', (req, res) => {
  const apps = readApps();
  res.json(apps);
});

// Approve app (admin)
app.post('/approve-app', (req, res) => {
  const { id } = req.body;
  const apps = readApps();
  const idx = apps.findIndex(a => a.id == id);
  if (idx === -1) return res.status(404).json({ success:false, message:'Not found' });
  apps[idx].approved = true;
  writeApps(apps);
  res.json({ success:true });
});

// Reject app (admin) - remove from list and optionally remove files (not removing files from Supabase here)
app.post('/reject-app', (req, res) => {
  const { id } = req.body;
  let apps = readApps();
  apps = apps.filter(a => a.id != id);
  writeApps(apps);
  res.json({ success:true });
});

// Edit app (admin or developer) - allow changing name/description (no file replace in this simple version)
app.post('/edit-app', (req, res) => {
  const { id, appName, description } = req.body;
  const apps = readApps();
  const idx = apps.findIndex(a => a.id == id);
  if (idx === -1) return res.status(404).json({ success:false, message:'Not found' });
  if (appName) apps[idx].appName = appName;
  if (description) apps[idx].description = description;
  writeApps(apps);
  res.json({ success:true, app: apps[idx] });
});

// Delete app (admin or developer)
app.delete('/apps/:id', (req, res) => {
  const id = req.params.id;
  let apps = readApps();
  const exists = apps.some(a => a.id == id);
  if (!exists) return res.status(404).json({ success:false, message:'Not found' });
  apps = apps.filter(a => a.id != id);
  writeApps(apps);
  res.json({ success:true });
});

// Serve service worker explicitly
app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/sw.js'));
});

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(port, () => console.log(`Server running on ${port}`));