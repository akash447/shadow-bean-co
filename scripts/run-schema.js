/**
 * Execute RDS schema via Data API
 * Splits SQL into individual statements and runs them sequentially.
 */
const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
const fs = require('fs');
const path = require('path');

const CLUSTER_ARN = process.env.DB_CLUSTER_ARN || 'arn:aws:rds:ap-south-1:173256371846:cluster:shadowbeanco-db';
const SECRET_ARN = process.env.DB_SECRET_ARN || 'arn:aws:secretsmanager:ap-south-1:173256371846:secret:shadowbeanco/db-credentials-w4j4Pe';
const DB_NAME = process.env.DB_NAME || 'shadowbeanco';

const rds = new RDSDataClient({ region: 'ap-south-1' });

async function runSQL(sql) {
    return rds.send(new ExecuteStatementCommand({
        resourceArn: CLUSTER_ARN,
        secretArn: SECRET_ARN,
        database: DB_NAME,
        sql,
        includeResultMetadata: true,
    }));
}

async function main() {
    const schemaPath = path.join(__dirname, '..', 'database', 'rds_schema.sql');
    const rawSQL = fs.readFileSync(schemaPath, 'utf-8');

    // Split on semicolons, handling $$ function bodies
    const statements = [];
    let current = '';
    let inDollarQuote = false;

    for (const line of rawSQL.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('--') || trimmed === '') {
            continue;
        }

        if (trimmed.includes('$$')) {
            inDollarQuote = !inDollarQuote;
        }

        current += line + '\n';

        if (trimmed.endsWith(';') && !inDollarQuote) {
            const stmt = current.trim();
            if (stmt.length > 1) {
                statements.push(stmt);
            }
            current = '';
        }
    }

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
        process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

        try {
            const result = await runSQL(stmt);
            if (result.records?.length) {
                console.log(`OK (${result.records.length} rows)`);
                result.records.forEach(row => {
                    const vals = row.map(f => f.stringValue || f.longValue || '').join(', ');
                    console.log(`   -> ${vals}`);
                });
            } else {
                console.log('OK');
            }
            success++;
        } catch (err) {
            console.log(`FAILED: ${err.message}`);
            failed++;
        }
    }

    console.log(`\nDone: ${success} succeeded, ${failed} failed out of ${statements.length} total`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
