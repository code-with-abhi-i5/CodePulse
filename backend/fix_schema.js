const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.apoejsduhsbzychbxbek:%40Abhijeet10myt@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

client.connect()
  .then(() => {
    console.log('Connected! Adding columns...');
    return client.query(`
      ALTER TABLE "developer_stats"
      ADD COLUMN IF NOT EXISTS "contributionData" JSONB,
      ADD COLUMN IF NOT EXISTS "commitActivity" JSONB;
    `);
  })
  .then(() => {
    console.log('Columns added successfully!');
    return client.end();
  })
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
