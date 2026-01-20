const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://yyqoagncaxzpxodwnuax.supabase.co';
const supabaseKey = 'sb_publishable_eyQzRNo7TbvJP1KNGJA-Cg_awO9iGmP';
const supabase = createClient(supabaseUrl, supabaseKey);

// Files provided by user (using the specific filenames from context)
const UPLOAD_DIR = "C:/Users/akasi/.gemini/antigravity/brain/9b9bb2fc-d7c7-44c5-ab9e-e10ea660f7e1";

// Mapping based on user request:
// 2nd image (idx 1): icon_pour_over
// 3rd image (idx 2): logo_bird
// 4th image (idx 3): coffee_farm (mapping to FARMER_HIGHLIGHT? Or JOURNEY_BANNER? User said "4th - coffee_farm and also for home_hero_banner")
// Let's assume 4th is for Home Hero AND Farmer Highlight if they are the same visual theme? 
// Or maybe I should update FARMER_HIGHLIGHT with this new one. And HOME_HERO is also this?
// Actually, let's map:
// File 1 -> icon_pour_over_kit (ICON_POUR_OVER)
// File 2 -> logo_bird (LOGO_MAIN - overwriting?)
// File 3 -> farmer_highlight (FARMER_HIGHLIGHT)
// File 4 -> home_hero (HOME_HERO)

const ASSET_MAPPING = [
    // 2nd image: icon_pour_over
    {
        file: 'uploaded_image_1_1768578955983.png',
        key: 'icon_pour_over_kit', // Key from ImageKeys
        type: 'image/png'
    },
    // 3rd image: logo_bird
    {
        file: 'uploaded_image_2_1768578955983.png',
        key: 'logo_main', // Key from ImageKeys
        type: 'image/png'
    },
    // 4th image: coffee_farm -> Farmer Highlight
    {
        file: 'uploaded_image_3_1768578955983.png',
        key: 'farmer_highlight', // Key from ImageKeys
        type: 'image/png'
    },
    // "and also for home_hero_banner" -> Using the 5th image? Or same 4th image?
    // User provided 5 files.
    // 0: Error
    // 1: Pour Over
    // 2: Logo
    // 3: Farm (PNG)
    // 4: Farm (JPG) -> likely the Home Hero Banner?
    {
        file: 'uploaded_image_4_1768578955983.jpg',
        key: 'home_hero', // Key from ImageKeys
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

    // 3. Update app_assets table
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
