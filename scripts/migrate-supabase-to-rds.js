/**
 * Database Migration Script: Supabase REST API → Amazon RDS Aurora (Data API)
 *
 * Reads from Supabase via REST API (works over IPv4/HTTPS).
 * Writes to RDS Aurora via Data API (no VPC needed).
 *
 * Usage:
 *   node migrate-supabase-to-rds.js [--dry-run]
 */

const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');

// =============================================
// CONFIGURATION
// =============================================
const SUPABASE_URL = 'https://yyqoagncaxzpxodwnuax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cW9hZ25jYXh6cHhvZHdudWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDYxNTUsImV4cCI6MjA4MzgyMjE1NX0.s86PaXIhEccHCqDJxwfXF7HOsNMkkdfD-pYEsSGANcY';

const DB_CLUSTER_ARN = 'arn:aws:rds:ap-south-1:173256371846:cluster:shadowbeanco-db';
const DB_SECRET_ARN = 'arn:aws:secretsmanager:ap-south-1:173256371846:secret:shadowbeanco/db-credentials-w4j4Pe';
const DB_NAME = 'shadowbeanco';

const DRY_RUN = process.argv.includes('--dry-run');
const rds = new RDSDataClient({ region: 'ap-south-1' });

// Execute SQL via RDS Data API
async function rdsQuery(sql, params = []) {
    const parameters = params.map((val, i) => {
        const param = { name: `p${i + 1}` };
        if (val === null || val === undefined) {
            param.value = { isNull: true };
        } else if (typeof val === 'boolean') {
            param.value = { booleanValue: val };
        } else if (typeof val === 'number') {
            if (Number.isInteger(val)) {
                param.value = { longValue: val };
            } else {
                param.value = { doubleValue: val };
            }
        } else {
            param.value = { stringValue: String(val) };
        }
        return param;
    });

    let dataSql = sql;
    for (let i = params.length; i >= 1; i--) {
        dataSql = dataSql.replace(new RegExp(`\\$${i}`, 'g'), `:p${i}`);
    }

    const cmd = new ExecuteStatementCommand({
        resourceArn: DB_CLUSTER_ARN,
        secretArn: DB_SECRET_ARN,
        database: DB_NAME,
        sql: dataSql,
        parameters: parameters.length > 0 ? parameters : undefined,
    });

    return await rds.send(cmd);
}

// Fetch table data from Supabase REST API
async function fetchSupabaseTable(tableName) {
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;
    const resp = await fetch(url, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation',
        },
    });

    if (!resp.ok) {
        const text = await resp.text();
        if (resp.status === 404 || text.includes('does not exist')) {
            return null; // table doesn't exist
        }
        throw new Error(`Supabase API error ${resp.status}: ${text}`);
    }

    return await resp.json();
}

// Tables to migrate (respects FK dependencies)
const TABLES = [
    'profiles',
    'admin_users',
    'products',
    'taste_profiles',
    'addresses',
    'pricing',
    'terms_and_conditions',
    'app_assets',
    'orders',
    'order_items',
    'reviews',
];

const SKIP_COLUMNS = new Set(['raw_user_meta_data', 'raw_app_meta_data']);

// Per-table column overrides: skip columns where source type doesn't match target
const TABLE_SKIP_COLUMNS = {
    'admin_users': new Set(['id']),  // Source has UUID, target has serial integer
};

// Value transformations per table/column
function transformValue(tableName, col, val) {
    // terms_and_conditions.version: "1.0" -> 1
    if (tableName === 'terms_and_conditions' && col === 'version' && typeof val === 'string') {
        return Math.floor(parseFloat(val));
    }
    return val;
}

async function getRdsColumns(tableName) {
    const result = await rdsQuery(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
        [tableName]
    );
    const colMap = {};
    for (const r of (result.records || [])) {
        colMap[r[0].stringValue] = r[1].stringValue;
    }
    return colMap;
}

// Map PostgreSQL types to cast expressions
function getCast(dataType) {
    const castMap = {
        'uuid': '::uuid',
        'integer': '::integer',
        'bigint': '::bigint',
        'smallint': '::smallint',
        'numeric': '::numeric',
        'real': '::real',
        'double precision': '::double precision',
        'boolean': '::boolean',
        'timestamp with time zone': '::timestamptz',
        'timestamp without time zone': '::timestamp',
        'jsonb': '::jsonb',
        'json': '::json',
        'ARRAY': '::jsonb',
    };
    return castMap[dataType] || '';
}

async function migrateTable(tableName) {
    console.log(`\nMigrating: ${tableName}`);
    console.log('-'.repeat(40));

    // Fetch from Supabase REST API
    const rows = await fetchSupabaseTable(tableName);

    if (rows === null) {
        console.log('  Table does not exist in Supabase, skipping');
        return { table: tableName, source: 0, migrated: 0, skipped: true };
    }

    console.log(`  Source rows: ${rows.length}`);

    if (rows.length === 0) {
        console.log('  No data to migrate');
        return { table: tableName, source: 0, migrated: 0 };
    }

    // Get target columns with types from RDS
    const targetColMap = await getRdsColumns(tableName);

    if (Object.keys(targetColMap).length === 0) {
        console.log('  Table does not exist in RDS, skipping');
        return { table: tableName, source: rows.length, migrated: 0, skipped: true };
    }

    if (DRY_RUN) {
        console.log(`  [DRY-RUN] Would migrate ${rows.length} rows`);
        console.log(`  Target columns: ${Object.keys(targetColMap).join(', ')}`);
        const sampleRow = rows[0];
        const sourceColumns = Object.keys(sampleRow).filter(c => !SKIP_COLUMNS.has(c));
        console.log(`  Source columns: ${sourceColumns.join(', ')}`);
        return { table: tableName, source: rows.length, migrated: 0 };
    }

    let migrated = 0;
    let errors = 0;

    for (const row of rows) {
        const tableSkip = TABLE_SKIP_COLUMNS[tableName] || new Set();
        const columns = Object.keys(row).filter(
            col => col in targetColMap && !SKIP_COLUMNS.has(col) && !tableSkip.has(col) && row[col] !== undefined
        );

        const values = columns.map(col => {
            let val = row[col];
            if (val === null) return null;
            val = transformValue(tableName, col, val);
            if (typeof val === 'object') return JSON.stringify(val);
            return val;
        });

        // Add type casts to placeholders based on column data type
        const placeholders = columns.map((col, i) => `$${i + 1}${getCast(targetColMap[col])}`);
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT DO NOTHING`;

        try {
            await rdsQuery(sql, values);
            migrated++;
        } catch (err) {
            errors++;
            if (errors <= 3) {
                console.error(`  Error on row ${migrated + errors}: ${err.message}`);
            }
        }
    }

    console.log(`  Migrated: ${migrated}/${rows.length}${errors > 0 ? ` (${errors} errors)` : ''}`);
    return { table: tableName, source: rows.length, migrated, errors };
}

async function main() {
    console.log('='.repeat(50));
    console.log('SUPABASE -> RDS AURORA MIGRATION');
    console.log('(Supabase REST API -> RDS Data API)');
    console.log('='.repeat(50));
    if (DRY_RUN) console.log('\n*** DRY RUN MODE - No data will be written ***\n');

    try {
        console.log('Testing RDS Data API...');
        const tableCheck = await rdsQuery(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
        );
        const rdsTableNames = (tableCheck.records || []).map(r => r[0].stringValue);

        if (rdsTableNames.length === 0) {
            console.error('ERROR: No tables found in RDS.');
            process.exit(1);
        }
        console.log(`RDS tables: ${rdsTableNames.join(', ')}\n`);

        // Disable FK constraints
        if (!DRY_RUN) {
            await rdsQuery('SET session_replication_role = replica');
        }

        // Migrate each table
        const results = [];
        for (const table of TABLES) {
            try {
                const result = await migrateTable(table);
                results.push(result);
            } catch (err) {
                console.error(`  FATAL error on ${table}: ${err.message}`);
                results.push({ table, source: 0, migrated: 0, errors: 1, fatal: err.message });
            }
        }

        // Re-enable FK constraints
        if (!DRY_RUN) {
            await rdsQuery('SET session_replication_role = DEFAULT');
        }

        // Summary
        console.log('\n' + '='.repeat(55));
        console.log('MIGRATION SUMMARY');
        console.log('='.repeat(55));
        console.log('Table                     | Source | Migrated | Status');
        console.log('-'.repeat(55));

        let totalSource = 0;
        let totalMigrated = 0;

        for (const r of results) {
            totalSource += r.source;
            totalMigrated += r.migrated;
            const status = r.fatal ? 'FATAL' : (r.skipped ? 'SKIP' : (r.errors ? 'PARTIAL' : 'OK'));
            console.log(
                `${r.table.padEnd(25)} | ${String(r.source).padStart(6)} | ${String(r.migrated).padStart(8)} | ${status}`
            );
        }

        console.log('-'.repeat(55));
        console.log(`${'TOTAL'.padEnd(25)} | ${String(totalSource).padStart(6)} | ${String(totalMigrated).padStart(8)} |`);
        console.log('\nMigration complete.');

    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

main();
