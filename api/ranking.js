/* Ranking online (Vercel Serverless + Supabase).
 * GET  /api/ranking  -> top 10 [{name,score}]
 * POST /api/ranking  -> {credential (ID token do Google), score}
 * O token do Google é verificado aqui no servidor; o nome vem do token, não do cliente.
 * Variáveis de ambiente no Vercel: SUPABASE_URL e SUPABASE_SECRET_KEY (chave secreta / service_role).
 * Opcional: GOOGLE_CLIENT_ID. */
const SB_URL=(process.env.SUPABASE_URL||'').trim().replace(/\/rest\/v1\/?$/,'').replace(/\/$/,'');
const SB_KEY=(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
const CLIENT_ID=process.env.GOOGLE_CLIENT_ID||'1032585005771-78bsr23d2ae9jmqmrqjlne49b39ip4pq.apps.googleusercontent.com';

// Chaves novas (sb_secret_...) não são JWT: só vão no header apikey. Chaves antigas (eyJ...) vão nos dois.
const headers=()=>{const h={apikey:SB_KEY,'Content-Type':'application/json'};if(SB_KEY.startsWith('eyJ'))h.Authorization='Bearer '+SB_KEY;return h};
const sbFail=async(r,where)=>{const t=await r.text().catch(()=>'');console.error('[ranking] supabase',where,r.status,t);return {status:502,body:{error:'Supabase '+r.status+' ('+where+')',detail:t.slice(0,300)}}};
const publicName=n=>{const p=String(n||'Jogador').trim().split(/\s+/);return (p.length>1?p[0]+' '+p[p.length-1][0]+'.':p[0]).slice(0,24)};

module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(!SB_URL||!SB_KEY)return res.status(503).json({error:'Supabase não configurado'});
  try{
    if(req.method==='GET'){
      const r=await fetch(SB_URL+'/rest/v1/ranking?select=name,score&order=score.desc,updated_at.asc&limit=10',{headers:headers()});
      if(!r.ok){const f=await sbFail(r,'select');return res.status(f.status).json(f.body)}
      return res.status(200).json(await r.json());
    }
    if(req.method==='POST'){
      const body=typeof req.body==='string'?JSON.parse(req.body):(req.body||{});
      const score=Math.floor(Number(body.score));
      if(!body.credential||!Number.isFinite(score)||score<0||score>1000000)return res.status(400).json({error:'Dados inválidos'});
      const g=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(body.credential));
      const info=await g.json();
      if(!g.ok||info.aud!==CLIENT_ID){console.error('[ranking] token',g.status,info.error_description||info.aud);return res.status(401).json({error:'Token inválido ou expirado (saia e entre com Google de novo)'})}
      const r=await fetch(SB_URL+'/rest/v1/rpc/submit_score',{method:'POST',headers:headers(),
        body:JSON.stringify({p_sub:info.sub,p_name:publicName(info.name||info.email),p_score:score})});
      if(!r.ok){const f=await sbFail(r,'submit_score');return res.status(f.status).json(f.body)}
      return res.status(200).json({ok:true});
    }
    res.status(405).json({error:'Método não permitido'});
  }catch(e){console.error('[ranking]',e);res.status(500).json({error:'Falha no servidor',detail:String(e&&e.message||e)})}
};
