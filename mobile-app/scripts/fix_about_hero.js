const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://yyqoagncaxzpxodwnuax.supabase.co';
const supabaseKey = 'sb_publishable_eyQzRNo7TbvJP1KNGJA-Cg_awO9iGmP';
const supabase = createClient(supabaseUrl, supabaseKey);

// Files provided by user
const UPLOAD_DIR = "C:/Users/akasi/.gemini/antigravity/brain/9b9bb2fc-d7c7-44c5-ab9e-e10ea660f7e1";

// User said "our story image is wrong, that will be last image."
// The last image uploaded in this batch is uploaded_image_3_1768580261675.jpg (Index 3, count 4: 0, 1, 2, 3)
// Wait, looking at the metadata again:
// uploaded_image_0 ... .jpg
// uploaded_image_1 ... .jpg
// uploaded_image_2 ... .jpg
// uploaded_image_3 ... .jpg
// So uploaded_image_3 is the last one.
// Mapping it to 'about_hero'.

const ASSET_MAPPING = [
    {
        file: 'uploaded_image_3_1768580261675.jpg',
        key: 'about_hero',
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
    console.log('Starting final asset fix...');
    for (const asset of ASSET_MAPPING) {
        await uploadAsset(asset);
    }
    console.log('Done.');
}

run();
