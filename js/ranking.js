/* Ranking entre usuários logados
 * - Online (Vercel /api/ranking): jogadores que entram com Google, token verificado no servidor.
 * - Reserva local: quando a API não existe (ex.: npm run dev), mostra o ranking deste navegador.
 * - Convidados não entram no ranking. Tecla R abre/fecha; o jogo pausa enquanto o painel está aberto. */
const HOLD={on:false};
let RANK_ERR='';
const RANK=(()=>{
  const API='/api/ranking',$r=id=>document.getElementById(id);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const localBoard=()=>Object.entries(store.get('glm:rank')||{}).map(([n,v])=>({name:n,score:v.score})).sort((a,b)=>b.score-a.score).slice(0,10);

  async function submit(){
    if(!user||user.src==='guest'||score<=0)return;
    const o=store.get('glm:rank')||{},cur=o[user.name];
    if(!cur||score>cur.score){o[user.name]={score,level};store.set('glm:rank',o)}
    if(user.src==='google'&&user.token){
      try{
        const r=await fetch(API,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:user.token,score})});
        if(r.ok)RANK_ERR='';
        else{const d=await r.json().catch(()=>({}));RANK_ERR='HTTP '+r.status+' '+(d.error||'')+' '+(d.detail||'');console.warn('[ranking] não salvou online:',RANK_ERR)}
      }catch(e){RANK_ERR='sem resposta de /api/ranking';console.warn('[ranking]',e)}
    }
  }
  async function fetchRemote(){
    const c=new AbortController(),t=setTimeout(()=>c.abort(),4000);
    try{const r=await fetch(API,{signal:c.signal});if(!r.ok)throw 0;const d=await r.json();if(!Array.isArray(d))throw 0;return d}
    catch(e){return null}finally{clearTimeout(t)}
  }
  async function open(){
    HOLD.on=true;$r('rank').classList.add('on');
    $r('rankList').innerHTML='<li class="dim">Carregando…</li>';
    const remote=await fetchRemote(),list=remote||localBoard();
    $r('rankSrc').textContent=remote?'Ranking online (jogadores com Google)':'Ranking deste navegador (online indisponível)';
    $r('rankNote').textContent=!user?'Faça login para aparecer no ranking.':user.src==='guest'?'Convidados não entram no ranking.':(remote&&user.src!=='google')?'Entre com Google para aparecer no ranking online.':'';
    if(RANK_ERR)$r('rankNote').textContent='⚠ Não consegui salvar online: '+RANK_ERR;
    const medal=['🥇','🥈','🥉'];
    $r('rankList').innerHTML=list.length?list.map((p,i)=>'<li class="'+(user&&p.name===user.name?'me':'')+'"><b>'+(medal[i]||(i+1)+'º')+'</b><span>'+esc(p.name)+'</span><em>'+p.score+'</em></li>').join(''):'<li class="dim">Ninguém no ranking ainda. Seja o primeiro!</li>';
  }
  function close(){$r('rank').classList.remove('on');HOLD.on=false}
  const toggle=()=>$r('rank').classList.contains('on')?close():open();

  $r('rankbtn').onclick=e=>{toggle();e.currentTarget.blur()};
  $r('rankClose').onclick=close;
  $r('rank').addEventListener('click',e=>{if(e.target===$r('rank'))close()});
  addEventListener('keydown',e=>{
    if(document.getElementById('title').style.display!=='none'||user===null)return;
    if(e.target.tagName==='INPUT')return;
    if(e.key==='Escape'&&HOLD.on)close();
    else if((e.key==='r'||e.key==='R')&&!e.repeat)toggle();
  });
  return{submit,open,close};
})();
