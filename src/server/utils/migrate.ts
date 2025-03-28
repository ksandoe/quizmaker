import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

async function executeSql(statement: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({
      query: statement
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`SQL execution failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/002_update_primary_keys.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    // Split into individual statements
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await executeSql(statement);
        console.log('Successfully executed:', statement);
      } catch (error) {
        console.error('Error executing statement:', statement);
        console.error('Error details:', error);
        throw error;
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
