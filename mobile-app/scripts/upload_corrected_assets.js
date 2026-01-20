const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://yyqoagncaxzpxodwnuax.supabase.co';
const supabaseKey = 'sb_publishable_eyQzRNo7TbvJP1KNGJA-Cg_awO9iGmP';
const supabase = createClient(supabaseUrl, supabaseKey);

const ASSETS_DIR = 'C:/Users/akasi/.gemini/antigravity/brain/9b9bb2fc-d7c7-44c5-ab9e-e10ea660f7e1';

// user request:
// 1st image (0) -> channi (icon_chhani)
// 2nd image (1) -> salt roasted (icon_salt_roasted)
// 3rd image (2) -> own brewer (icon_french_press)
// 4th image (3) -> personalised icon (icon_personalised)
// last image (4) -> shade grown (icon_shade_grown)

const MAPPING = [
    { file: 'uploaded_image_0_1768577114303.png', key: 'icon_chhani' },
    { file: 'uploaded_image_1_1768577114303.png', key: 'icon_salt_roasted' },
    { file: 'uploaded_image_2_1768577114303.png', key: 'icon_french_press' },
    { file: 'uploaded_image_3_1768577114303.png', key: 'icon_personalised' },
    { file: 'uploaded_image_4_1768577114303.png', key: 'icon_shade_grown' },
];

async function upload() {
    console.log('Starting upload...');
    const results = [];

    for (const item of MAPPING) {
        try {
            const filePath = path.join(ASSETS_DIR, item.file);
            if (!fs.existsSync(filePath)) {
                console.error(`File not found: ${filePath}`);
                continue;
            }
            const fileContent = fs.readFileSync(filePath);
            const fileName = `${item.key}.png`;

            console.log(`Uploading ${item.key}...`);

            // 1. Storage Upload
            const { data: storageData, error: storageError } = await supabase.storage
                .from('media')
                .upload(fileName, fileContent, {
                    upsert: true,
                    contentType: 'image/png',
                    cacheControl: '3600'
                });

            if (storageError) {
                console.error(`Error uploading ${item.key} to storage:`, storageError.message);
                continue;
            }

            // 2. Get Public URL
            const { data: pubUrlData } = supabase.storage
                .from('media')
                .getPublicUrl(fileName);

            const publicUrl = pubUrlData.publicUrl;
            console.log(`Public URL for ${item.key}: ${publicUrl}`);

            // 3. Update DB
            const { error: dbError } = await supabase
                .from('app_assets')
                .upsert({
                    key: item.key,
                    url: publicUrl,
                    title: item.key.replace(/_/g, ' '),
                    type: 'image',
                    updated_at: new Date().toISOString() // Important for cache busting!
                });

            if (dbError) {
                console.error(`Error updating DB for ${item.key}:`, dbError.message);
            } else {
                console.log(`Success: ${item.key} updated.`);
                results.push(item.key);
            }
        } catch (err) {
            console.error(`Exception during upload of ${item.key}:`, err);
        }
    }
    console.log('Done.');
}

upload();
