const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Keep your existing middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Memory storage for multer (instead of disk storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Example database mockup (replace with your DB logic)
let apps = [];

// Upload route
app.post("/upload-app", upload.fields([
  { name: "icon", maxCount: 1 },
  { name: "apk", maxCount: 1 }
]), async (req, res) => {
  try {
    const { appName, description, developer } = req.body;
    let iconUrl = "";
    let apkUrl = "";

    // Upload icon to Supabase
    if (req.files["icon"]) {
      const iconFile = req.files["icon"][0];
      const iconName = Date.now() + path.extname(iconFile.originalname);
      const { error: iconError } = await supabase
        .storage
        .from(process.env.SUPABASE_BUCKET_1)
        .upload(iconName, iconFile.buffer, {
          contentType: iconFile.mimetype,
          upsert: false
        });
      if (iconError) throw iconError;

      const { data } = supabase
        .storage
        .from(process.env.SUPABASE_BUCKET_1)
        .getPublicUrl(iconName);
      iconUrl = data.publicUrl;
    }

    // Upload APK to Supabase
    if (req.files["apk"]) {
      const apkFile = req.files["apk"][0];
      const apkName = Date.now() + path.extname(apkFile.originalname);
      const { error: apkError } = await supabase
        .storage
        .from(process.env.SUPABASE_BUCKET_2.trim())
        .upload(apkName, apkFile.buffer, {
          contentType: apkFile.mimetype,
          upsert: false
        });
      if (apkError) throw apkError;

      const { data } = supabase
        .storage
        .from(process.env.SUPABASE_BUCKET_2.trim())
        .getPublicUrl(apkName);
      apkUrl = data.publicUrl;
    }

    // Save to your DB array (mock)
    const newApp = {
      id: Date.now(),
      name: appName,
      description,
      developer,
      icon: iconUrl,
      apk: apkUrl
    };
    apps.push(newApp);

    res.json({ success: true, app: newApp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Upload failed", error: err.message });
  }
});

// Example route to get apps
app.get("/apps", (req, res) => {
  res.json(apps);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
