const TS=32,COLS=21,ROWS=15,DIRS=[[1,0],[0,1],[-1,0],[0,-1]];
const RAW=["#####################","#o.......#.#.......o#","#.###.##.#.#.##.###.#","#...................#","#.###.#.#####.#.###.#","#.....#...#...#.....#","#####.#.#####.#.#####","  .................  ","#####.#.#####.#.#####","#.....#...#...#.....#","#.###.#.#####.#.###.#","#...................#","#.###.##.#.#.##.###.#","#o.......#.#.......o#","#####################"];
const GH=[{n:'akainu',col:'#e63946'},{n:'bigmom',col:'#ff7eb6'},{n:'croc',col:'#35d7f0'},{n:'barba',col:'#ff9f1c'}];
const cv=document.getElementById('c'),g=cv.getContext('2d'),$=id=>document.getElementById(id);
let map,coins,score=0,lives=3,level=1,state='menu',fright=0,combo=200,hi=0,pause=0,tick=0,P,ghosts;
try{hi=+localStorage.getItem('glm')||0}catch(e){}

const wall=(c,r)=>{c=(c+COLS)%COLS;return r<0||r>=ROWS||map[r][c]==='#'};
const atC=e=>e.x%TS===0&&e.y%TS===0;
const canGo=(e,d)=>!wall(Math.round(e.x/TS)+DIRS[d][0],Math.round(e.y/TS)+DIRS[d][1]);
const wrap=e=>{if(e.x<=-TS)e.x+=COLS*TS;if(e.x>=COLS*TS)e.x-=COLS*TS};

function loadMap(){map=RAW.map(s=>s.split(''));coins=0;map.forEach(r=>r.forEach(c=>{if(c==='.'||c==='o')coins++}))}
function resetPos(){
  P={x:10*TS,y:11*TS,d:-1,n:-1};
  ghosts=GH.map((o,i)=>({...o,x:(9+i)*TS,y:7*TS,d:i%2?0:2,wait:i*70,eaten:false}));
  fright=0;
}
function newGame(){SND.unlock();score=0;lives=3;level=1;loadMap();resetPos();state='play';hud();SND.play('start');SND.music(true)}
function hud(){$('sc').textContent=score;$('lv').textContent=lives;$('lvl').textContent=level;$('hi').textContent=hi}

function stepP(){
  const p=P;
  if(atC(p)){
    const c=((p.x/TS)+COLS)%COLS,r=p.y/TS,t=map[r][c];
    if(t==='.'){map[r][c]=' ';score+=10;coins--;SND.play('chomp')}
    else if(t==='o'){map[r][c]=' ';score+=50;coins--;SND.play('power');fright=Math.max(180,480-level*40);combo=200;ghosts.forEach(x=>{if(!x.eaten)x.d=(x.d+2)%4})}
    if(p.n>=0&&canGo(p,p.n))p.d=p.n;
    if(p.d>=0&&!canGo(p,p.d))p.d=-1;
  }else if(p.n>=0&&p.d>=0&&(p.n+2)%4===p.d)p.d=p.n;
  if(p.d>=0){p.x+=DIRS[p.d][0]*2;p.y+=DIRS[p.d][1]*2;wrap(p)}
}
function target(gh){
  const pc=Math.round(P.x/TS),pr=Math.round(P.y/TS),pd=P.d>=0?DIRS[P.d]:[0,0];
  if(gh.n==='bigmom')return[pc+pd[0]*4,pr+pd[1]*4];
  if(gh.n==='croc')return Math.random()<.35?[Math.random()*COLS|0,Math.random()*ROWS|0]:[pc,pr];
  if(gh.n==='barba'){const d=Math.hypot(pc-gh.x/TS,pr-gh.y/TS);return d>8?[pc,pr]:[1,13]}
  return[pc,pr];
}
function stepG(gh){
  if(gh.wait>0){gh.wait--;return}
  const sp=fright&&!gh.eaten?1:2;
  if(atC(gh)){
    let opts=[0,1,2,3].filter(d=>canGo(gh,d)&&d!==(gh.d+2)%4);
    if(!opts.length)opts=[(gh.d+2)%4];
    if(fright&&!gh.eaten)gh.d=opts[Math.random()*opts.length|0];
    else{
      const[tc,tr]=target(gh),c=Math.round(gh.x/TS),r=Math.round(gh.y/TS);
      let best=1e9;opts.forEach(d=>{const v=(c+DIRS[d][0]-tc)**2+(r+DIRS[d][1]-tr)**2;if(v<best){best=v;gh.d=d}});
    }
  }
  gh.x+=DIRS[gh.d][0]*sp;gh.y+=DIRS[gh.d][1]*sp;wrap(gh);
}
function update(){
  if(state!=='play'||HOLD.on)return;
  if(pause>0){pause--;return}
  tick++;stepP();ghosts.forEach(stepG);
  if(fright>0)fright--;
  for(const gh of ghosts){
    if(Math.hypot(gh.x-P.x,gh.y-P.y)<20){
      if(fright>0){SND.play('eatghost');score+=combo;combo*=2;gh.x=(9+Math.random()*3|0)*TS;gh.y=7*TS;gh.wait=90}
      else{lives--;pause=70;SND.play('death');if(lives<=0){state='over';SND.music(false);RANK.submit();setTimeout(()=>SND.play('over'),900);if(score>hi){hi=score;store.set('glm:hi:'+(user?user.name:'Convidado'),hi)}}else resetPos();break}
    }
  }
  if(coins<=0){SND.play('level');level++;RANK.submit();loadMap();resetPos();pause=60}
  hud();
}

/* ---------- desenho ---------- */
const IMG={};['akainu','bigmom','croc','barba','coin','fruit','luffy_front','luffy_side_a','luffy_side_b','luffy_side_c','luffy_back'].forEach(k=>{IMG[k]=new Image();IMG[k].src='assets/sprites/'+k+'.png'});
function spr(k,cx,cy,hh,flip){const im=IMG[k];if(!im||!im.complete||!im.naturalWidth)return false;const w=im.naturalWidth*hh/im.naturalHeight;
  g.save();g.translate(cx,cy);if(flip)g.scale(-1,1);g.imageSmoothingEnabled=false;g.drawImage(im,-w/2,-hh/2,w,hh);g.restore();return true}

function drawMap(){
  g.fillStyle='#071a3a';g.fillRect(0,0,cv.width,cv.height);
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    const t=map[r][c],x=c*TS,y=r*TS;
    if(t==='#'){g.fillStyle='#0b2a5c';g.fillRect(x+1,y+1,TS-2,TS-2);g.strokeStyle='#1e90ff';g.lineWidth=2;g.strokeRect(x+3,y+3,TS-6,TS-6)}
    else if(t==='.'){if(spr('coin',x+16,y+16,15))continue;g.fillStyle='#ffd23f';g.beginPath();g.arc(x+16,y+16,4,0,7);g.fill();g.fillStyle='#fff6b0';g.fillRect(x+15,y+13,2,2)}
    else if(t==='o'){const k=7+Math.sin(tick/8)*1.5;if(spr('fruit',x+16,y+16,22+Math.sin(tick/8)*2))continue;g.fillStyle='#7b2cbf';g.beginPath();g.arc(x+16,y+17,k,0,7);g.fill();
      g.strokeStyle='#c77dff';g.lineWidth=1.5;g.beginPath();g.arc(x+16,y+17,3,0,5);g.stroke();g.fillStyle='#2d6a4f';g.fillRect(x+15,y+7,3,4)}
  }
}
function drawLuffy(){
  const moving=P.d>=0,s=Math.floor(tick/6)%3;
  let k='luffy_front',fl=false;
  if(P.d===0||P.d===2){k=moving?['luffy_side_a','luffy_side_b','luffy_side_c'][s]:'luffy_side_b';fl=P.d===2}
  else if(P.d===3)k='luffy_back';
  if(spr(k,P.x+16,P.y+16,30,fl))return;
  drawLuffyFallback()}
function drawLuffyFallback(){
  const open=Math.sin(tick/3)>0||P.d<0;
  g.save();g.translate(P.x+16,P.y+17);
  if(P.d===2)g.scale(-1,1);
  g.fillStyle='#d62828';g.fillRect(-9,4,18,9);
  g.fillStyle='#f6cba0';g.fillRect(-9,4,3,4);
  g.fillStyle='#ffd23f';g.fillRect(-9,9,18,2);
  g.fillStyle='#2b6cb0';g.fillRect(-8,13,16,4);
  g.fillStyle='#f6cba0';g.beginPath();g.arc(0,-1,11,0,7);g.fill();
  g.fillStyle='#111';g.fillRect(-12,-5,4,7);g.fillRect(8,-5,4,7);
  g.fillRect(-5,-3,2,4);g.fillRect(3,-3,2,4);
  if(open){g.fillStyle='#7a1f1f';g.fillRect(-4,4,10,5);g.fillStyle='#fff';g.fillRect(-4,4,10,2)}
  else{g.fillStyle='#7a1f1f';g.fillRect(-4,5,10,2)}
  g.fillStyle='#f4d58d';g.beginPath();g.ellipse(0,-8,16,4,0,0,7);g.fill();
  g.beginPath();g.arc(0,-9,10,Math.PI,0);g.fill();
  g.fillStyle='#d62828';g.fillRect(-10,-11,20,3);
  g.restore();
}
function drawGhost(gh){
  const x=gh.x,y=gh.y,f=fright>0,blink=f&&fright<120&&((fright/10)|0)%2;
  if(!f&&spr(gh.n==='akainu'?'akainu':gh.n==='bigmom'?'bigmom':gh.n==='croc'?'croc':'barba',x+16,y+16,32))return;
  g.save();g.translate(x+16,y+16);
  g.fillStyle=f?(blink?'#fff':'#2a52ff'):gh.col;
  g.beginPath();g.arc(0,-1,12,Math.PI,0);g.lineTo(12,13);
  for(let i=0;i<4;i++)g.lineTo(12-6*i-3,9+((tick/6|0)+i)%2*3+1),g.lineTo(12-6*(i+1),13);
  g.closePath();g.fill();
  if(f){g.fillStyle=blink?'#d00':'#fff';g.fillRect(-6,-4,3,3);g.fillRect(3,-4,3,3);g.fillRect(-7,4,14,2)}
  else{
    const d=DIRS[gh.d]||[0,0];
    g.fillStyle='#fff';g.fillRect(-8,-6,7,8);g.fillRect(1,-6,7,8);
    g.fillStyle='#111';g.fillRect(-6+d[0]*2,-3+d[1]*2,3,4);g.fillRect(3+d[0]*2,-3+d[1]*2,3,4);
    if(gh.n==='akainu'){g.fillStyle='#fff';g.fillRect(-11,-16,22,6);g.fillStyle='#1d3557';g.fillRect(-4,-14,8,3);g.fillStyle='#ff7b00';g.fillRect(-12,12,24,3)}
    if(gh.n==='bigmom'){g.fillStyle='#b5179e';g.beginPath();g.ellipse(0,-12,15,4,0,0,7);g.fill();g.beginPath();g.arc(0,-13,9,Math.PI,0);g.fill();g.fillStyle='#fff';g.fillRect(-1,-18,3,3);g.fillStyle='#c1121f';g.fillRect(-5,5,10,3)}
    if(gh.n==='croc'){g.strokeStyle='#ffd23f';g.lineWidth=3;g.beginPath();g.arc(14,6,5,-1.5,2.5);g.stroke();g.fillStyle='#4a2c0a';g.fillRect(-8,5,16,2)}
    if(gh.n==='barba'){g.fillStyle='#111';g.fillRect(-12,-12,24,5);g.fillRect(-10,4,20,9);g.fillStyle='#fff';g.fillRect(-4,6,8,2)}
  }
  g.restore();
}
function overlay(t1,t2){
  g.fillStyle='rgba(5,11,31,.82)';g.fillRect(0,0,cv.width,cv.height);
  g.textAlign='center';g.fillStyle='#ffd75e';g.font='bold 44px Courier New';g.fillText(t1,cv.width/2,200);
  g.fillStyle='#fff';g.font='18px Courier New';g.fillText(t2,cv.width/2,250);
}
function draw(){
  drawMap();
  if(state==='menu'){drawLuffy();overlay('GRAND LINE MAZE','Caça-tesouros no labirinto — ENTER para zarpar!');return}
  if(pause===0||pause%10<6)drawLuffy();
  ghosts.forEach(drawGhost);
  if(state==='over')overlay('GAME OVER','Beris: '+score+' — ENTER para tentar de novo');
  else if(pause>0&&coins>0&&lives>0&&Math.floor(tick)<5)overlay('PRONTO!','');
}

/* ---------- loop e controles ---------- */
let last=0,acc=0;
function loop(t){
  acc+=Math.min(100,t-last);last=t;
  while(acc>=1000/60){update();acc-=1000/60}
  draw();requestAnimationFrame(loop);
}
const KEYS={ArrowRight:0,d:0,D:0,ArrowDown:1,s:1,S:1,ArrowLeft:2,a:2,A:2,ArrowUp:3,w:3,W:3};
addEventListener('keydown',e=>{
  if(document.getElementById('title').style.display!=='none')return;
  if(document.getElementById('login').style.display!=='none'&&user===null)return;
  if(e.key==='m'||e.key==='M'){SND.toggle();return}
  if(e.key==='Enter'&&state!=='play')newGame();
  if(e.key in KEYS&&P){P.n=KEYS[e.key];e.preventDefault()}
});
let t0=null;
cv.addEventListener('touchstart',e=>{t0=e.touches[0];if(state!=='play')newGame()},{passive:true});
cv.addEventListener('touchend',e=>{
  if(!t0||!P)return;const t=e.changedTouches[0],dx=t.clientX-t0.clientX,dy=t.clientY-t0.clientY;
  if(Math.max(Math.abs(dx),Math.abs(dy))>20)P.n=Math.abs(dx)>Math.abs(dy)?(dx>0?0:2):(dy>0?1:3);
});
