require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL, tenant_id VARCHAR(100),
    authority_limit NUMERIC, created_at TIMESTAMP DEFAULT NOW()
  )`);
  const email=(process.env.ADMIN_EMAIL||'runtime-admin@example.com').trim().toLowerCase();
  const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD||'RuntimeAcceptance123!',12);
  await pool.query(`INSERT INTO users (name,email,password_hash,role,tenant_id,authority_limit) VALUES ($1,$2,$3,'admin',$4,1000000) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash,role=EXCLUDED.role,tenant_id=EXCLUDED.tenant_id,authority_limit=EXCLUDED.authority_limit`,['Runtime Administrator',email,hash,process.env.GOVERNANCE_TENANT_ID||'runtime-tenant']);
}
main().then(()=>pool.end()).catch(async e=>{console.error(`Runtime initialization failed: ${e.message}`);await pool.end().catch(()=>{});process.exit(1)});
