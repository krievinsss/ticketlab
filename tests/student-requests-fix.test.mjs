import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('vecā klienta prasību poga izsauc jauno labojumu pārbaudi, un jaunās prasības redzamas augšā',()=>{
  const callbacks={};
  const oldButton={dataset:{action:'check-twist'},textContent:'Pārbaudīt jaunas prasības'};
  const previousFirst={};
  const parent={firstElementChild:previousFirst,prepend(el){this.firstElementChild=el;}};
  const section={parentElement:parent,querySelectorAll(){return [{}];}};
  const root={querySelector(selector){return selector==='[data-action="check-twist"]'?oldButton:null;}};
  const document={
    addEventListener(type,cb,capture){assert.equal(capture,true);callbacks[type]=cb;},
    getElementById(id){return id==='root'?root:id==='change-timeline'?section:null;}
  };
  let observerStarted=false;
  class MutationObserver {
    constructor(fn){this.fn=fn;}
    observe(target,opts){assert.equal(target,root);assert.equal(opts.subtree,true);observerStarted=true;}
  }
  const source=readFileSync(new URL('../public/student-requests-fix.js',import.meta.url),'utf8');
  vm.runInNewContext(source,{document,MutationObserver,queueMicrotask});
  assert.ok(observerStarted);
  assert.equal(parent.firstElementChild,section);
  assert.equal(oldButton.dataset.action,'check-client-changes');
  const button2={dataset:{action:'check-twist'}};
  callbacks.click({target:{closest:()=>button2}});
  assert.equal(button2.dataset.action,'check-client-changes');
});
