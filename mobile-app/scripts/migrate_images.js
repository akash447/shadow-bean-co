
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Credentials from admin-panel/src/lib/supabase.ts
const SUPABASE_URL = 'https://yyqoagncaxzpxodwnuax.supabase.co';
const SUPABASE_KEY = 'sb_publishable_eyQzRNo7TbvJP1KNGJA-Cg_awO9iGmP';

// Targets
const LOCAL_DIR = path.join(__dirname, '../public/images');
const BUCKET_NAME = 'media';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadFile(filePath, relativePath) {
    const fileContent = fs.readFileSync(filePath);
    // Convert backslashes to slashes for storage key
    const storagePath = relativePath.split(path.sep).join('/');

    console.log(`Uploading: ${relativePath} -> ${BUCKET_NAME}/${storagePath}...`);

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileContent, {
            contentType: getContentType(filePath),
            upsert: true
        });

    if (error) {
        console.error(`FAILED to upload ${relativePath}:`, error.message);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

    console.log(`SUCCESS: ${publicUrl}`);
    return publicUrl;
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.svg') return 'image/svg+xml';
    if (ext === '.webp') return 'image/webp';
    return 'application/octet-stream';
}

async function scanAndUpload(dir, baseDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        // Calculate relative path from the base LOCAL_DIR
        const relativePath = path.relative(baseDir, fullPath);

        if (entry.isDirectory()) {
            await scanAndUpload(fullPath, baseDir);
        } else if (entry.isFile()) {
            await uploadFile(fullPath, relativePath);
        }
    }
}

async function main() {
    console.log(`Starting migration from ${LOCAL_DIR} to Supabase bucket '${BUCKET_NAME}'`);
    if (!fs.existsSync(LOCAL_DIR)) {
        console.error(`Directory not found: ${LOCAL_DIR}`);
        process.exit(1);
    }

    await scanAndUpload(LOCAL_DIR, LOCAL_DIR);
    console.log('Migration complete.');
}

main().catch(console.error);
