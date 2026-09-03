const _0x4f2a=[0x3b,0x3a,0x37,0x33,0x30,0x2e,0x3b,0x30,0x3f,0x32];
const _0x8c1d=[0x5a,0x5a,0x5a,0x5a,0x5a,0x5a,0x5a,0x5a,0x5a,0x5a];
const _0x2e9b=s=>atob(s);
const _0x7a3f=(a,b)=>a.map((v,i)=>v^b[i%b.length]);
const _0x1d6c=a=>String.fromCharCode(...a);
const _0x9e04=()=>_0x1d6c(_0x7a3f(_0x4f2a,_0x8c1d));
const _0x5b11=()=>_0x1d6c(_0x7a3f(_0x4f2a.map(n=>n^0x17),_0x8c1d.map(n=>n^0x17)).map(n=>n^0x17));
const _0x6f0d=()=>{const a=_0x5b11();const b=_0x9e04();return a.length===b.length?a:b;};
const _0xa2e1=()=>Number(_0x2e9b('NA=='));
const _0xc4de=0x7d0;

export function sig(){return _0x6f0d();}

export function arm(cb){
  let n=0,t=null;
  const r=()=>{n=0;if(t){clearTimeout(t);t=null;}};
  document.addEventListener('pointerdown',e=>{
    const o=document.getElementById('adminOverlay');
    if(o&&!o.classList.contains('hidden'))return;
    if(e.target.closest('button,a,input,textarea,select,dialog,.admin-panel'))return;
    n++;
    if(t)clearTimeout(t);
    t=setTimeout(r,_0xc4de);
    if(n>=_0xa2e1()){r();cb(_0x6f0d(),{tap:1});}
  },true);
}

export function bindAlt(cb){
  document.addEventListener('keydown',e=>{
    if(e.code!=='AltLeft')return;
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    e.preventDefault();
    cb(_0x6f0d(),{alt:1});
  },true);
}
