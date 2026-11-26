import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {cases} from '../src/cases.js';
import {suggestChange,changeLevels} from '../src/change-templates.js';

test('visiem klientiem ir trīs grūtības līmeņu scenāriji',()=>{
  for(const scenario of cases){
    for(const difficulty of Object.keys(changeLevels)){
      const result=suggestChange(scenario.id,difficulty);
      assert.ok(result.title.length>=5,scenario.id);
      assert.ok(result.description.length>=60,scenario.id);
      assert.equal(result.difficulty,difficulty);
    }
  }
  assert.match(suggestChange('webshop','hard',2).title,/2\. kārta/);
  assert.throws(()=>suggestChange('webshop','invalid'),/Neatļauts/);
});

test('esošais tickets, sākotnējās atbildes un vērtējums paliek saglabāti pēc vairākiem labojumiem',async()=>{
  const originalCwd=process.cwd();
  const dir=await mkdtemp(path.join(os.tmpdir(),'ticketlab-changes-'));
  const oldDb=process.env.DATABASE_URL;
  const oldVercel=process.env.VERCEL;
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.chdir(dir);
  try{
    // Dinamiska importēšana pēc cwd maiņas izolē lokālo JSON datubāzi.
    const store=await import('../src/store.js?change-test='+Date.now());
    const code='TL-SAFE-01';
    await store.createTicket({code,tokenHash:'a'.repeat(64),name:'Testa jaunietis',group:'IPa',caseId:'webshop'});
    const answers={dbvs:'MySQL',summary:'Sākotnējā konsultācija paliek spēkā'};
    await store.saveStudentTicket(code,answers,true);
    await store.reviewTicket(code,9,'Labs sākotnējais darbs');
    const before=await store.getTicket(code);
    const one=suggestChange('webshop','easy');
    const two=suggestChange('webshop','medium',2);
    const three=suggestChange('webshop','hard',3);
    const rounds=await store.issueChanges([
      {ticket_code:code,...one},
      {ticket_code:code,...two},
      {ticket_code:code,...three}
    ]);
    assert.equal(rounds.length,3);
    assert.equal((await store.getChanges(code)).length,3);
    assert.deepEqual((await store.getChanges(code)).map(x=>x.difficulty),['easy','medium','hard']);
    await store.saveChangeResponse(code,rounds[0].id,'Pievienots jauns produkta statusa lauks un tests.',true);
    await store.saveChangeResponse(code,rounds[1].id,'Izveidota noliktavu kustību vēstures tabula.',false);
    assert.equal((await store.getChanges(code))[0].status,'submitted');
    assert.equal((await store.getChanges(code))[1].status,'draft');
    assert.equal(await store.saveChangeResponse(code,rounds[0].id,'Neatļauta pārrakstīšana',false),null);
    const after=await store.getTicket(code);
    assert.deepEqual(after.answers,before.answers);
    assert.equal(after.grade,9);
    assert.equal(after.feedback,'Labs sākotnējais darbs');
    assert.equal(after.status,'reviewed');
    assert.equal(after.case_id,'webshop');
    assert.equal(after.token_hash,before.token_hash);
    const raw=JSON.parse(await readFile(path.join(dir,'data','dev-db.json'),'utf8'));
    assert.equal(raw.tickets.length,1);
    assert.equal(raw.changes.length,3);
  }finally{
    process.chdir(originalCwd);
    if(oldDb===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=oldDb;
    if(oldVercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=oldVercel;
    await rm(dir,{recursive:true,force:true});
  }
});
