import fs from 'node:fs/promises';
import path from 'node:path';

let cachedSql;
async function getSql() {
  if (!process.env.DATABASE_URL) {
    if (process.env.VERCEL === '1') throw new Error('DATABASE_URL nav konfigurēts. Vercel nepieciešama Neon datubāze.');
    return null;
  }
  if (!cachedSql) {
    const { neon } = await import('@neondatabase/serverless');
    cachedSql = neon(process.env.DATABASE_URL);
  }
  return cachedSql;
}

const localPath = path.join(process.cwd(), 'data', 'dev-db.json');
let localCache = null;
let writeQueue = Promise.resolve();

async function localData() {
  if (localCache) return localCache;
  try { localCache = JSON.parse(await fs.readFile(localPath, 'utf8')); }
  catch (e) { if (e.code !== 'ENOENT') throw e; localCache = {tickets:[], settings:{twist_enabled:'false'}}; }
  return localCache;
}
async function saveLocal() {
  await fs.mkdir(path.dirname(localPath), {recursive:true});
  const tmp = localPath + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(localCache, null, 2));
  await fs.rename(tmp, localPath);
}
async function mutateLocal(fn) {
  const job = writeQueue.catch(()=>{}).then(async () => {
    const data = await localData();
    const result = fn(data);
    await saveLocal();
    return result;
  });
  writeQueue = job.then(()=>{},()=>{});
  return job;
}
const copy = value => structuredClone(value);

export async function createTicket(ticket) {
  const sql = await getSql();
  if (sql) {
    const rows = await sql`INSERT INTO tickets (code, token_hash, consultant_name, class_group, case_id)
      VALUES (${ticket.code}, ${ticket.tokenHash}, ${ticket.name}, ${ticket.group}, ${ticket.caseId})
      RETURNING *`;
    return rows[0];
  }
  return mutateLocal(db => {
    if (db.tickets.some(x=>x.code===ticket.code)) throw new Error('Ticketu koda kolīzija');
    const now = new Date().toISOString();
    const row = {code:ticket.code,token_hash:ticket.tokenHash,consultant_name:ticket.name,class_group:ticket.group,case_id:ticket.caseId,status:'draft',answers:{},grade:null,feedback:'',created_at:now,updated_at:now,submitted_at:null,reviewed_at:null};
    db.tickets.unshift(row);
    return copy(row);
  });
}

export async function getTicket(code) {
  const sql = await getSql();
  if (sql) { const rows = await sql`SELECT * FROM tickets WHERE code=${code} LIMIT 1`; return rows[0] ?? null; }
  return copy((await localData()).tickets.find(x=>x.code===code) ?? null);
}

export async function saveStudentTicket(code, answers, submit) {
  const sql = await getSql();
  if (sql) {
    const rows = await sql`UPDATE tickets SET answers=${JSON.stringify(answers)}::jsonb,
      status=${submit?'submitted':'draft'}, updated_at=NOW(),
      submitted_at=CASE WHEN ${submit} THEN NOW() ELSE submitted_at END
      WHERE code=${code} AND status='draft' RETURNING *`;
    return rows[0] ?? null;
  }
  return mutateLocal(db => {
    const row = db.tickets.find(x=>x.code===code);
    if (!row || row.status !== 'draft') return null;
    row.answers=copy(answers); row.updated_at=new Date().toISOString();
    if (submit) {row.status='submitted';row.submitted_at=new Date().toISOString();}
    return copy(row);
  });
}

export async function getAllTickets() {
  const sql=await getSql();
  if (sql) return sql`SELECT * FROM tickets ORDER BY created_at DESC`;
  return copy((await localData()).tickets).sort((a,b)=>b.created_at.localeCompare(a.created_at));
}

export async function reviewTicket(code, grade, feedback) {
  const sql=await getSql();
  if (sql) {
    const rows=await sql`UPDATE tickets SET grade=${grade}, feedback=${feedback}, status='reviewed',reviewed_at=NOW(),updated_at=NOW()
      WHERE code=${code} AND status IN ('submitted','reviewed') RETURNING *`;
    return rows[0] ?? null;
  }
  return mutateLocal(db => {
    const row=db.tickets.find(x=>x.code===code);
    if (!row || !['submitted','reviewed'].includes(row.status)) return null;
    row.grade=grade;row.feedback=feedback;row.status='reviewed';row.reviewed_at=new Date().toISOString();row.updated_at=new Date().toISOString();
    return copy(row);
  });
}

export async function getTwist() {
  const sql=await getSql();
  if (sql) {const rows=await sql`SELECT value FROM settings WHERE key='twist_enabled'`;return rows[0]?.value==='true';}
  return (await localData()).settings.twist_enabled==='true';
}

export async function setTwist(enabled) {
  const sql=await getSql();
  if (sql) {
    await sql`INSERT INTO settings (key,value) VALUES ('twist_enabled',${String(enabled)})
      ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`;
    return enabled;
  }
  return mutateLocal(db=>{db.settings.twist_enabled=String(enabled);return enabled;});
}
