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
  catch (e) { if (e.code !== 'ENOENT') throw e; localCache = {tickets:[], changes:[], settings:{twist_enabled:'false'}}; }
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

/**
 * Klienta izmaiņas tiek glabātas atsevišķi no tickets.answers.
 * Neviena izmaiņu pievienošana vai atbilde nepārraksta sākotnējos darbus/vērtējumus.
 */
export async function getChanges(ticketCode) {
  const sql = await getSql();
  if (sql) return sql`SELECT * FROM ticket_changes WHERE ticket_code=${ticketCode} ORDER BY id ASC`;
  return copy(((await localData()).changes ?? []).filter(x=>x.ticket_code===ticketCode).sort((a,b)=>a.id-b.id));
}

export async function getAllChanges() {
  const sql = await getSql();
  if (sql) return sql`SELECT * FROM ticket_changes ORDER BY id ASC`;
  return copy(((await localData()).changes ?? []).sort((a,b)=>a.id-b.id));
}

export async function issueChanges(entries) {
  if (!entries.length) return [];
  const sql = await getSql();
  if (sql) {
    // Viens SQL INSERT visai klasei: atomiska darbība, nekad neizmanto UPDATE tickets.
    const rows = await sql`INSERT INTO ticket_changes (ticket_code, difficulty, title, description)
      SELECT c.ticket_code, c.difficulty, c.title, c.description
      FROM jsonb_to_recordset(${JSON.stringify(entries)}::jsonb)
        AS c(ticket_code TEXT, difficulty TEXT, title TEXT, description TEXT)
      JOIN tickets t ON t.code = c.ticket_code
      RETURNING *`;
    return rows;
  }
  return mutateLocal(db=>{
    db.changes ??= [];
    const existing = new Set(db.tickets.map(t=>t.code));
    if(entries.some(e=>!existing.has(e.ticket_code))) throw new Error('Nav atrasts viens no ticketiem');
    let nextId = Math.max(0,...db.changes.map(c=>c.id));
    const now = new Date().toISOString();
    const created = entries.map(e=>({
      id:++nextId,ticket_code:e.ticket_code,difficulty:e.difficulty,
      title:e.title,description:e.description,response:'',status:'draft',
      created_at:now,updated_at:now,submitted_at:null
    }));
    db.changes.push(...created);
    return copy(created);
  });
}

export async function saveChangeResponse(ticketCode, changeId, response, submit) {
  const sql = await getSql();
  if (sql) {
    const rows=await sql`UPDATE ticket_changes SET response=${response},
      status=${submit?'submitted':'draft'}, updated_at=NOW(),
      submitted_at=CASE WHEN ${submit} THEN NOW() ELSE submitted_at END
      WHERE id=${changeId} AND ticket_code=${ticketCode} AND status='draft' RETURNING *`;
    return rows[0] ?? null;
  }
  return mutateLocal(db=>{
    const item=(db.changes??[]).find(c=>c.ticket_code===ticketCode && c.id===changeId);
    if(!item || item.status!=='draft') return null;
    item.response=response;item.status=submit?'submitted':'draft';
    item.updated_at=new Date().toISOString();
    if(submit)item.submitted_at=item.updated_at;
    return copy(item);
  });
}
