/* Áudio do Grand Line Maze
 * - Música da tela inicial: assets/music/we-are.mp3
 * - Música da partida:      assets/music/tema-luffy.mp3
 *   (se algum arquivo não existir, toca uma trilha chiptune original como reserva)
 * - Efeitos sonoros: sintetizados com WebAudio.
 * - Tecla M / botão de som liga e desliga; controles de volume sincronizados. */
const SND=(()=>{
  const TRACKS={title:'assets/music/we-are.mp3',game:'assets/music/tema-luffy.mp3'};
  let ctx=null,master=null,muted=false,vol=.6,want=null,synth=null,step=0,flip=0;
  const els={},bad={};
  try{muted=localStorage.getItem('glm:mute')==='1';const v=localStorage.getItem('glm:vol');if(v!==null)vol=Math.max(0,Math.min(1,+v))}catch(e){}

  function unlock(){
    if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=muted?0:vol;master.connect(ctx.destination)}
    if(ctx.state==='suspended')ctx.resume();
  }
  function tone(f,d,o={}){
    if(!ctx||muted)return;
    const t=ctx.currentTime+(o.t0||0),osc=ctx.createOscillator(),g=ctx.createGain();
    osc.type=o.type||'square';osc.frequency.setValueAtTime(f,t);
    if(o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t+d);
    g.gain.setValueAtTime(o.vol||.12,t);g.gain.exponentialRampToValueAtTime(.001,t+d);
    osc.connect(g);g.connect(master);osc.start(t);osc.stop(t+d+.02);
  }
  const FX={
    chomp(){tone((flip^=1)?320:230,.07,{vol:.09})},
    power(){tone(200,.4,{to:900,type:'sawtooth',vol:.12})},
    eatghost(){tone(300,.25,{to:1300,vol:.14})},
    death(){tone(600,.9,{to:60,type:'sawtooth',vol:.15})},
    start(){[523,659,784,1047].forEach((f,i)=>tone(f,.15,{t0:i*.12}))},
    level(){[659,784,988,1319].forEach((f,i)=>tone(f,.14,{t0:i*.1}))},
    over(){[392,330,262,196].forEach((f,i)=>tone(f,.3,{t0:i*.25,type:'triangle',vol:.16}))},
    click(){tone(660,.06,{vol:.08});tone(880,.07,{t0:.05,vol:.08})}
  };

  /* Trilha de reserva (original) */
  const LEAD=[392,0,440,494,587,0,494,440,392,0,330,392,440,0,392,330];
  const BASS=[98,98,110,110,123,123,110,110];
  function synthTick(){
    if(!ctx||muted)return;
    const i=step%16;
    if(LEAD[i])tone(LEAD[i],.18,{vol:.05});
    if(i%2===0)tone(BASS[(i/2)%8],.22,{type:'triangle',vol:.08});
    step++;
  }
  const startSynth=()=>{if(!synth)synth=setInterval(synthTick,200)};
  const stopSynth=()=>{clearInterval(synth);synth=null};

  function getEl(k){
    if(!els[k]){
      const a=new Audio(TRACKS[k]);a.loop=true;a.preload='auto';
      a.addEventListener('error',()=>{bad[k]=true;if(want===k)startSynth()});
      els[k]=a;
    }
    return els[k];
  }
  /* music('title') | music('game') | music(true)=game | music(false)=parar */
  function music(track){
    const k=track===true?'game':(track||null);
    want=k;
    for(const n in els){if(n!==k){els[n].pause();els[n].currentTime=0}}
    stopSynth();
    if(!k)return;
    unlock();
    if(bad[k]){startSynth();return}
    const a=getEl(k);a.muted=muted;a.volume=vol*.75;
    a.play().catch(()=>{}); // se o navegador bloquear, tenta de novo no 1º clique/tecla
  }
  function kick(){
    if(ctx&&ctx.state==='suspended')ctx.resume();
    if(want&&els[want]&&els[want].paused&&!bad[want])els[want].play().catch(()=>{});
  }
  addEventListener('pointerdown',kick,true);
  addEventListener('keydown',kick,true);

  function label(){
    document.querySelectorAll('.mutebtn').forEach(b=>{
      b.textContent=b.dataset.long?(muted?'🔇 SOM: OFF':'🔊 SOM: ON'):(muted?'🔇':'🔊');
    });
    document.querySelectorAll('.volctl').forEach(s=>{s.value=Math.round(vol*100)});
  }
  function applyVol(){
    if(master)master.gain.value=muted?0:vol;
    for(const n in els){els[n].volume=vol*.75;els[n].muted=muted}
  }
  function toggle(){
    unlock();muted=!muted;applyVol();
    try{localStorage.setItem('glm:mute',muted?'1':'0')}catch(e){}
    label();
  }
  function setVolume(v){
    vol=Math.max(0,Math.min(1,v));
    try{localStorage.setItem('glm:vol',vol)}catch(e){}
    if(muted&&vol>0){muted=false;try{localStorage.setItem('glm:mute','0')}catch(e){}}
    applyVol();label();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.mutebtn').forEach(b=>{b.onclick=e=>{toggle();e.currentTarget.blur()}});
    document.querySelectorAll('.volctl').forEach(s=>{s.oninput=()=>setVolume(s.value/100);s.onchange=()=>s.blur()});
    label();
  });
  return{unlock,music,toggle,setVolume,play:n=>{if(ctx&&FX[n])FX[n]()}};
})();
