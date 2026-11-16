/* Offline guidance follows the active interaction; game rules remain in model.js. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.MindLockKeeper=api;})(globalThis,()=>{
'use strict';
const hints={
 books:['Each book bears a letter. Try arranging the seven letters into a word.','Think of a word that describes something hidden or difficult to understand.','The word begins with O and has seven letters.','The word is OBSCURE. Arrange the books in that order.'],
 journal:['Begin with the symbol-to-letter matches already written in the journal.','Each line of symbols represents a separate word. The words contain three, five, and four letters.','The first word begins with T and ends with E.','The first word is THE. Use those letters to help decode the remaining symbols.'],
 rings:['Rotate the symbol ring and letter ring to match one of the known pairs.','Check whether the other known symbol-letter pairs agree with that alignment.','Use the confirmed alignment to identify the letters represented by the remaining symbols.'],
 desk:['Examine the key you discovered.','Look for a matching lock on the writing desk.'],
 gears:['Compare the three gear sizes with the empty spaces in the mechanism.','Try different placements and observe which gears fit.','All three gears must be installed correctly before the clock can operate.'],
 clock:['The decoded message refers to a specific hour.','Think about how the ninth hour would appear on a clock.','Set the repaired clock to 9:00.'],
 garden:['A compartment has opened beneath the clock. Examine it.','Collect the key inside and look for the garden passage.','Use the garden key on the passage to leave the study.'],
 secret:['Examine the open drawer beneath the bookshelf.','Collect the journal and the tagged key separately.']
};
const ids=Object.keys(hints),cooldown=60000;
const record=now=>({attempts:0,repeats:0,lastProgressAt:now,lastInteractionAt:0,hints:[],level:0,family:'',offeredAt:0,dismissedAt:0,handledAt:0,handledAttempts:0,handledRepeats:0,completed:false,best:0});
const fresh=(now=Date.now())=>({version:2,puzzles:Object.fromEntries(ids.map(id=>[id,record(now)])),active:null,reflection:null});
function restore(saved,now=Date.now()){
 const data=fresh(now);if(![1,2].includes(saved?.version))return data;
 for(const id of ids){const r=saved.puzzles?.[id];if(!r)continue;const p=data.puzzles[id];for(const key of ['attempts','repeats','lastProgressAt','lastInteractionAt','offeredAt','dismissedAt','handledAt','handledAttempts','handledRepeats','best'])if(Number.isFinite(r[key])&&r[key]>=0)p[key]=r[key];p.completed=r.completed===true;p.hints=Array.isArray(r.hints)?r.hints.filter(h=>Number.isInteger(h.level)&&h.level>=1&&h.level<=4&&Number.isFinite(h.at)).slice(-64).map(h=>({...h,text:typeof h.text==='string'?h.text.slice(0,400):'',legacy:saved.version===1||h.legacy===true})):[];if(saved.version===2){p.level=Number.isInteger(r.level)?Math.max(0,Math.min(hints[id].length,r.level)):0;p.family=typeof r.family==='string'?r.family:'';}}
 // Preserve earlier failed decoding/comparison attempts while retiring obsolete targeting stages.
 if(saved.version===1)for(const [old,id]of [['interpret','journal'],['compare','rings']]){const r=saved.puzzles?.[old];if(r){for(const key of ['attempts','repeats'])if(Number.isFinite(r[key])&&r[key]>=0)data.puzzles[id][key]+=r[key];if(Array.isArray(r.hints))data.puzzles[id].hints.push(...r.hints.filter(h=>Number.isInteger(h.level)&&h.level>=1&&h.level<=4&&Number.isFinite(h.at)).map(h=>({level:h.level,at:h.at,text:'',legacy:true})));data.puzzles[id].hints=data.puzzles[id].hints.slice(-64);}}
 return data;
}
const owns=(s,id)=>s.collected.includes(id);
function completed(s){return {books:s.bookshelfSolved,secret:owns(s,'journal')&&owns(s,'deskKey'),journal:s.cipherSolved,rings:s.confirmed.length===8||s.cipherSolved,desk:s.deskUnlocked,gears:s.repaired,clock:s.compartmentOpen,garden:s.completed};}
function scores(s){return {books:s.books.reduce((n,l,i)=>n+Number(l==='OBSCURE'[i]),0),secret:Number(owns(s,'journal'))+Number(owns(s,'deskKey')),journal:s.confirmed.length+Number(s.cipherSolved),rings:s.confirmed.length,desk:Number(owns(s,'deskKey'))+Number(s.deskUnlocked),gears:s.collected.filter(id=>/^gear/.test(id)).length+s.mounts.reduce((n,g,i)=>n+Number(g===['gear2','gear3','gear1'][i]),0),clock:Number(s.repaired)+Number(s.cipherSolved)+Number(s.hour===9)+Number(s.minute===0),garden:Number(s.compartmentOpen)+Number(owns(s,'gardenKey'))+Number(s.completed)};}
function family(s,id){return id==='clock'?(s.cipherSolved?'clock:decoded':'clock:undecoded'):id+':precise';}
function sync(data,s,now=Date.now()){
 const done=completed(s),score=scores(s);for(const id of ids){const p=data.puzzles[id],next=family(s,id);if(p.family!==next){p.family=next;p.level=0;p.offeredAt=0;}if(done[id]&&!p.completed||score[id]>p.best){p.lastProgressAt=now;p.offeredAt=0;p.handledAttempts=p.attempts;p.handledRepeats=p.repeats;}p.completed=done[id];p.best=Math.max(p.best,score[id]);}return data;
}
function questionTopic(q=''){
 q=q.toLowerCase();if(/bookshelf|book|volume|plaque|obscur/.test(q))return 'books';if(/garden|exit|passage|pendulum/.test(q))return 'garden';if(/gear|mechanism|spindle/.test(q))return 'gears';if(/desk|drawer|key|lock/.test(q))return 'desk';if(/clock|hand|time|hour/.test(q))return 'clock';if(/wheel|ring|rotate|alphabet/.test(q))return 'rings';if(/cipher|journal|symbol|message|interpret|phrase|testament/.test(q))return 'journal';return null;
}
function context(s,scene,q=''){
 const views={bookshelf:'books',bookshelfDrawer:'secret',journal:'journal',wheel:'rings',desk:'desk',deskDrawer:'desk',mechanism:'gears',maintenance:'gears',clock:'clock',clockFace:'clock',clockSecret:'garden',gardenPassage:'garden'};
 return views[scene]||questionTopic(q);
}
function activate(data,s,scene,id=context(s,scene)){
 if(!ids.includes(id))id=null;
 if(data.active?.scene!==scene||data.active?.id!==id){for(const p of Object.values(data.puzzles))p.offeredAt=0;data.active={scene,id};}
 return id;
}
function focus(data,s,scene,q=''){
 if(scene==='room'&&questionTopic(q))return questionTopic(q);
 if(data.active?.scene===scene&&data.active.id)return data.active.id;
 return context(s,scene,q);
}
function observe(data,before,after,type,p={},scene='room',now=Date.now()){
 let id=null,failed=false;
 if(type==='inspect'){activate(data,after,scene);id=context(after,scene);}
 else if(type==='book'&&p.from!==p.to&&!before.bookshelfSolved){id='books';failed=!after.bookshelfSolved;}
 else if(type==='testGears'&&!before.repaired){id='gears';failed=!after.repaired;}
 else if(type==='confirmSymbol'&&!before.cipherSolved){id='rings';const symbol=['△','□','⧖','♧','◇','✦','☾','⊕'][after.wheelSymbol];failed=String.fromCharCode(65+after.wheelLetter)!=={'⊕':'T','◇':'H','△':'E','□':'N','⧖':'I','☾':'O','♧':'U','✦':'R'}[symbol];}
 else if(type==='phrase'&&!before.cipherSolved){id='journal';failed=!after.cipherSolved;}
 else if(type==='time'&&!before.compartmentOpen){id='clock';failed=!after.compartmentOpen&&(before.hour!==after.hour||before.minute!==after.minute);}
 else if(type==='selectSymbol')id='journal';
 else if(type==='rotate'){activate(data,after,scene,'rings');if(now-data.puzzles.rings.lastInteractionAt>=500)id='rings';}
 else if(type==='attachWheel')id='rings';
 else if(type==='attempt'){id=p.puzzle;failed=true;}
 else if(type==='interaction')id=p.puzzle||focus(data,after,scene);
 if(ids.includes(id)){activate(data,after,scene,id);const r=data.puzzles[id];r.repeats++;r.lastInteractionAt=now;if(failed&&!r.completed)r.attempts++;}
 sync(data,after,now);return data;
}
function difficulty(r,now=Date.now()){
 if(r.attempts>=7)return 3;if(r.attempts>=5)return 2;if(r.attempts>=3)return 1;return r.repeats-r.handledRepeats>=6&&now-r.lastProgressAt>=90000?1:0;
}
const answerRequest=q=>/\b(answer|solution)\b/i.test(q)&&!/(?:\bno\b|\bnot\b|\bwithout\b|don't|do not).*\b(answer|solution)\b/i.test(q);
function options(s,id){
 if(id==='clock'&&!s.cipherSolved)return ['Look for another clue that might explain what time matters.'];
 if(id==='garden'&&!s.compartmentOpen)return ['The garden passage is locked. Look for its missing key as you investigate the study.'];
 if(id==='desk'&&!owns(s,'deskKey'))return [s.bookshelfSolved?'Collect the tagged brass key from the open bookshelf drawer.':'The desk is locked. Look for a key among the study’s hidden objects.'];
 return hints[id];
}
function available(data,s,scene,now=Date.now()){
 if(s.completed)return null;const id=focus(data,s,scene),r=data.puzzles[id];if(!r||r.completed)return null;
 const cap=id==='books'?3:options(s,id).length,level=Math.min(r.level+1,cap);
 if(level<=r.level||difficulty(r,now)<=r.level||now-r.handledAt<cooldown||r.attempts<=r.handledAttempts&&r.repeats<=r.handledRepeats)return null;
 return {id,level};
}
function dismiss(data,id,now=Date.now()){const r=data.puzzles[id];if(!r)return;r.offeredAt=0;r.dismissedAt=now;r.handledAt=now;r.handledAttempts=r.attempts;r.handledRepeats=r.repeats;}
function guidance(data,s,scene,q='',stronger=false,now=Date.now()){
 sync(data,s,now);const id=focus(data,s,scene,q),r=data.puzzles[id];
 if(s.completed)return {id:null,level:0,maxLevel:0,exhausted:true,text:'The study is complete. There are no remaining puzzle hints.'};
 if(!r)return {id:null,level:0,maxLevel:0,exhausted:true,text:'Which puzzle would you like help with: the bookshelf, cipher journal, cipher wheel, desk drawer, gears, clock, or garden passage?'};
 activate(data,s,scene,id);
 if(r.completed)return {id,level:0,maxLevel:0,exhausted:true,text:({books:'The bookshelf puzzle is complete.',secret:'You have collected both objects from this drawer.',journal:'The journal message is already decoded.',rings:'You have confirmed all the symbol-to-letter pairs.',desk:'The desk drawer is already unlocked.',gears:'The gear mechanism is repaired.',clock:'The clock has already opened its compartment.',garden:'The garden passage is unlocked.'})[id]};
 const list=options(s,id),cap=id==='books'?3:list.length,requestAnswer=id==='books'&&answerRequest(q),canAnswer=r.attempts>=7;
 let floor=id==='garden'&&owns(s,'gardenKey')?3:1;
 const advance=stronger||q.trim()||difficulty(r,now)>r.level;
 let level=Math.max(floor,r.level?Math.min(cap,r.level+(advance?1:0)):1);
 if(requestAnswer&&canAnswer)level=4;
 const text=list[level-1],seen=r.hints.some(h=>!h.legacy&&h.text===text&&h.family===r.family);
 const answerAvailable=id==='books'&&r.level===3&&canAnswer;
 if(seen){dismiss(data,id,now);return {id,level:r.level,maxLevel:list.length,answerAvailable,exhausted:r.level>=cap&&!answerAvailable,text:requestAnswer&&!canAnswer?'Try the clues in the puzzle first. The full answer is available after repeated unsuccessful attempts.':r.level>=cap?'You have reached the most specific hint for this puzzle. Try that guidance in the game.':'Your previous hint is saved. Request a stronger hint for the next step.'};}
 r.level=level;r.hints.push({level,at:now,text,family:r.family});r.hints=r.hints.slice(-64);dismiss(data,id,now);
 return {id,level,maxLevel:list.length,text,answerAvailable:id==='books'&&level===3&&canAnswer,exhausted:level>=cap&&!(id==='books'&&level===3&&canAnswer)};
}
return {ids,hints,fresh,restore,sync,context,focus,activate,observe,available,guidance,dismiss,difficulty};
});
