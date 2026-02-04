/**
 * Database Migration Script: Supabase Postgres → DynamoDB
 * 
 * This script migrates all tables from Supabase to AWS DynamoDB.
 * Run with: node migrate-db.js [--dry-run]
 */

const { Client } = require('pg');
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, PutItemCommand, BatchWriteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

// Configuration
// Note: @ in password is URL-encoded as %40
const SUPABASE_CONNECTION_STRING = process.env.SUPABASE_CONNECTION_STRING ||
    'postgresql://postgres:Akashsingh%401122@db.yyqoagncaxzpxodwnuax.supabase.co:5432/postgres';

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const DRY_RUN = process.argv.includes('--dry-run');

// Initialize clients
const pgClient = new Client({ connectionString: SUPABASE_CONNECTION_STRING });
const dynamodb = new DynamoDBClient({ region: AWS_REGION });

// Table definitions for DynamoDB
const TABLES = {
    profiles: {
        TableName: 'shadowbeanco-profiles',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST'
    },
    orders: {
        TableName: 'shadowbeanco-orders',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [{
            IndexName: 'user_id-index',
            KeySchema: [{ AttributeName: 'user_id', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' }
        }],
        BillingMode: 'PAY_PER_REQUEST'
    },
    order_items: {
        TableName: 'shadowbeanco-order-items',
        KeySchema: [
            { AttributeName: 'order_id', KeyType: 'HASH' },
            { AttributeName: 'id', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'order_id', AttributeType: 'S' },
            { AttributeName: 'id', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    },
    taste_profiles: {
        TableName: 'shadowbeanco-taste-profiles',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [{
            IndexName: 'user_id-index',
            KeySchema: [{ AttributeName: 'user_id', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' }
        }],
        BillingMode: 'PAY_PER_REQUEST'
    },
    addresses: {
        TableName: 'shadowbeanco-addresses',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'user_id', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [{
            IndexName: 'user_id-index',
            KeySchema: [{ AttributeName: 'user_id', KeyType: 'HASH' }],
            Projection: { ProjectionType: 'ALL' }
        }],
        BillingMode: 'PAY_PER_REQUEST'
    },
    reviews: {
        TableName: 'shadowbeanco-reviews',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST'
    }
};

// Helper to ensure table exists
async function ensureTable(tableConfig) {
    try {
        await dynamodb.send(new DescribeTableCommand({ TableName: tableConfig.TableName }));
        console.log(`  ✓ Table ${tableConfig.TableName} already exists`);
        return true;
    } catch (err) {
        if (err.name === 'ResourceNotFoundException') {
            if (DRY_RUN) {
                console.log(`  [DRY-RUN] Would create table: ${tableConfig.TableName}`);
                return false;
            }
            console.log(`  Creating table: ${tableConfig.TableName}...`);
            await dynamodb.send(new CreateTableCommand(tableConfig));
            // Wait for table to be active
            let active = false;
            while (!active) {
                await new Promise(r => setTimeout(r, 2000));
                const desc = await dynamodb.send(new DescribeTableCommand({ TableName: tableConfig.TableName }));
                active = desc.Table.TableStatus === 'ACTIVE';
            }
            console.log(`  ✓ Table ${tableConfig.TableName} created`);
            return true;
        }
        throw err;
    }
}

// Helper to convert Postgres row to DynamoDB item
function toDynamoItem(row) {
    const item = {};
    for (const [key, value] of Object.entries(row)) {
        if (value === null || value === undefined) continue;
        if (typeof value === 'object' && !(value instanceof Date)) {
            item[key] = { S: JSON.stringify(value) };
        } else if (typeof value === 'number') {
            item[key] = { N: String(value) };
        } else if (typeof value === 'boolean') {
            item[key] = { BOOL: value };
        } else if (value instanceof Date) {
            item[key] = { S: value.toISOString() };
        } else {
            item[key] = { S: String(value) };
        }
    }
    return item;
}

// Migrate a single table
async function migrateTable(tableName, dynamoTableName) {
    console.log(`\nMigrating ${tableName}...`);

    // Read from Postgres
    const result = await pgClient.query(`SELECT * FROM ${tableName}`);
    const rows = result.rows;
    console.log(`  Found ${rows.length} records in Supabase`);

    if (rows.length === 0) {
        console.log(`  ✓ No data to migrate`);
        return { table: tableName, source: 0, migrated: 0 };
    }

    if (DRY_RUN) {
        console.log(`  [DRY-RUN] Would migrate ${rows.length} records to ${dynamoTableName}`);
        return { table: tableName, source: rows.length, migrated: 0 };
    }

    // Batch write to DynamoDB (max 25 items per batch)
    let migrated = 0;
    for (let i = 0; i < rows.length; i += 25) {
        const batch = rows.slice(i, i + 25);
        const writeRequests = batch.map(row => ({
            PutRequest: { Item: toDynamoItem(row) }
        }));

        try {
            await dynamodb.send(new BatchWriteItemCommand({
                RequestItems: { [dynamoTableName]: writeRequests }
            }));
            migrated += batch.length;
            process.stdout.write(`\r  Migrated ${migrated}/${rows.length} records`);
        } catch (err) {
            console.error(`\n  Error migrating batch:`, err.message);
        }
    }

    console.log(`\n  ✓ Migrated ${migrated} records`);
    return { table: tableName, source: rows.length, migrated };
}

async function main() {
    console.log('='.repeat(50));
    console.log('SUPABASE → DYNAMODB MIGRATION');
    console.log('='.repeat(50));
    if (DRY_RUN) console.log('\n*** DRY RUN MODE - No changes will be made ***\n');

    try {
        // Connect to Postgres
        console.log('Connecting to Supabase Postgres...');
        await pgClient.connect();
        console.log('✓ Connected to Supabase\n');

        // Create DynamoDB tables
        console.log('Ensuring DynamoDB tables exist...');
        for (const [name, config] of Object.entries(TABLES)) {
            await ensureTable(config);
        }

        // Migrate each table
        const results = [];
        for (const [pgTable, config] of Object.entries(TABLES)) {
            try {
                const result = await migrateTable(pgTable, config.TableName);
                results.push(result);
            } catch (err) {
                console.error(`  Error migrating ${pgTable}:`, err.message);
                results.push({ table: pgTable, source: 0, migrated: 0, error: err.message });
            }
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('MIGRATION SUMMARY');
        console.log('='.repeat(50));
        console.log('\nTable                  | Source | Migrated | Status');
        console.log('-'.repeat(55));
        for (const r of results) {
            const status = r.error ? '❌ Error' : (r.migrated === r.source ? '✓ OK' : '⚠ Partial');
            console.log(`${r.table.padEnd(22)} | ${String(r.source).padStart(6)} | ${String(r.migrated).padStart(8)} | ${status}`);
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pgClient.end();
    }
}

main();
