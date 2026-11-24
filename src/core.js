import crypto from 'node:crypto';
import {cases, publicCase} from './cases.js';
import {createTicket,getTicket,saveStudentTicket,getAllTickets,reviewTicket,getTwist,setTwist} from './store.js';

const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const env = (key, fallback) => process.env[key] || (isProd ? '' : fallback);
const credentials = () => ({
  user:env('ADMIN_USERNAME','skolotajs'), password:env('ADMIN_PASSWORD','DevTeacher123!'),
  session:env('SESSION_SECRET','dev-only-secret-not-for-production'), pin:env('CLASS_PIN','DB2026')
});
const sha = str => crypto.createHash('sha256').update(str).digest('hex');
const safeEqual=(a,b)=> {
  const x=Buffer.from(String(a)), y=Buffer.from(String(b));
  return x.length===y.length && crypto.timingSafeEqual(x,y);
};
const clean = (v,max=2000) => typeof v==='string' ? v.trim().slice(0,max) : '';
function send(res,code,payload) {
  res.statusCode=code;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(payload));
}
function fail(res,status,message) {send(res,status,{ok:false,error:message});}
function getCookie(req,key){
  const cookies=(req.headers.cookie||'').split(';').map(s=>s.trim());
  const found=cookies.find(x=>x.startsWith(key+'='));
  return found?found.slice(key.length+1):'';
}
function cookieValue() {
  const payload=Buffer.from(JSON.stringify({role:'teacher',exp:Date.now()+12*60*60*1000})).toString('base64url');
  const signature=crypto.createHmac('sha256',credentials().session).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}
function isAdmin(req) {
  const token=getCookie(req,'ticketlab_session');
  if (!token.includes('.')) return false;
  const [payload,sig]=token.split('.');
  const expected=crypto.createHmac('sha256',credentials().session).update(payload).digest('base64url');
  if (!safeEqual(sig,expected)) return false;
  try {const data=JSON.parse(Buffer.from(payload,'base64url').toString());return data.role==='teacher' && Number(data.exp)>Date.now();} catch {return false;}
}
const ticketPublic=t=>({
  code:t.code,name:t.consultant_name,group:t.class_group,status:t.status,case:publicCase(t.case_id),
  answers:t.answers??{},grade:t.grade,feedback:t.feedback,
  created_at:t.created_at,submitted_at:t.submitted_at,reviewed_at:t.reviewed_at
});
async function parseBody(req) {
  let text='';
  for await(const chunk of req) {
    text+=chunk.toString();
    if (text.length>30000) throw Object.assign(new Error('Pieprasījums ir pārāk liels'),{status:413});
  }
  try { return text ? JSON.parse(text) : {}; } catch { throw Object.assign(new Error('Nederīgs JSON formāts'),{status:400}); }
}
const names=['MySQL','PostgreSQL','SQLite'];
function validateAnswers(raw,submit,needsTwist) {
  if (!raw || typeof raw!=='object' || Array.isArray(raw)) throw Object.assign(new Error('Nepareizs atbilžu formāts'),{status:400});
  const a={
    dbvs:clean(raw.dbvs,20), reasons:Array.isArray(raw.reasons)?raw.reasons.slice(0,3).map(x=>clean(x,700)):[],
    alternative:clean(raw.alternative,20),comparison:clean(raw.comparison,1000),risk:clean(raw.risk,1000),
    integrity:clean(raw.integrity,1000),twist_response:clean(raw.twist_response,1200),summary:clean(raw.summary,1000)
  };
  while(a.reasons.length<3) a.reasons.push('');
  if (a.dbvs && !names.includes(a.dbvs)) throw Object.assign(new Error('Izvēlies atļautu DBVS'),{status:400});
  if (a.alternative && !names.includes(a.alternative)) throw Object.assign(new Error('Izvēlies atļautu alternatīvu'),{status:400});
  if (submit) {
    const missing=[];
    if(!names.includes(a.dbvs))missing.push('DBVS izvēle');
    if(a.reasons.some(x=>x.length<12))missing.push('3 tehniskie argumenti (katrs vismaz 12 rakstzīmes)');
    if(!names.includes(a.alternative)||a.alternative===a.dbvs||a.comparison.length<20)missing.push('alternatīvas salīdzinājums');
    if(a.risk.length<20)missing.push('risku skaidrojums');
    if(a.integrity.length<20)missing.push('datu integritātes un kopiju plāns');
    if(a.summary.length<20)missing.push('secinājums');
    if(needsTwist && a.twist_response.length<20)missing.push('reakcija uz klienta jauno prasību');
    if(missing.length)throw Object.assign(new Error('Nepabeigtie lauki: '+missing.join('; ')),{status:400});
  }
  return a;
}
function requireAdmin(req,res) {if(!isAdmin(req)){fail(res,401,'Nepieciešama skolotāja autorizācija');return false;}return true;}
function verifyStudent(row,token) {return row && typeof token==='string' && token.length>=30 && safeEqual(row.token_hash,sha(token));}
function csvCell(v) {const str=String(v??'');const safe=/^[=+@\-\t\r]/.test(str)?"'"+str:str;return '"'+safe.replace(/"/g,'""')+'"';}
function csvExport(tickets) {
  const headers=['Ticket','Konsultants','Grupa','Situācija','Statuss','DBVS','Vērtējums','Komentārs','Iesniegšanas datums'];
  return '\uFEFF'+[headers,...tickets.map(t=>[t.code,t.consultant_name,t.class_group,publicCase(t.case_id)?.title??t.case_id,t.status,t.answers?.dbvs??'',t.grade??'',t.feedback??'',t.submitted_at??''])].map(row=>row.map(csvCell).join(';')).join('\r\n');
}
export async function handler(req,res) {
  const url=new URL(req.url,'http://localhost');
  const op=url.searchParams.get('op')||'health';
  const method=(req.method||'GET').toUpperCase();
  if (isProd && (!process.env.ADMIN_PASSWORD||!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32||!process.env.CLASS_PIN||!process.env.DATABASE_URL)) {
    return fail(res,503,'Servera konfigurācija nav pabeigta. Pārbaudi Vercel vides mainīgos.');
  }
  try {
    if(method==='POST') {
      const origin=req.headers.origin;
      const host=req.headers['x-forwarded-host']||req.headers.host;
      if(origin && host && new URL(origin).host!==host) return fail(res,403,'Atļauti tikai vienas vietnes pieprasījumi');
      if(!(req.headers['content-type']||'').includes('application/json'))return fail(res,415,'Nepieciešams JSON pieprasījums');
    }
    if(op==='health'&&method==='GET')return send(res,200,{ok:true,project:'TicketLab',mode:process.env.DATABASE_URL?'neon':'local'});
    if(op==='status'&&method==='GET')return send(res,200,{ok:true,twist:await getTwist()});
    if(op==='login'&&method==='POST') {
      const b=await parseBody(req),c=credentials();
      if(!safeEqual(clean(b.username,80),c.user)||!safeEqual(String(b.password||''),c.password))return fail(res,401,'Nepareizs lietotājvārds vai parole');
      res.setHeader('Set-Cookie',`ticketlab_session=${cookieValue()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${isProd?'; Secure':''}`);
      return send(res,200,{ok:true});
    }
    if(op==='logout'&&method==='POST') {
      res.setHeader('Set-Cookie',`ticketlab_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isProd?'; Secure':''}`);
      return send(res,200,{ok:true});
    }
    if(op==='me'&&method==='GET')return send(res,200,{ok:true,admin:isAdmin(req)});
    if(op==='create'&&method==='POST') {
      const b=await parseBody(req);
      if(!safeEqual(clean(b.pin,100),credentials().pin))return fail(res,403,'Nepareizs nodarbības piekļuves kods');
      const name=clean(b.name,80),group=clean(b.group,60);
      if(name.length<2)return fail(res,400,'Ieraksti konsultanta vārdu (vismaz 2 rakstzīmes)');
      const chosen=cases[crypto.randomInt(cases.length)];
      const code='TL-'+crypto.randomBytes(4).toString('hex').toUpperCase();
      const token=crypto.randomBytes(24).toString('base64url');
      const row=await createTicket({code,tokenHash:sha(token),name,group,caseId:chosen.id});
      return send(res,201,{ok:true,token,ticket:ticketPublic(row),twist:await getTwist()});
    }
    if(op==='ticket'&&method==='POST') {
      const b=await parseBody(req);
      const code=clean(b.code,20),token=b.token||'';
      const row=await getTicket(code);
      if(!verifyStudent(row,token))return fail(res,404,'Tickets nav atrasts vai piekļuves saite nav pareiza');
      return send(res,200,{ok:true,ticket:ticketPublic(row),twist:await getTwist()});
    }
    if(op==='save'&&method==='POST') {
      const b=await parseBody(req),row=await getTicket(clean(b.code,20));
      if(!verifyStudent(row,b.token))return fail(res,403,'Šim ticketam nav piekļuves');
      if(row.status!=='draft')return fail(res,409,'Iesniegtais tickets vairs nav rediģējams');
      const submit=b.submit===true,twist=await getTwist();
      const answers=validateAnswers(b.answers,submit,twist);
      const changed=await saveStudentTicket(row.code,answers,submit);
      if(!changed)return fail(res,409,'Tickets vairs nav rediģējams');
      return send(res,200,{ok:true,ticket:ticketPublic(changed),twist});
    }
    if(op==='admin-list'&&method==='GET') {
      if(!requireAdmin(req,res))return;
      const tickets=(await getAllTickets()).map(ticketPublic);
      return send(res,200,{ok:true,tickets,twist:await getTwist()});
    }
    if(op==='review'&&method==='POST') {
      if(!requireAdmin(req,res))return;
      const b=await parseBody(req),code=clean(b.code,20),grade=Number(b.grade),feedback=clean(b.feedback,2000);
      if(!Number.isInteger(grade)||grade<0||grade>10)return fail(res,400,'Vērtējumam jābūt veselam skaitlim no 0 līdz 10');
      const row=await reviewTicket(code,grade,feedback);
      if(!row)return fail(res,409,'Var vērtēt tikai iesniegtus ticketus');
      return send(res,200,{ok:true,ticket:ticketPublic(row)});
    }
    if(op==='twist'&&method==='POST') {
      if(!requireAdmin(req,res))return;
      const b=await parseBody(req);if(typeof b.enabled!=='boolean')return fail(res,400,'Trūkst enabled vērtības');
      return send(res,200,{ok:true,twist:await setTwist(b.enabled)});
    }
    if(op==='export'&&method==='GET') {
      if(!requireAdmin(req,res))return;
      res.statusCode=200;
      res.setHeader('Content-Type','text/csv; charset=utf-8');
      res.setHeader('Content-Disposition','attachment; filename="ticketlab-results.csv"');
      res.setHeader('Cache-Control','no-store');
      return res.end(csvExport(await getAllTickets()));
    }
    return fail(res,404,'Nezināms API pieprasījums');
  } catch(e) {
    if(e.status)return fail(res,e.status,e.message);
    console.error('[TicketLab]',e);
    return fail(res,500,'Servera kļūda. Pārbaudi konfigurāciju vai servera žurnālu.');
  }
}
export const internal={validateAnswers,csvExport,safeEqual,sha};
