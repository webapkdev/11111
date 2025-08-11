import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function uploadFolder(folderPath, bucketName) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileBuffer = fs.readFileSync(filePath);

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(file, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
    } else {
      console.log(`✅ Uploaded ${file} to ${bucketName}`);
    }
  }
}

// Change these to your Render folder paths
uploadFolder('./icons', 'icons');
uploadFolder('./apks', 'apks');
