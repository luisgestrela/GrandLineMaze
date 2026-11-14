// Inicia o jogo (carregado por último)
loadMap();resetPos();hud();requestAnimationFrame(loop);

// Tela inicial animada
(function(){
  const T=document.getElementById('title'),H=document.getElementById('help');
  let leaving=false;
  // estrelas
  const st=T.querySelector('.stars');
  for(let i=0;i<80;i++){const s=document.createElement('i');s.style.cssText='left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;animation-delay:'+Math.random()*3+'s;transform:scale('+(.5+Math.random()*1.2)+')';st.appendChild(s)}
  // Luffy correndo (troca de quadros)
  const frames=['luffy_side_a','luffy_side_b','luffy_side_c','luffy_side_b'],runner=document.getElementById('runner');let f=0;
  setInterval(()=>{f=(f+1)%frames.length;runner.src='assets/sprites/'+frames[f]+'.png'},140);
  // música da tela inicial (começa no 1º clique/tecla se o navegador bloquear o autoplay)
  SND.music('title');
  function enter(){
    if(leaving)return;leaving=true;
    SND.unlock();SND.play('click');SND.music('title');
    T.classList.add('leaving');
    setTimeout(()=>{T.style.display='none';const u=document.getElementById('u');if(u&&document.getElementById('login').style.display!=='none')u.focus()},450);
  }
  const help=on=>{H.classList.toggle('on',on);SND.unlock();SND.play('click');if(!on)document.getElementById('btnStart').focus()};
  document.getElementById('btnStart').onclick=enter;
  document.getElementById('btnHelp').onclick=()=>help(true);
  document.getElementById('btnClose').onclick=()=>help(false);
  H.addEventListener('click',e=>{if(e.target===H)help(false)});
  addEventListener('keydown',e=>{
    if(T.style.display==='none')return;
    if(e.key==='Escape'&&H.classList.contains('on')){help(false);return}
    if(e.key==='Enter'&&!e.repeat&&!(e.target.closest&&e.target.closest('button,input'))&&!H.classList.contains('on'))enter();
  });
})();
