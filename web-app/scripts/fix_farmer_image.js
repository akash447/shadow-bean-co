
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

const supabaseUrl = 'https://tvdpkmpdhqfiftqfuniu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZHBrbXBkaHFmaWZ0cWZ1bml1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjYwNDU1OCwiZXhwIjoyMDUyMTgwNTU4fQ.P68t-2V9KjJ5vQk3z8Tj-2_bXQz7e0kM-3_cWwJ8y_s';
const supabase = createClient(supabaseUrl, supabaseKey);

const ASSETS = [
    {
        key: 'farmer_highlight',
        filePath: 'C:/Users/akasi/.gemini/antigravity/brain/9b9bb2fc-d7c7-44c5-ab9e-e10ea660f7e1/uploaded_image_1_1768581071814.jpg', // User says "Image 2" which is index 1
        contentType: 'image/jpeg'
    }
];

async function uploadAssets() {
    console.log('Starting upload of Farmer Highlight image...');

    for (const asset of ASSETS) {
        try {
            const fileContent = fs.readFileSync(asset.filePath);
            const fileName = `${asset.key}_${Date.now()}.jpg`;
            const filePath = `app-assets/${fileName}`;

            // 1. Upload to Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('app-assets')
                .upload(fileName, fileContent, {
                    contentType: asset.contentType,
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('app-assets')
                .getPublicUrl(fileName);

            const publicUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

            console.log(`Uploaded ${asset.key} to ${publicUrlWithTimestamp}`);

            // 3. Update Database
            const { error: dbError } = await supabase
                .from('app_assets')
                .upsert({
                    key: asset.key,
                    url: publicUrlWithTimestamp,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });

            if (dbError) throw dbError;

            console.log(`Updated database for ${asset.key}`);

        } catch (err) {
            console.error(`Failed to handle ${asset.key}:`, err);
        }
    }
}

uploadAssets();
