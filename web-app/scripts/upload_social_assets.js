const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://yyqoagncaxzpxodwnuax.supabase.co';
const supabaseKey = 'sb_publishable_eyQzRNo7TbvJP1KNGJA-Cg_awO9iGmP';
const supabase = createClient(supabaseUrl, supabaseKey);

// Files provided by user (using the specific filenames from context)
const UPLOAD_DIR = "C:/Users/akasi/.gemini/antigravity/brain/9b9bb2fc-d7c7-44c5-ab9e-e10ea660f7e1";
// Mapping: 1=Whatsapp, 2=Insta, 3=Facebook, 4=Product, 5=Farmer
const ASSET_MAPPING = [
    // 1st -- Whatsapp
    {
        file: 'uploaded_image_0_1768578355976.png',
        key: 'icon_whatsapp',
        type: 'image/png'
    },
    // 2nd -- Insta
    {
        file: 'uploaded_image_1_1768578355976.png',
        key: 'icon_instagram',
        type: 'image/png'
    },
    // 3rd -- Facebook
    {
        file: 'uploaded_image_2_1768578355976.png',
        key: 'icon_facebook',
        type: 'image/png'
    },
    // 4th -- Product bag
    {
        file: 'uploaded_image_3_1768578355976.png',
        key: 'product_bag',
        type: 'image/png'
    },
    // 5th -- Coffee farmer
    {
        file: 'uploaded_image_4_1768578355976.jpg',
        key: 'farmer_highlight',
        type: 'image/jpeg'
    }
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
    // Using the key as the filename for simplicity and consistency
    const fileName = `${asset.key}.${asset.type.split('/')[1]}`;

    // Remove existing if any (optional, upsert handles it but good practice)
    // await supabase.storage.from('media').remove([fileName]);

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

    // 3. Update app_assets table
    // Append timestamp to URL to force cache bust on client
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
    console.log('Starting upload...');
    for (const asset of ASSET_MAPPING) {
        await uploadAsset(asset);
    }
    console.log('Done.');
}

run();
