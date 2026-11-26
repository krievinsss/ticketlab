const root=document.getElementById('root');
const names=['MySQL','PostgreSQL','SQLite'];
const state={ticket:null,token:'',admin:null,tickets:[],twist:false,selected:'',filter:'all',search:'',loading:false,error:'',saving:false};
const h=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const date=v=>v?new Date(v).toLocaleString('lv-LV',{dateStyle:'medium',timeStyle:'short'}):'—';
const statusLabel={draft:'Procesā',submitted:'Iesniegts',reviewed:'Novērtēts'};
const statusPill=s=>`<span class="pill ${s==='reviewed'?'green':s==='submitted'?'blue':'orange'}">${statusLabel[s]||s}</span>`;
const formatAnswer=v=> h((v??'').toString()||'—');
let toastTimer,saveTimer,refreshTimer;
function toast(message) {const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3400);}
function errText(e){return e?.message||'Neizdevās izpildīt darbību';}
async function api(op,data=null) {
  const url='/api/index?op='+encodeURIComponent(op);
  const res=await fetch(url,{method:data===null?'GET':'POST',credentials:'same-origin',headers:data===null?{}:{'Content-Type':'application/json'},body:data===null?undefined:JSON.stringify(data),cache:'no-store'});
  const answer=await res.json().catch(()=>({error:'Serveris neatgrieza derīgu atbildi'}));
  if(!res.ok)throw new Error(answer.error||`HTTP ${res.status}`);
  return answer;
}
const shell=content=>`<div class="shell screen"><header class="nav"><a class="logo" href="#/"><span class="mark">⌘</span><span>ticket<span class="brandAccent">lab.</span></span></a><nav class="navlinks"><a href="#/">Sākums</a><a href="#/start">Konsultantam</a><a href="#/admin">Skolotājam</a></nav></header>${content}<footer class="footer"><span>TicketLab · Datu bāzu tehnoloģijas · 3. kurss</span><span>Domā. Izvēlies. Pamato. 🚀</span></footer></div>`;
function renderLoading(label='Ielādējam ticketu...'){root.innerHTML=shell(`<main class="page"><div class="panel narrow center"><div class="spinner"></div><p class="muted">${h(label)}</p></div></main>`);}
function showHome(){
  root.innerHTML=shell(`<main class="page"><section class="hero"><div class="heroContent"><span class="pill dark">💼 IT konsultantu birojs · DBVS izaicinājums</span><h1>Tev ir jauns<br/><em>klients.</em> Ko darīsi?</h1><p class="lead">Saņem reālistisku IT klienta pieprasījumu, izvēlies piemērotāko datubāzi un pierādi, ka tava izvēle nav nejaušība.</p><div class="hero-actions"><a href="#/start" class="btn btn-primary">🎟️ Saņemt savu ticketu <span>→</span></a><a href="#/admin" class="btn btn-white">🔒 Skolotāja panelis</a></div></div><div class="hero-art"><div class="ticket-dummy"><span class="eyebrow">New ticket</span><p class="mono">TL-8B3F2A</p><hr/><b>Klientam ir problēma.</b><p>Tev ir risinājums?</p><hr/><span class="pill green">● Open case</span></div></div></section><div class="space40"></div><div class="sectionHead"><div><div class="eyebrow brandAccent">Kā tas darbojas</div><h2>Trīs soļi līdz risinājumam</h2></div></div><section class="features"><article class="feature"><div class="featureIcon">①</div><h3>Iepazīsties</h3><p>Ieraksti savu konsultanta vārdu un nodarbības kodu. Tev automātiski piešķirs klienta pieprasījumu.</p></article><article class="feature"><div class="featureIcon">②</div><h3>Izanalizē</h3><p>Izvēlies MySQL, PostgreSQL vai SQLite. Sniedz trīs tehniskus argumentus un salīdzini alternatīvas.</p></article><article class="feature"><div class="featureIcon">③</div><h3>Iesniedz</h3><p>Saglabā atbildi un nosūti to skolotājam. Saņem individuālu vērtējumu un komentāru.</p></article></section><div class="space40"></div><section class="panel" style="background:#eef9f5;border-color:#d8ebe5"><div class="rowBetween"><div><span class="pill green">⚡ Klienta pārsteigums</span><div class="space8"></div><h3>Projektā prasības mēdz mainīties.</h3><p class="muted">Skolotājs jebkurā brīdī var atvērt jaunu prasību. Tev jāpārdomā izvēle un jāpamato izmaiņas.</p></div><span style="font-size:50px">✨</span></div></section></main>`);
}
function showStart(){
  root.innerHTML=shell(`<main class="page"><a href="#/" class="backLink">← Atpakaļ uz sākumu</a><div class="panel narrow"><div class="center"><div style="font-size:41px">🎟️</div><div class="space16"></div><span class="pill green">Jauns konsultanta uzdevums</span><div class="space16"></div><h2>Laiks tikt pie klienta!</h2><p class="muted" style="margin-top:9px">Ievadi informāciju, lai saņemtu nejauši piešķirtu IT ticketu.</p></div><div class="space32"></div><form id="start-form"><div class="field"><label for="consultant">Konsultanta vārds, uzvārds vai segvārds</label><input id="consultant" name="name" placeholder="Piemēram, Jānis Bērziņš" maxlength="80" required minlength="2" autocomplete="name"/><span class="fieldHelp">Šis vārds būs redzams skolotāja panelī.</span></div><div class="field"><label for="group">Grupa (neobligāti)</label><input id="group" name="group" placeholder="Piemēram, IPa24" maxlength="60"/></div><div class="field"><label for="pin">Nodarbības piekļuves kods</label><input id="pin" name="pin" placeholder="Ievadi skolotāja doto kodu" maxlength="100" required autocomplete="off"/></div><div class="serviceHint">🔐 Saņemsi privātu saiti, ar kuru varēsi atgriezties pie sava darba. Saglabā to.</div><div class="space24"></div><div id="start-error"></div><button class="btn btn-primary btn-block" type="submit" id="create-btn">Ģenerēt klienta ticketu →</button></form></div></main>`);
}
const fullLink=()=>location.origin+location.pathname+'#/ticket/'+state.ticket.code+'/'+state.token;
function collectAnswers(){
  const form=document.querySelector('#ticket-form');
  if(!form)return null;
  const values=new FormData(form);
  return {dbvs:values.get('dbvs')||'',reasons:[values.get('reason1')||'',values.get('reason2')||'',values.get('reason3')||''],alternative:values.get('alternative')||'',comparison:values.get('comparison')||'',risk:values.get('risk')||'',integrity:values.get('integrity')||'',twist_response:values.get('twist_response')||'',summary:values.get('summary')||''};
}
const val=(obj,k)=>h(obj?.[k]||'');

const changeLevelLabels={easy:'Viegls',medium:'Vidējs',hard:'Sarežģīts'};
const changeStatusLabels={draft:'Gaida izpildi',submitted:'Iesniegts'};
const changeTimers=new Map();
const changeWriteQueue=new Map();

function renderClientChange(item,index){
  const saved=item.status==='submitted';
  return `<article class="change-card" data-change-card="${item.id}">
    <div class="rowBetween change-heading"><div class="kicker"><span class="pill ${item.difficulty==='hard'?'red':item.difficulty==='medium'?'orange':'green'}">${h(changeLevelLabels[item.difficulty]||item.difficulty)}</span><strong>Izmaiņa #${index+1}</strong></div><span class="sub">${date(item.created_at)}</span></div>
    <h3>${h(item.title)}</h3><p class="change-description">${h(item.description)}</p>
    ${saved?`<div class="notice">✓ Izmaiņa iesniegta ${date(item.submitted_at)}. Iepriekšējais darbs un dati ir saglabāti.</div><div class="answer-block"><b>Tava atbilde</b><p>${h(item.response)}</p></div>`:
    `<form class="change-form" data-change-id="${item.id}"><div class="field"><label>Ko izmainīji savā datubāzē? SQL piemēri, SQL Lab saite, testi un secinājumi</label><textarea name="response" maxlength="6000" rows="5" placeholder="Apraksti veiktās izmaiņas. Vecās tabulas un datus nedzēs...">${h(item.response)}</textarea></div><div class="rowBetween" style="flex-wrap:wrap"><span class="sub change-save-status">${item.response?'✓ Melnraksts saglabāts':'Melnraksts'}</span><div class="admin-actions"><button type="button" class="btn btn-secondary btn-sm" data-action="save-client-change">💾 Saglabāt</button><button type="submit" class="btn btn-primary btn-sm">📨 Iesniegt labojumu</button></div></div></form>`}
  </article>`;
}
function changeTimeline(t) {
  const changes=t.changes||[];
  return `<section class="panel change-timeline" id="change-timeline"><div class="rowBetween"><div><span class="pill blue">🔁 Projekta turpinājums</span><div class="space8"></div><h3>Klienta izmaiņu vēsture</h3></div><span class="pill border">${changes.length} kārtas</span></div>
  <p class="sub" style="margin:10px 0 16px">Jauna prasība nemaina tavu sākotnējo konsultāciju. Turpini pilnveidot jau izveidoto SQL Lab datubāzi — neveido visu no nulles.</p>
  ${changes.length?changes.map(renderClientChange).join(''):'<div class="notice">Pagaidām nav jaunu izmaiņu. Klients var tās iesniegt arī pēc konsultācijas novērtēšanas.</div>'}
  <div class="space16"></div><button class="btn btn-outline btn-sm" data-action="check-client-changes">↻ Pārbaudīt jaunas prasības</button></section>`;
}
function adminChangePanel(t){
  const list=t.changes||[];
  const history=list.map((c,i)=>`<div class="admin-change"><div class="rowBetween"><div><span class="pill ${c.difficulty==='hard'?'red':c.difficulty==='medium'?'orange':'green'}">${h(changeLevelLabels[c.difficulty])}</span> <b>#${i+1} ${h(c.title)}</b></div><span class="pill ${c.status==='submitted'?'green':'border'}">${h(changeStatusLabels[c.status])}</span></div><p class="sub" style="margin-top:8px;white-space:pre-wrap">${h(c.description)}</p>${c.response?`<div class="answer-block"><b>Jaunieša atbilde</b><p>${h(c.response)}</p></div>`:''}</div>`).join('');
  return `<div class="divider"></div><h3>🔁 Klienta labojumi (${list.length})</h3><p class="sub">Jaunās prasības tiek pievienotas vēsturei. Vecās atbildes, vērtējums un projekts netiek dzēsti.</p>
    <div class="space16"></div>${history||'<p class="muted small">Vēl nav pievienotu izmaiņu.</p>'}
    <div class="divider"></div><form id="issue-change-form">
      <h3>➕ Pievienot nākamo izmaiņu kārtu</h3>
      <div class="space16"></div><div class="field"><label>Grūtības līmenis</label>
        <select name="difficulty" required><option value="easy">🟢 Viegls — lauki un ierobežojumi</option><option value="medium">🟠 Vidējs — tabulas un relācijas</option><option value="hard">🔴 Sarežģīts — struktūras maiņa un migrācija</option></select>
      </div><button type="button" class="btn btn-secondary btn-sm" data-action="suggest-change">✨ Ieteikt šī klienta situācijai</button>
      <div class="space16"></div><div class="field"><label>Prasības virsraksts</label><input name="title" maxlength="160" placeholder="Atstāj tukšu automātiskam ieteikumam" /></div>
      <div class="field"><label>Klienta jaunās prasības</label><textarea name="description" maxlength="4000" rows="5" placeholder="Atstāj tukšu automātiskai, individuālai prasībai"></textarea></div>
      <label class="checkbox-group"><input type="checkbox" name="all" /> Pievienot VISIEM esošajiem ticketiem (katram atbilstoši viņa klientam)</label>
      <p class="sub">Ja atstāsi virsrakstu un aprakstu tukšu, katram skolēnam ģenerēsies viņa scenārijam piemērots uzdevums.</p>
      <div id="issue-change-error"></div><button type="submit" class="btn btn-primary btn-block">⚡ Izsniegt jauno prasību</button>
    </form>`;
}

function showTicket(){
  const t=state.ticket;
  if(!t){renderLoading();return;}
  const c=t.case,a=t.answers||{},readonly=t.status!=='draft';
  const requirements=(c?.requirements||[]).map(x=>`<div class="req"><span class="dot"></span><span>${h(x)}</span></div>`).join('');
  const radioNames=names.map(x=>`<label class="radio-card"><input type="radio" name="dbvs" value="${h(x)}" ${a.dbvs===x?'checked':''} ${readonly?'disabled':''}/> ${h(x)}</label>`).join('');
  const alternativeOptions=`<option value="">Izvēlies alternatīvu</option>`+names.map(x=>`<option value="${h(x)}" ${a.alternative===x?'selected':''}>${h(x)}</option>`).join('');
  const textArea=(name,label,placeholder,rows=3,value='',hintText='')=>`<div class="field"><label for="${name}">${label}</label><textarea id="${name}" name="${name}" rows="${rows}" maxlength="${name==='twist_response'?1200:1000}" placeholder="${h(placeholder)}" ${readonly?'disabled':''}>${h(value)}</textarea>${hintText?`<span class="fieldHelp">${hintText}</span>`:''}</div>`;
  const subHeader=`<div class="pageHeader"><div><div class="breadcrumb">Mans uzdevums / ${h(t.code)}</div><h1>Klienta tickets <span class="brandAccent">${h(t.code)}</span></h1><p class="muted">Konsultants: <b>${h(t.name)}</b>${t.group?' · '+h(t.group):''}</p></div><div>${statusPill(t.status)}</div></div>`;
  const twistPart=state.twist?`<section class="formSection"><div class="formTitle"><span class="formNumber">!</span><h3>Klienta prasības pēkšņi mainījās!</h3></div><div class="reveal"><span class="pill orange">🚨 Jauna prasība</span><h3>${h(c.twist)}</h3><p class="muted small">Vai sākotnējā izvēle joprojām der? Vari piedāvāt arī arhitektūras maiņu.</p><div class="space16"></div>${textArea('twist_response','Kā tu rīkotos un kāpēc?','Izskaidro, ko mainītu risinājumā...',3,a.twist_response)}</div></section>`:'';
  const body=readonly?`<div class="submitted"><div class="successIcon">✓</div><div class="space16"></div><h2>${t.status==='reviewed'?'Skolotājs darbu ir novērtējis!':'Darbs ir iesniegts!'}</h2><p class="muted">${t.status==='reviewed'?`Tavs vērtējums: <strong>${h(t.grade)}/10</strong>`:'Tavs risinājums ir nodots skolotājam. Pēc vērtēšanas vari šeit atgriezties.'}</p>${t.feedback?`<div class="space16"></div><div class="notice"><b>Skolotāja komentārs:</b><br/>${h(t.feedback)}</div>`:''}<div class="space24"></div><div class="rowBetween" style="justify-content:center;flex-wrap:wrap"><button class="btn btn-secondary" data-action="copy-link">🔗 Kopēt sava ticketa saiti</button><button class="btn btn-outline" data-action="check-grade">↻ Pārbaudīt vērtējumu</button></div></div><div class="space24"></div><div class="panel"><h3>Tavas iesniegtās atbildes</h3>${answerBlocks(t)}</div>`:
  `<div class="panel"><div class="rowBetween"><div><b>Risinājuma veidlapa</b><p class="sub">Atbildes vari saglabāt arī nepabeigtas.</p></div><span class="pill green" id="save-status">Melnraksts</span></div><div class="progressBar"><span id="form-progress" style="width:0%"></span></div><div class="space16"></div><form id="ticket-form" novalidate>
   <section class="formSection"><div class="formTitle"><span class="formNumber">01</span><h3>Izvēlies DBVS</h3></div><p class="hint">Padomā par konkrētā klienta vajadzībām, nevis par populārāko tehnoloģiju.</p><div class="radio-cards">${radioNames}</div></section>
   <section class="formSection"><div class="formTitle"><span class="formNumber">02</span><h3>Trīs tehniskie argumenti</h3></div><p class="hint">Min konkrētas projekta prasības un izskaidro, kā izvēlētā DBVS tās nodrošinātu.</p>
   ${textArea('reason1','Arguments Nr. 1','Kāda prasība nosaka šo izvēli?',2,a.reasons?.[0])}${textArea('reason2','Arguments Nr. 2','Kā DBVS palīdz datu apstrādē?',2,a.reasons?.[1])}${textArea('reason3','Arguments Nr. 3','Kādas priekšrocības ir tieši šai arhitektūrai?',2,a.reasons?.[2])}</section>
   <section class="formSection"><div class="formTitle"><span class="formNumber">03</span><h3>Salīdzini alternatīvu</h3></div><div class="field"><label for="alternative">Kuru otro DBVS apsvēri?</label><select id="alternative" name="alternative" ${readonly?'disabled':''}>${alternativeOptions}</select></div>${textArea('comparison','Kāpēc izvēlējies pirmo, nevis šo alternatīvu?','Salīdzini konkrētas tehniskās īpašības un prasības...',3,a.comparison)}</section>
   <section class="formSection"><div class="formTitle"><span class="formNumber">04</span><h3>Riski un datu drošums</h3></div>${textArea('risk','Viens vai vairāki iespējamie riski','Kas varētu būt ierobežojums pie lielākas slodzes vai citiem nosacījumiem?',3,a.risk)}${textArea('integrity','Kā nodrošināsi datu integritāti un atjaunošanu?','Piemini, piemēram, ierobežojumus, transakcijas un rezerves kopijas...',3,a.integrity)}</section>
   ${twistPart}
   <section class="formSection"><div class="formTitle"><span class="formNumber">✓</span><h3>Gala secinājums</h3></div>${textArea('summary','Rekomendācija klientam','Vienā rindkopā paskaidro, ko iesaki un kāpēc.',3,a.summary)}</section>
   <div id="ticket-error"></div><div class="stickyActions"><button type="button" class="btn btn-secondary" data-action="save">💾 Saglabāt melnrakstu</button><button type="submit" class="btn btn-primary">📨 Iesniegt konsultāciju →</button></div><p class="sub" style="margin-top:12px">Pēc iesniegšanas labošana vairs nebūs pieejama. Lai saņemtu komentāru, saglabā ticketa saiti.</p></form></div>`;
  root.innerHTML=shell(`<main class="page"><a href="#/" class="backLink">← Uz sākumu</a>${subHeader}<div class="ticket-layout"><aside class="ticket-card"><div class="top"><div class="rowBetween"><span class="pill dark">📩 Jauns klients</span><span class="ticket-code">${h(t.code)}</span></div><h2>${h(c?.title)}</h2><p>${h(c?.company)} · ${h(c?.sector)}</p></div><div class="body"><div class="ticketmeta"><span class="pill border">💸 ${h(c?.budget)}</span><span class="pill border">❗ ${h(c?.severity)} prioritāte</span></div><h3>Situācijas apraksts</h3><p class="muted" style="margin-top:8px">${h(c?.intro)}</p><div class="space24"></div><h3>Klienta prasības</h3>${requirements}<div class="ticket-aside-note">💡 Ne vienmēr ir viena absolūti pareizā DBVS. Svarīgi ir argumenti un izvēles atbilstība prasībām.</div><div class="space16"></div><button class="btn btn-outline btn-block btn-sm" data-action="copy-link">🔗 Kopēt privāto atgriešanās saiti</button>${!state.twist&&!readonly?'<div class="space16"></div><button class="btn btn-secondary btn-block btn-sm" data-action="check-twist">🔔 Pārbaudīt jaunas prasības</button>':''}</div></aside><div>${body}<div class="space24"></div>${changeTimeline(t)}</div></div></main>`);
  updateProgress();
}
function answerBlocks(t){const a=t.answers||{};const pairs=[['Izvēlētā DBVS',a.dbvs],['1. arguments',a.reasons?.[0]],['2. arguments',a.reasons?.[1]],['3. arguments',a.reasons?.[2]],['Alternatīva',a.alternative],['Salīdzinājums',a.comparison],['Riski',a.risk],['Integritāte un atjaunošana',a.integrity],['Jaunā klienta prasība',a.twist_response],['Secinājums',a.summary]];return pairs.filter(([k,v])=>Boolean(v)).map(([k,v])=>`<div class="answer-block"><b>${h(k)}</b><p>${h(v)}</p></div>`).join('');}
function updateProgress() {const a=collectAnswers();if(!a)return;const parts=[a.dbvs,...a.reasons,a.alternative,a.comparison,a.risk,a.integrity,a.summary,...state.twist?[a.twist_response]:[]];const n=parts.filter(x=>String(x).trim()).length;const el=document.querySelector('#form-progress');if(el)el.style.width=Math.round(n/parts.length*100)+'%';}
function showAdminLogin(){
  root.innerHTML=shell(`<main class="page"><a href="#/" class="backLink">← Uz sākumu</a><div class="panel narrow"><div class="center"><span class="keyIcon">🔐</span><div class="space16"></div><span class="pill blue">Skolotāja vide</span><div class="space16"></div><h2>Vadības panelis</h2><p class="muted" style="margin-top:9px">Visi konsultanti, ticketi, iesniegumi un vērtējumi vienuviet.</p></div><div class="space32"></div><form id="login-form"><div class="field"><label>Lietotājvārds</label><input name="username" autocomplete="username" required placeholder="Skolotāja lietotājvārds"/></div><div class="field"><label>Parole</label><input type="password" name="password" autocomplete="current-password" required placeholder="Tava parole"/></div><div id="login-error"></div><button class="btn btn-dark btn-block" type="submit">Ieiet admin panelī →</button></form></div></main>`);
}
function getFilteredTickets(){return state.tickets.filter(t=>(state.filter==='all'||t.status===state.filter)&&[t.name,t.group,t.code,t.case?.title].join(' ').toLowerCase().includes(state.search.toLowerCase()));}
function renderAdmin(){
  if(!state.admin){showAdminLogin();return;}
  const all=state.tickets,submitted=all.filter(t=>['submitted','reviewed'].includes(t.status)),reviewed=all.filter(t=>t.status==='reviewed');
  const picked=all.find(t=>t.code===state.selected);
  const rows=getFilteredTickets().map(t=>`<tr data-open-ticket="${h(t.code)}" class="${state.selected===t.code?'selected':''}"><td><strong>${h(t.name)}</strong><span class="sub">${h(t.group||'Grupa nav norādīta')}</span></td><td class="mono">${h(t.code)}</td><td>${h(t.case?.title)}</td><td>${statusPill(t.status)}</td><td>${t.grade===null?'—':h(t.grade)+'/10'}</td><td class="sub">${date(t.created_at)}</td></tr>`).join('');
  const details=picked?`<div class="panel details"><div class="rowBetween"><span class="pill blue">${h(picked.code)}</span>${statusPill(picked.status)}</div><div class="space16"></div><h3>${h(picked.name)}</h3><p class="sub">${h(picked.group||'Grupa nav norādīta')} · ${date(picked.created_at)}</p><div class="space16"></div><p><b>Klienta situācija:</b> ${h(picked.case?.title)}</p><div class="divider"></div><h3>Atbildes</h3>${answerBlocks(picked)||'<p class="muted">Konsultants vēl nav sācis aizpildīt atbildes.</p>'}<div class="divider"></div>${['submitted','reviewed'].includes(picked.status)?`<form id="review-form"><h3>Skolotāja vērtējums</h3><div class="space16"></div><div class="field"><label>Formatīvais vērtējums (0–10)</label><select name="grade" required><option value="">Izvēlies...</option>${Array.from({length:11},(_,i)=>`<option value="${i}" ${picked.grade===i?'selected':''}>${i} punkti</option>`).join('')}</select></div><div class="field"><label>Atgriezeniskā saite</label><textarea name="feedback" placeholder="Ko izdevās pamatot? Kas jāprecizē?" maxlength="2000">${h(picked.feedback)}</textarea></div><div id="review-error"></div><button class="btn btn-primary btn-block" type="submit">✓ Saglabāt vērtējumu</button></form>`:'<div class="notice warning">⏳ Šis ir melnraksts. Vērtēt var pēc iesniegšanas.</div>'}</div>`:`<div class="panel details"><div class="empty"><div class="emoji">👈</div><h3>Atver kādu ticketu</h3><p>Uzklikšķini uz jaunieša rindas, lai aplūkotu visu viņa iesniegumu un ieliktu vērtējumu.</p></div></div>`;
  const detailsWithChanges=picked?details.slice(0,-6)+adminChangePanel(picked)+'</div>':details;
  root.innerHTML=shell(`<main class="page"><div class="pageHeader"><div><span class="pill green">● Skolotāja darba vieta</span><h1>Labdien, skolotāj! 👋</h1><p class="muted">Visi IT konsultanti un viņu klientu uzdevumi.</p></div><div class="admin-actions"><button class="btn btn-outline btn-sm" data-action="refresh">↻ Atsvaidzināt</button><button class="btn btn-secondary btn-sm" data-action="export">↓ CSV eksports</button><button class="btn btn-dark btn-sm" data-action="logout">Iziet</button></div></div><section class="stat-grid"><div class="stat-card"><span class="sub">Izveidoti ticketi</span><strong>${all.length}</strong><span class="small muted">Kopā</span></div><div class="stat-card"><span class="sub">Procesā</span><strong>${all.filter(t=>t.status==='draft').length}</strong><span class="small muted">Melnraksti</span></div><div class="stat-card"><span class="sub">Iesniegumi</span><strong>${submitted.length}</strong><span class="small muted">Iesniegti vai novērtēti</span></div><div class="stat-card"><span class="sub">Novērtēti</span><strong>${reviewed.length}</strong><span class="small muted">Vidējais ${reviewed.length?(reviewed.reduce((s,t)=>s+Number(t.grade||0),0)/reviewed.length).toFixed(1):'—'} / 10</span></div></section><div class="space24"></div><section class="panel"><div class="rowBetween"><div><h3>🚨 Klienta pārsteigums</h3><p class="sub">Aktivizē jaunu prasību visiem konsultantiem, kuri vēl aizpilda ticketu.</p></div><button data-action="toggle-twist" class="btn ${state.twist?'btn-secondary':'btn-primary'} btn-sm">${state.twist?'Izslēgt pārsteigumu':'⚡ Aktivizēt jaunu prasību'}</button></div><div class="space8"></div><span class="pill ${state.twist?'orange':'border'}">${state.twist?'● Aktīvs':'○ Nav aktivizēts'}</span></section><div class="space24"></div><div class="admin-grid"><section class="panel"><div class="sectionHead"><div><h3>Jauniešu ticketi</h3><p class="sub">Izvēlies rindu, lai redzētu atbildes un vērtējumu.</p></div><span class="pill border">${getFilteredTickets().length} ieraksti</span></div><div class="toolbar"><input id="ticket-search" placeholder="🔎 Meklēt vārdu, grupu, ticketu..." value="${h(state.search)}"/><select id="ticket-filter"><option value="all" ${state.filter==='all'?'selected':''}>Visi statusi</option><option value="draft" ${state.filter==='draft'?'selected':''}>Procesā</option><option value="submitted" ${state.filter==='submitted'?'selected':''}>Iesniegti</option><option value="reviewed" ${state.filter==='reviewed'?'selected':''}>Novērtēti</option></select></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Konsultants</th><th>Tickets</th><th>Klients</th><th>Statuss</th><th>Vērt.</th><th>Izveidots</th></tr></thead><tbody>${rows||'<tr><td colspan="6" class="center muted" style="padding:28px">Nav atrastu ticketu.</td></tr>'}</tbody></table></div></section>${detailsWithChanges}</div></main>`);
}
async function fetchTicket(code,token){
  state.ticket=null;state.token=token;renderLoading();
  try{const data=await api('ticket',{code,token});state.ticket=data.ticket;state.twist=data.twist;showTicket();}
  catch(e){root.innerHTML=shell(`<main class="page"><div class="panel narrow"><h2>Ticketu neizdevās atrast</h2><p class="muted">${h(errText(e))}</p><div class="space24"></div><a href="#/start" class="btn btn-primary">Saņemt jaunu ticketu</a></div></main>`);}
}
async function loadAdmin(){renderLoading('Ielādējam skolotāja paneli...');try{const me=await api('me');state.admin=me.admin;if(me.admin){await refreshAdmin();}else showAdminLogin();}catch(e){state.admin=false;showAdminLogin();toast(errText(e));}}
async function refreshAdmin(silent=false){
  try{const data=await api('admin-list');state.tickets=data.tickets;state.twist=data.twist;if(state.selected&&!state.tickets.some(t=>t.code===state.selected))state.selected='';renderAdmin();}
  catch(e){if(!silent)toast(errText(e));if(/autorizācija/.test(errText(e))){state.admin=false;showAdminLogin();}}
}
function route(){clearTimeout(saveTimer);const hash=decodeURIComponent(location.hash||'#/');if(hash.startsWith('#/ticket/')){const parts=hash.slice(9).split('/');if(parts.length>=2){fetchTicket(parts[0],parts[1]);return;}}if(hash==='#/start'){showStart();return;}if(hash==='#/admin'){loadAdmin();return;}showHome();}
window.addEventListener('hashchange',route);
let lastPersisted='';
async function saveDraft(quiet=false){
  if(!state.ticket||state.ticket.status!=='draft'||state.saving)return;
  const answers=collectAnswers();if(!answers)return;
  const serialized=JSON.stringify(answers);if(quiet&&serialized===lastPersisted)return;
  state.saving=true;const label=document.getElementById('save-status');if(label)label.textContent='Saglabā...';
  try {const data=await api('save',{code:state.ticket.code,token:state.token,answers,submit:false});state.ticket.answers=data.ticket.answers;lastPersisted=serialized;if(label)label.textContent='✓ Saglabāts';if(!quiet)toast('Melnraksts saglabāts!');}
  catch(e){if(label)label.textContent='⚠ Nav saglabāts';if(!quiet)toast(errText(e));}
  finally{state.saving=false;}
}
async function submitFinal(){
  const answers=collectAnswers();if(!answers)return;clearTimeout(saveTimer);
  if(!confirm('Vai iesniegt klienta konsultāciju skolotājam? Pēc iesniegšanas atbildi labot vairs nevarēs.'))return;
  try{const data=await api('save',{code:state.ticket.code,token:state.token,answers,submit:true});state.ticket=data.ticket;state.twist=data.twist;showTicket();toast('Konsultācija veiksmīgi iesniegta! 🎉');window.scrollTo(0,0);}
  catch(e){const box=document.getElementById('ticket-error');if(box)box.innerHTML=`<div class="inputError">${h(errText(e))}</div>`;toast('Pārbaudi aizpildītos laukus.');}
}
root.addEventListener('submit',async event=>{
  event.preventDefault();const form=event.target;
  if(form.id==='start-form'){
    const values=new FormData(form),btn=document.getElementById('create-btn');btn.disabled=true;btn.textContent='Ģenerē ticketu...';
    try{const data=await api('create',{name:values.get('name'),group:values.get('group'),pin:values.get('pin')});state.ticket=data.ticket;state.token=data.token;state.twist=data.twist;lastPersisted='';location.hash=`#/ticket/${data.ticket.code}/${data.token}`;toast('Tev piešķirts jauns klients!');}
    catch(e){document.getElementById('start-error').innerHTML=`<div class="inputError">${h(errText(e))}</div>`;}
    finally{btn.disabled=false;btn.textContent='Ģenerēt klienta ticketu →';}
  }else if(form.id==='login-form'){
    const b=new FormData(form),btn=form.querySelector('button[type=submit]');btn.disabled=true;
    try{await api('login',{username:b.get('username'),password:b.get('password')});state.admin=true;await refreshAdmin();toast('Sveicināts, skolotāj!');}
    catch(e){const box=document.getElementById('login-error');if(box)box.innerHTML=`<div class="inputError">${h(errText(e))}</div>`;}
    finally{btn.disabled=false;}
  }else if(form.id==='ticket-form'){await submitFinal();}
  else if(form.id==='review-form'){
    const b=new FormData(form);try{await api('review',{code:state.selected,grade:Number(b.get('grade')),feedback:b.get('feedback')});await refreshAdmin();toast('Vērtējums saglabāts!');}
    catch(e){document.getElementById('review-error').innerHTML=`<div class="inputError">${h(errText(e))}</div>`;}
  }
});
root.addEventListener('input',event=>{
  if(event.target.closest('#ticket-form')){updateProgress();const label=document.getElementById('save-status');if(label)label.textContent='● Nav saglabāts';clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveDraft(true),1800);}
  if(event.target.id==='ticket-search'){state.search=event.target.value;const el=document.querySelector('.data-table tbody');if(el){const rows=getFilteredTickets().map(t=>`<tr data-open-ticket="${h(t.code)}" class="${state.selected===t.code?'selected':''}"><td><strong>${h(t.name)}</strong><span class="sub">${h(t.group||'Grupa nav norādīta')}</span></td><td class="mono">${h(t.code)}</td><td>${h(t.case?.title)}</td><td>${statusPill(t.status)}</td><td>${t.grade===null?'—':h(t.grade)+'/10'}</td><td class="sub">${date(t.created_at)}</td></tr>`).join('');el.innerHTML=rows||'<tr><td colspan="6" class="center muted">Nav atrastu ierakstu</td></tr>';}}
});
root.addEventListener('change',event=>{if(event.target.id==='ticket-filter'){state.filter=event.target.value;renderAdmin();}if(event.target.closest('#ticket-form')){updateProgress();clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveDraft(true),1800);}});
root.addEventListener('click',async event=>{
  const tr=event.target.closest('[data-open-ticket]');if(tr){state.selected=tr.dataset.openTicket;renderAdmin();return;}
  const node=event.target.closest('[data-action]');if(!node)return;
  const action=node.dataset.action;
  if(action==='check-grade'){
    try{const data=await api('ticket',{code:state.ticket.code,token:state.token});state.ticket=data.ticket;state.twist=data.twist;showTicket();toast(data.ticket.status==='reviewed'?'Skolotājs ir novērtējis tavu darbu!':'Vērtējums vēl nav piešķirts.');}catch(e){toast(errText(e));}
  }else if(action==='copy-link'){
    try{await navigator.clipboard.writeText(fullLink());toast('Privātā saite nokopēta!');}
    catch {prompt('Nokopē savu atgriešanās saiti:',fullLink());}
  }else if(action==='save')await saveDraft();
  else if(action==='check-twist'){
    try{const a=collectAnswers();const data=await api('status');if(data.twist&&!state.twist){state.ticket.answers=a;state.twist=true;showTicket();toast('Klients nosūtījis jaunu prasību! ⚡');}else toast(data.twist?'Jaunā prasība jau ir atvērta.':'Jaunu klienta prasību vēl nav.');}
    catch(e){toast(errText(e));}
  }else if(action==='refresh')await refreshAdmin();
  else if(action==='export'){window.location.href='/api/index?op=export';}
  else if(action==='logout'){await api('logout',{});state.admin=false;showAdminLogin();toast('Izrakstījies no paneļa.');}
  else if(action==='toggle-twist'){
    try{await api('twist',{enabled:!state.twist});await refreshAdmin();toast(state.twist?'Jaunā prasība aktivizēta!':'Jaunā prasība izslēgta.');}
    catch(e){toast(errText(e));}
  }
});
// Skolēniem pārbaudām "klienta pārsteigumu" bez formas pārtraukšanas.
refreshTimer=setInterval(async()=>{
  if(state.ticket?.status==='draft' && location.hash.startsWith('#/ticket/') && !state.twist){
    try{const data=await api('status');if(data.twist){const draft=collectAnswers();if(draft)state.ticket.answers=draft;state.twist=true;clearTimeout(saveTimer);showTicket();toast('⚡ Klients tikko mainīja prasības!');}}catch{}
  }
  if(state.admin && location.hash==='#/admin' && !document.activeElement?.closest('form')){
    try{const data=await api('admin-list');const changed=JSON.stringify(data.tickets.map(x=>[x.code,x.status,x.updated_at]))!==JSON.stringify(state.tickets.map(x=>[x.code,x.status,x.updated_at]));if(changed){state.tickets=data.tickets;state.twist=data.twist;renderAdmin();}}catch{}
  }
},14000);
route();
