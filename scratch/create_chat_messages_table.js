const BASE_URL = 'https://fluxbase.vercel.app';
const API_KEY = 'fl_420392f791e71034a668fec0f5f85c822c4547697c7c4cbe';
const PROJECT_ID = 'a3fdb50d092a4b97';

async function query(sql, params = []) {
  const res = await fetch(`${BASE_URL}/api/execute-sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ projectId: PROJECT_ID, query: sql, params })
  });
  return await res.json();
}

async function main() {
  console.log('Creating chat_messages table...');
  const res1 = await query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      conversation_id VARCHAR(64) NOT NULL,
      role VARCHAR(16) NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Table chat_messages created:', res1);

  const res2 = await query(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_conv ON chat_messages(user_id, conversation_id, created_at ASC);
  `);
  console.log('Index created:', res2);

  const verify = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chat_messages' ORDER BY ordinal_position;`);
  console.log('Columns:', verify.data);
}

main().catch(console.error);
