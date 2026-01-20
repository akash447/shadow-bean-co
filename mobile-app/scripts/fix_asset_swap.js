const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://yyqoagncaxzpxodwnuax.supabase.co';
const supabaseKey = 'sb_publishable_eyQzRNo7TbvJP1KNGJA-Cg_awO9iGmP';
const supabase = createClient(supabaseUrl, supabaseKey);

// Files provided by user
const UPLOAD_DIR = "C:/Users/akasi/.gemini/antigravity/brain/9b9bb2fc-d7c7-44c5-ab9e-e10ea660f7e1";

// User Request Correction:
// 1. "first image is of homepage hero banner" -> uploaded_image_0 (Landscape) -> home_hero
// 2. "second is for our story image" -> uploaded_image_1 (Farmer) -> about_hero
// 3. "correct it" -> implies I had them swapped or wrong.
// Note: farmer_highlight was previously mapped to the Farmer image too. "Our Story" uses ABOUT_HERO.

const ASSET_MAPPING = [
    // 1st image: Home Hero Banner (Landscape)
    {
        file: 'uploaded_image_0_1768579426670.png',
        key: 'home_hero',
        type: 'image/png'
    },
    // 2nd image: Our Story Image (Farmer) -> about_hero
    {
        file: 'uploaded_image_1_1768579426670.jpg',
        key: 'about_hero',
        type: 'image/jpeg'
    },
    // Also, usually "Farmer Highlight" is the same as the "Our Story" farmer image, or similar.
    // I should update farmer_highlight just in case to be consistent if it's the same visual. 
    // But user specifically said "second is for our story image". 
    // I'll update about_hero mostly. 
];

async function uploadAsset(asset) {
    const filePath = path.join(UPLOAD_DIR, asset.file);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    console.log(`Uploading ${asset.key}...`);
    const fileBuffer = fs.readFileSync(filePath);

    // 1. Upload to Storage (Bucket: media)
    const fileName = `${asset.key}.${asset.type.split('/')[1]}`;

    const { data: storageData, error: storageError } = await supabase.storage
        .from('media')
        .upload(fileName, fileBuffer, {
            contentType: asset.type,
            upsert: true
        });

    if (storageError) {
        console.error(`Error uploading ${asset.key}:`, storageError);
        return;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

    console.log(`Public URL for ${asset.key}: ${publicUrl}`);

    // 3. Update app_assets table (Force update timestamp to bust cache)
    const timestampedUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
        .from('app_assets')
        .upsert({
            key: asset.key,
            url: timestampedUrl,
            type: 'image',
            title: asset.key.replace(/_/g, ' '),
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

    if (dbError) {
        console.error(`Error updating DB for ${asset.key}:`, dbError);
    } else {
        console.log(`Success: ${asset.key} updated.`);
    }
}

async function run() {
    console.log('Starting fix upload...');
    for (const asset of ASSET_MAPPING) {
        await uploadAsset(asset);
    }
    console.log('Fix complete.');
}

run();
