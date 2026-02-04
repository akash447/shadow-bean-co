/**
 * Image Migration Script: Supabase Storage → AWS S3
 * 
 * This script migrates all images from Supabase Storage bucket to S3.
 * Run with: node migrate-images.js [--dry-run]
 */

const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
const https = require('https');
const http = require('http');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yyqoagncaxzpxodwnuax.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cW9hZ25jYXh6cHhvZHdudWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDYxNTUsImV4cCI6MjA4MzgyMjE1NX0.s86PaXIhEccHCqDJxwfXF7HOsNMkkdfD-pYEsSGANcY';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'media';

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const S3_BUCKET = process.env.S3_BUCKET || 'shadowbeanco-media';
const DRY_RUN = process.argv.includes('--dry-run');

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const s3 = new S3Client({ region: AWS_REGION });

// Download file from URL
function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                return reject(new Error(`HTTP ${response.statusCode}`));
            }
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

// Get content type from file extension
function getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf'
    };
    return types[ext] || 'application/octet-stream';
}

// Ensure S3 bucket exists
async function ensureBucket() {
    try {
        await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
        console.log(`✓ S3 bucket ${S3_BUCKET} exists`);
        return true;
    } catch (err) {
        if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
            if (DRY_RUN) {
                console.log(`[DRY-RUN] Would create bucket: ${S3_BUCKET}`);
                return false;
            }
            console.log(`Creating S3 bucket: ${S3_BUCKET}...`);
            await s3.send(new CreateBucketCommand({
                Bucket: S3_BUCKET,
                CreateBucketConfiguration: { LocationConstraint: AWS_REGION }
            }));
            console.log(`✓ Created bucket ${S3_BUCKET}`);
            return true;
        }
        throw err;
    }
}

// List all files in Supabase bucket recursively
async function listAllFiles(path = '') {
    const allFiles = [];

    const { data, error } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .list(path, { limit: 1000 });

    if (error) {
        console.error(`Error listing ${path}:`, error.message);
        return allFiles;
    }

    for (const item of data || []) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        if (item.id === null) {
            // It's a folder, recurse
            const subFiles = await listAllFiles(fullPath);
            allFiles.push(...subFiles);
        } else {
            allFiles.push({ name: fullPath, metadata: item.metadata });
        }
    }

    return allFiles;
}

// Migrate a single file
async function migrateFile(filePath) {
    try {
        // Get public URL
        const { data } = supabase.storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(filePath);

        if (!data?.publicUrl) {
            return { path: filePath, success: false, error: 'No public URL' };
        }

        if (DRY_RUN) {
            return { path: filePath, success: true, dryRun: true };
        }

        // Download from Supabase
        const fileBuffer = await downloadFile(data.publicUrl);

        // Upload to S3
        await s3.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: filePath,
            Body: fileBuffer,
            ContentType: getContentType(filePath)
        }));

        return { path: filePath, success: true };
    } catch (err) {
        return { path: filePath, success: false, error: err.message };
    }
}

async function main() {
    console.log('='.repeat(50));
    console.log('SUPABASE STORAGE → S3 MIGRATION');
    console.log('='.repeat(50));
    if (DRY_RUN) console.log('\n*** DRY RUN MODE - No changes will be made ***\n');

    try {
        // Ensure S3 bucket exists
        await ensureBucket();

        // List all files in Supabase
        console.log(`\nListing files in Supabase bucket: ${SUPABASE_BUCKET}...`);
        const files = await listAllFiles();
        console.log(`Found ${files.length} files\n`);

        if (files.length === 0) {
            console.log('No files to migrate.');
            return;
        }

        // Migrate each file
        let success = 0, failed = 0;
        const errors = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            process.stdout.write(`\rMigrating ${i + 1}/${files.length}: ${file.name.substring(0, 40).padEnd(40)}`);

            const result = await migrateFile(file.name);
            if (result.success) {
                success++;
            } else {
                failed++;
                errors.push(result);
            }
        }

        // Summary
        console.log('\n\n' + '='.repeat(50));
        console.log('MIGRATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`\nTotal files:     ${files.length}`);
        console.log(`Migrated:        ${success}`);
        console.log(`Failed:          ${failed}`);

        if (errors.length > 0) {
            console.log('\nFailed files:');
            errors.slice(0, 10).forEach(e => console.log(`  - ${e.path}: ${e.error}`));
            if (errors.length > 10) {
                console.log(`  ... and ${errors.length - 10} more`);
            }
        }

        if (DRY_RUN) {
            console.log('\n*** DRY RUN - No files were actually migrated ***');
        }

    } catch (err) {
        console.error('\nMigration failed:', err);
    }
}

main();
