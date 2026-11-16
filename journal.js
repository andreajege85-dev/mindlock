/* Geometry for the approved, unmodified 1536 x 1024 final journal. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.MindLockJournal=api;})(globalThis,()=>{
 const symbols=['⊕','◇','△','□','⧖','□','⊕','◇','◇','☾','♧','✦'];
 const marks=[[354,448,66,66],[444,446,70,70],[529,446,72,70],[287,542,65,64],[364,541,65,67],[447,542,65,64],[528,541,67,67],[605,541,70,69],[316,635,70,70],[406,635,66,74],[479,633,80,78],[571,636,70,70]];
 const boxes=[[861,679,51,51],[921,679,51,51],[981,679,51,51],[1086,679,51,51],[1146,679,51,51],[1206,679,51,51],[1266,679,51,51],[1326,679,51,51],[993,768,51,51],[1054,768,51,51],[1115,768,51,51],[1176,768,51,51]];
 function answerLetters(state,mapping){return symbols.map(sym=>(state.cipherSolved||state.confirmed?.includes(sym))?mapping[sym]:'');}
 return {symbols,marks,boxes,answerLetters,art:'Cipher_Folio_Final.png',width:1536,height:1024};
});
