/* ---------- login ---------- */
// Configure aqui sua API real (POST {apiUrl}/login e {apiUrl}/register com {usuario,senha} -> {ok,nome}) e/ou o Client ID do Google.
const AUTH={apiUrl:'',googleClientId:'1032585005771-78bsr23d2ae9jmqmrqjlne49b39ip4pq.apps.googleusercontent.com'};
let user=null,mode='in';
const L=id=>document.getElementById(id);
const store={get:k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const msg=t=>{L('msg').textContent=t};
async function hashPw(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('glm:'+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return btoa(unescape(encodeURIComponent('glm:'+s)))}}
function setUser(name,src){user={name,src};store.set('glm:session',user);hi=+store.get('glm:hi:'+name)||0;L('login').style.display='none';L('who').textContent=name;state='menu';hud()}
function setMode(m){mode=m;L('tIn').className=m==='in'?'on':'';L('tUp').className=m==='up'?'on':'';L('go').textContent=m==='in'?'Entrar':'Criar conta';msg('')}
async function submit(){
  const u=L('u').value.trim(),pw=L('pw').value;
  if(u.length<3||pw.length<4)return msg('Usuário (3+) e senha (4+ caracteres).');
  if(AUTH.apiUrl){
    try{const r=await fetch(AUTH.apiUrl+(mode==='in'?'/login':'/register'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({usuario:u,senha:pw})});
      const d=await r.json();if(!r.ok||d.ok===false)return msg(d.erro||d.message||'Falha no login.');return setUser(d.nome||u,'api')}
    catch(e){return msg('Não consegui falar com a API.')}
  }
  const users=store.get('glm:users')||{},h=await hashPw(pw);
  if(mode==='up'){if(users[u])return msg('Esse usuário já existe.');users[u]=h;store.set('glm:users',users);return setUser(u,'local')}
  if(users[u]!==h)return msg('Usuário ou senha incorretos.');
  setUser(u,'local');
}
L('tIn').onclick=()=>setMode('in');L('tUp').onclick=()=>setMode('up');L('go').onclick=()=>{SND.unlock();submit()};
[L('u'),L('pw')].forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter')submit()}));
L('guest').onclick=()=>setUser('Convidado','guest');
function initGoogle(){
  google.accounts.id.initialize({client_id:AUTH.googleClientId,callback:r=>{
    const b=r.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    const pl=JSON.parse(decodeURIComponent(escape(atob(b))));
    setUser(pl.name||pl.email,'google');
  }});
  L('gg').style.display='none';
  google.accounts.id.renderButton(L('gbtn'),{theme:'filled_blue',size:'large',text:'signin_with',locale:'pt-BR',width:320});
}
L('gg').onclick=()=>{
  if(!AUTH.googleClientId)return msg('Login Google: defina AUTH.googleClientId no js/auth.js.');
  if(window.google&&google.accounts)return initGoogle();
  const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';
  s.onload=initGoogle;s.onerror=()=>msg('Não consegui carregar o Google (sem internet?).');
  document.head.appendChild(s);
};
if(AUTH.googleClientId)L('gg').onclick(); // com o ID configurado, o botão oficial já aparece
L('out').onclick=()=>{store.set('glm:session',null);user=null;state='menu';resetPos();L('who').textContent='-';L('login').style.display='flex'};
const ses=store.get('glm:session');if(ses&&ses.name&&ses.src!=='guest')L('u').value=ses.name;
