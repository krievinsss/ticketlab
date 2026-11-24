import test from 'node:test';
import assert from 'node:assert/strict';
import { internal } from '../src/core.js';

const example={dbvs:'PostgreSQL',reasons:['Relāciju integritātei svarīgi foreign key.','Vairāki darbinieki vienlaikus apstrādā datus.','Atbalstīti vaicājumi un attīstības iespējas.'],alternative:'MySQL',comparison:'MySQL arī der, bet izvēli pamatojam ar konkrētām DB prasībām.',risk:'Servera uzturēšanai vajadzīgas zināšanas un rezerves kopijas.',integrity:'Jāizmanto transakcijas, ārējās atslēgas un datubāzes rezerves kopijas.',summary:'Klientam ieteiktu PostgreSQL, jo nepieciešama centralizēta relāciju datubāze.',twist_response:'Lielākai slodzei vajadzētu pārskatīt infrastruktūru.'};
test('pieņem pamatoti aizpildītu konsultāciju',()=>{
  const got=internal.validateAnswers(example,true,true);
  assert.equal(got.dbvs,'PostgreSQL');assert.equal(got.reasons.length,3);
});
test('noraida identisku DBVS un alternatīvu',()=>{
  assert.throws(()=>internal.validateAnswers({...example,alternative:'PostgreSQL'},true,false),/alternatīvas salīdzinājums/);
});
test('noraida nepabeigtu pārsteiguma atbildi',()=>{
  assert.throws(()=>internal.validateAnswers({...example,twist_response:''},true,true),/jauno prasību/);
});
test('atļauj nepilnīgu melnrakstu',()=>{
  assert.equal(internal.validateAnswers({dbvs:'SQLite'},false,false).reasons.length,3);
});
test('nepieļauj nezināmu DBVS',()=>{
  assert.throws(()=>internal.validateAnswers({dbvs:'Unknown'},false,false),/atļautu DBVS/);
});
test('CSV ievades pirmās zīmes ir pasargātas no formulas injekcijas',()=>{
  const csv=internal.csvExport([{code:'TL-1',consultant_name:'=1+1',class_group:'IPa',case_id:'offline-notes',status:'submitted',answers:{dbvs:'SQLite'},grade:9,feedback:'+SUM(1,1)',submitted_at:''}]);
  assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"\'+SUM(1,1)"'));
});
test('Hash salīdzināšanas funkcija pārbauda atšķirīgas vērtības',()=>{
  assert.ok(internal.safeEqual(internal.sha('abc'),internal.sha('abc')));
  assert.ok(!internal.safeEqual(internal.sha('abc'),internal.sha('xyz')));
});
