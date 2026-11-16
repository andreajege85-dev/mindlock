/* Offline, deterministic scaffolding. No network requests or model credentials. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.MindLockKeeper=api;})(globalThis,()=>{
'use strict';
const hints={
 books:[
  'Seven volumes, each bearing a single letter. What might their arrangement suggest?',
  'Perhaps these letters are not seven separate clues, but pieces of one larger message. What could they form?',
  'Consider the room itself. What word describes something hidden, unclear, or difficult to understand?',
  'The word begins with O and contains seven letters. Think of a word meaning hidden or not easily understood.'
 ],
 secret:[
  'What changed near the shelf when the letters found their order?',
  'Where did the quiet click come from? Look beneath the seven volumes.',
  'What might the newly opened drawer contain that the room still needs?',
  'Could you examine the concealed drawer and investigate each object separately?'
 ],
 journal:[
  'Which of your discoveries might hold a message?',
  'What could you learn by examining the journal among your possessions?',
  'Does the journal’s examination offer a way to open its pages?',
  'Select The Veiled Testament, choose Examine, then consider opening the journal.'
 ],
 compare:[
  'What remains consistent between the symbols in the journal and those engraved on the wheel?',
  'Which two relationships does the right page already offer as evidence?',
  'What object from the writing desk could let you compare a mark with a letter?',
  'With the journal open, could you select the cipher wheel and use it beside the pages?'
 ],
 rings:[
  'What remains consistent between the symbols in the journal and those engraved on the wheel?',
  'Which ring chooses a symbol, and which ring chooses a letter?',
  'Could one known relationship help you test the two rings independently?',
  'Try choosing one printed reference symbol with the outer ring and its printed letter with the inner ring. What happens when you press the central boss?'
 ],
 desk:[
  'Where might a clockmaker keep the pieces for unfinished work?',
  'What does the tag on your brass key suggest about the person who used it?',
  'Which piece of furniture has a small brass lock?',
  'Could you select the tagged brass key and try the writing desk’s drawer?'
 ],
 gears:[
  'How might the different sizes influence the way these pieces fit together?',
  'What do the vacant housings suggest about the diameter of each gear?',
  'What changes when you exchange two gears and test the mechanism again?',
  'Compare the largest, smallest and remaining gear with the clearances of the three housings. Can you test one change at a time?'
 ],
 interpret:[
  'What meaning emerges when you read the three groups together?',
  'What can repeated marks tell you about repeated letters?',
  'How could the two printed reference pairs help you verify the remaining words?',
  'What phrase about a particular hour fits every confirmed letter? Could you enter that interpretation beneath the wheel?'
 ],
 clock:[
  'What object in this room might respond to a reference to the ninth hour?',
  'What needs to be restored before the silent clock can respond?',
  'How would the two hands look at the hour described in your interpretation?',
  'When the mechanism is repaired and the journal understood, which hand should point to nine, and which should point to twelve?'
 ],
 garden:[
  'What changed beneath the pendulum after the chime?',
  'What could the glint inside the opened compartment be?',
  'Where does a cool draft enter the study? What might your new key fit?',
  'Have you collected the key by hand? Could you select it and investigate the old handle at the left doorway?'
 ]
};
const ids=Object.keys(hints),cooldown=60000;
const record=now=>({attempts:0,repeats:0,lastProgressAt:now,lastInteractionAt:0,hints:[],level:0,offeredAt:0,dismissedAt:0,handledAt:0,handledAttempts:0,handledRepeats:0,completed:false,best:0});
function fresh(now=Date.now()){return {version:1,puzzles:Object.fromEntries(ids.map(id=>[id,record(now)])),reflection:null};}
function restore(saved,now=Date.now()){
 const data=fresh(now);if(saved?.version!==1)return data;
 for(const id of ids){const r=saved.puzzles?.[id];if(!r)continue;const p=data.puzzles[id];for(const key of ['attempts','repeats','lastProgressAt','lastInteractionAt','level','offeredAt','dismissedAt','handledAt','handledAttempts','handledRepeats','best'])if(Number.isFinite(r[key])&&r[key]>=0)p[key]=r[key];p.level=Math.min(4,p.level);p.completed=r.completed===true;p.hints=Array.isArray(r.hints)?r.hints.filter(h=>Number.isInteger(h.level)&&h.level>=1&&h.level<=4&&Number.isFinite(h.at)).slice(-32):[];}
 if(saved.reflection&&typeof saved.reflection.text==='string'&&Number.isFinite(saved.reflection.at))data.reflection={text:saved.reflection.text.slice(0,400),at:saved.reflection.at};return data;
}
const owns=(s,id)=>s.collected.includes(id);
function completed(s){return {books:s.bookshelfSolved,secret:owns(s,'journal')&&owns(s,'deskKey'),journal:s.inspected.includes('journal'),compare:s.wheelAttached,rings:s.confirmed.length===8||s.cipherSolved,desk:s.deskUnlocked,gears:s.repaired,interpret:s.cipherSolved,clock:s.compartmentOpen,garden:s.completed};}
function scores(s){return {books:s.books.reduce((n,l,i)=>n+(l==='OBSCURE'[i]),0),secret:Number(owns(s,'journal'))+Number(owns(s,'deskKey')),journal:Number(owns(s,'journal'))+Number(s.inspected.includes('journal')),compare:Number(owns(s,'wheel'))+Number(s.wheelAttached),rings:s.confirmed.length,desk:Number(owns(s,'deskKey'))+Number(s.deskUnlocked),gears:s.collected.filter(id=>/^gear/.test(id)).length+s.mounts.reduce((n,g,i)=>n+(g===['gear2','gear3','gear1'][i]),0),interpret:s.confirmed.length+Number(s.cipherSolved),clock:Number(s.repaired)+Number(s.cipherSolved)+Number(s.hour===9)+Number(s.minute===0),garden:Number(s.compartmentOpen)+Number(owns(s,'gardenKey'))+Number(s.completed)};}
function sync(data,s,now=Date.now()){
 const done=completed(s),score=scores(s);for(const id of ids){const p=data.puzzles[id];if(done[id]&&!p.completed||score[id]>p.best){p.lastProgressAt=now;p.offeredAt=0;p.handledAttempts=p.attempts;p.handledRepeats=p.repeats;}p.completed=done[id];p.best=Math.max(p.best,score[id]);}return data;
}
function context(s,scene,q=''){
 q=q.toLowerCase();
 if(/book|volume|plaque|obscur|shelf|letter arrangement/.test(q))return s.bookshelfSolved?'secret':'books';
 if(/garden|exit|passage|pendulum|leaf/.test(q))return 'garden';
 if(/gear|mechanism|spindle/.test(q))return 'gears';
 if(/desk|drawer|brass key|tagged/.test(q))return s.bookshelfSolved?'desk':'books';
 if(/clock|hands|time|hour/.test(q))return s.repaired?'clock':'gears';
 if(/interpret|phrase|message|meaning/.test(q))return 'interpret';
 if(/ring|rotate|alphabet/.test(q))return s.wheelAttached?'rings':'compare';
 if(/cipher|symbol|wheel|journal|testament/.test(q))return !s.inspected.includes('journal')?'journal':s.wheelAttached?'rings':'compare';
 if(scene==='bookshelf')return s.bookshelfSolved?'secret':'books';
 if(scene==='bookshelfDrawer')return !completed(s).secret?'secret':!s.inspected.includes('journal')?'journal':'desk';
 if(scene==='journal')return !s.wheelAttached?'compare':s.confirmed.length===8?'interpret':'rings';
 if(['maintenance','mechanism','deskDrawer'].includes(scene))return 'gears';
 if(scene==='desk')return !s.deskUnlocked?'desk':!owns(s,'wheel')?'compare':'gears';
 if(scene==='clockSecret'||s.compartmentOpen)return 'garden';
 if(scene==='clock')return !s.repaired?'gears':!s.cipherSolved?'interpret':'clock';
 if(!s.bookshelfSolved)return 'books';if(!completed(s).secret)return 'secret';if(!s.inspected.includes('journal'))return 'journal';if(!s.deskUnlocked)return 'desk';if(!s.wheelAttached)return 'compare';if(!s.cipherSolved)return s.confirmed.length===8?'interpret':'rings';if(!s.repaired)return 'gears';return 'clock';
}
function observe(data,before,after,type,p={},scene='room',now=Date.now()){
 let id=null,failed=false;
 if(type==='book'&&p.from!==p.to&&!before.bookshelfSolved){id='books';failed=!after.bookshelfSolved;}
 else if(type==='testGears'&&!before.repaired){id='gears';failed=!after.repaired;}
 else if(type==='confirmSymbol'&&!before.cipherSolved){id='rings';failed=before.confirmed.length===after.confirmed.length&&!before.confirmed.includes(['△','□','⧖','♧','◇','✦','☾','⊕'][after.wheelSymbol]);}
 else if(type==='phrase'&&!before.cipherSolved){id='interpret';failed=!after.cipherSolved;}
 else if(type==='time'&&!before.compartmentOpen){id='clock';failed=!after.compartmentOpen&&(before.hour!==after.hour||before.minute!==after.minute);}
 else if(type==='rotate'&&now-data.puzzles.rings.lastInteractionAt>=500)id='rings';
 else if(type==='inspect')id=context(after,p.id||scene);
 else if(type==='attempt'){id=p.puzzle;failed=true;}
 else if(type==='interaction')id=p.puzzle||context(after,scene);
 if(ids.includes(id)){const r=data.puzzles[id];r.repeats++;r.lastInteractionAt=now;if(failed)r.attempts++;}
 sync(data,after,now);
 for(const [field,text]of [['bookshelfSolved','You recognized a pattern where there first appeared to be disorder. What helped you make that connection?'],['cipherSolved','You’ve transformed unfamiliar symbols into meaning. What evidence made your interpretation convincing?'],['repaired','The mechanism is restored. Now consider what the message from the journal might be asking you to investigate.']])if(!before[field]&&after[field])data.reflection={text,at:now};
 return data;
}
function difficulty(r,now=Date.now()){
 if(r.attempts>=10)return 4;if(r.attempts>=7)return 3;if(r.attempts>=5)return 2;if(r.attempts>=3)return 1;
 return r.repeats-r.handledRepeats>=6&&now-r.lastProgressAt>=90000?1:0;
}
function focus(data,s,scene,q=''){
 if(q.trim())return context(s,scene,q);
 const primary=context(s,scene),group=scene==='journal'?['journal','compare','rings','interpret']:scene==='bookshelf'||scene==='bookshelfDrawer'?['books','secret']:scene==='desk'?['desk','compare']:['clock','maintenance','mechanism','deskDrawer'].includes(scene)?[primary]:[primary];
 return group.filter(id=>!data.puzzles[id].completed).reduce((best,id)=>data.puzzles[id].lastInteractionAt>data.puzzles[best].lastInteractionAt?id:best,primary);
}
function available(data,s,scene,now=Date.now()){
 if(s.completed)return null;const id=focus(data,s,scene),r=data.puzzles[id];if(r.completed)return null;
 const level=difficulty(r,now);if(!level||level<=r.level||now-r.handledAt<cooldown||r.attempts<=r.handledAttempts&&r.repeats<=r.handledRepeats)return null;
 return {id,level};
}
function dismiss(data,id,now=Date.now()){const r=data.puzzles[id];if(!r)return;r.offeredAt=0;r.dismissedAt=now;r.handledAt=now;r.handledAttempts=r.attempts;r.handledRepeats=r.repeats;}
function guidance(data,s,scene,q='',stronger=false,now=Date.now()){
 const id=focus(data,s,scene,q),r=data.puzzles[id];
 if(s.completed)return {id,level:r.level,text:'The study’s investigation is complete. Which observations helped you connect its secrets?'};
 const explicit=stronger||/stronger|more help|another hint|next hint|stuck|give.*answer|solution|tell me/.test(q.toLowerCase());
 const level=Math.min(4,Math.max(1,difficulty(r,now),r.level+(explicit?1:0)));
 r.level=level;r.hints.push({level,at:now});r.hints=r.hints.slice(-32);r.offeredAt=0;r.handledAt=now;r.handledAttempts=r.attempts;r.handledRepeats=r.repeats;
 let text=hints[id][level-1];
 if(r.completed)text='You have already connected this part of the mystery. '+hints[context(s,'room')][0];
 if(id==='desk'&&!owns(s,'deskKey'))text='What did the newly opened bookshelf drawer reveal? Could each object have a different purpose?';
 if(id==='gears'&&!s.deskUnlocked)text='Before testing the workings, where might you find the missing pieces? What could the tagged key open?';
 if(id==='clock'&&!s.cipherSolved)text='The mechanism can move, but what evidence in the journal might tell you which time matters?';
 if(id==='garden'&&owns(s,'gardenKey'))text=level<3?'Where does the cool draft enter the study? What could your garden key fit?':'Could you select the garden key and test the old doorway handle on the left?';
 const reflection=data.reflection&&now-data.reflection.at<120000?data.reflection.text:null;data.reflection=null;
 return {id,level,text,reflection};
}
return {ids,hints,fresh,restore,sync,context,observe,available,guidance,dismiss,difficulty};
});
