const API="https://hvowzahihflzgsasirxo.supabase.co/functions/v1/tra-dashboard";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const num=(v,d=2)=>Number.isFinite(Number(v))?Number(v).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}):"—";
const money=v=>Number.isFinite(Number(v))?Number(v).toLocaleString("pt-BR",{style:"currency",currency:"USD"}):"—";
const pct=v=>Number.isFinite(Number(v))?num(v,2)+"%":"—";
const tm=v=>v?new Date(v).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}):"—";
const cls=s=>["ACTIVE","READY","COMPLETE","PROMISING","succeeded","HEALTHY"].includes(s)?"ok":["REJECTED","ERROR","failed","ISSUE"].includes(s)?"bad":["BLOCKED","CONTINUE","BACKTESTING","PENDING","HOLD"].includes(s)?"warn":"";
const badge=s=>'<span class="badge '+cls(s)+'">'+esc(s||"—")+'</span>';

document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===b.dataset.view));
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===b.dataset.view));
  $("crumb").textContent={overview:"Visão geral",ops:"Operações",research:"Pesquisa",system:"Sistema"}[b.dataset.view]||"TRA";
});

function draw(curve,initial){
  const s=$("chart"),e=$("chartempty"),p=[{equity:+initial||1000},...(curve||[])];
  if(p.length<2){
    s.innerHTML='<line x1="0" y1="135" x2="900" y2="135" stroke="#1b2a32" stroke-dasharray="5 8"/>';
    e.style.display="grid"; return;
  }
  e.style.display="none";
  const v=p.map(x=>+x.equity),mi=Math.min(...v),ma=Math.max(...v),sp=Math.max(.01,ma-mi);
  const xy=p.map((x,i)=>[(i/(p.length-1))*880+10,250-((+x.equity-mi)/sp)*225].join(",")).join(" ");
  const c=v[v.length-1]>=+initial?"#46d698":"#ff6b75";
  s.innerHTML='<polyline points="'+xy+'" fill="none" stroke="'+c+'" stroke-width="2"/>';
}

function render(d){
  const s=d.shadow||{},c=d.champion||{},h=d.health||{},hc=h.checks||{},sg=d.latest_signal||{},ex=d.execution||{},g=d.shadow_gate||{},pre=d.testnet_preflight||{},r=d.research||{};
  $("equity").textContent=money(s.equity); $("eqsub").textContent="base "+money(s.initial_equity);
  $("pnl").textContent=(+s.pnl_quote>=0?"+":"")+money(s.pnl_quote); $("pnl").className="value "+(+s.pnl_quote>=0?"green":"red"); $("pnlp").textContent=pct(s.pnl_pct);
  $("trades").textContent=s.trades??0; $("wr").textContent="win rate "+pct(s.win_rate_pct); $("dd").textContent=pct(s.max_drawdown_pct);
  $("champ").textContent="#"+(c.model_id||"—"); $("champm").textContent=(c.symbol||"—")+" / "+(c.timeframe||"—");
  $("health").textContent=h.healthy?"HEALTHY":"ISSUE"; $("health").className="value "+(h.healthy?"green":"red"); $("healtht").textContent=tm(h.created_at);
  $("shadowst").textContent=s.status||"—"; $("shadowst").className="badge "+cls(s.status); $("shadowmeta").textContent="Atualizado "+tm(s.updated_at);
  $("action").textContent=sg.action||"—"; $("action").className="action "+(sg.action==="HOLD"?"amber":"cyan");
  $("sigbadge").textContent=sg.action||"—"; $("sigbadge").className="badge "+cls(sg.action); $("sigtime").textContent=tm(sg.signal_time); $("prob").textContent=num((+sg.probability||0)*100,1)+"%";
  $("decisionrows").innerHTML=[["Threshold",num(sg.threshold,2)],["Execução",ex.mode||"—"],["Kill switch",ex.kill_switch?"ATIVO":"OFF"],["Shadow → Testnet",g.decision||"—"],["Preflight",pre.ready?"READY":"BLOCKED"]].map(x=>'<div class="row"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join("");
  draw(d.equity_curve,s.initial_equity);

  $("feed").innerHTML=(d.timeline||[]).slice(0,28).map(x=>'<div class="event"><div><b>'+esc(x.title)+'</b><p>'+esc(x.message)+'</p></div><time>'+esc(tm(x.ts))+'</time></div>').join("")||'<div class="empty">Sem eventos</div>';
  const ec=r.experiment_counts||{};
  $("lab").innerHTML=[["Fila",ec.PENDING||0],["Concluídos",ec.COMPLETE||0],["Rejeitados",ec.REJECTED||0],["Erros",ec.ERROR||0]].map(x=>'<div class="line"><div><b>'+x[0]+'</b><small>experimentos</small></div><strong>'+x[1]+'</strong></div>').join("");

  const p=d.current_position;
  $("position").innerHTML=p?'<b>'+esc(p.status)+'</b><div class="value">'+num(p.entry_price,4)+'</div><div class="sub">SL '+num(p.stop_price,4)+' · TP '+num(p.target_price,4)+'</div>':'<div class="empty">Nenhuma posição aberta. O Champion está aguardando uma entrada válida.</div>';
  const ob=g.criteria?.observed||{};
  $("gate").innerHTML=[["Decisão",g.decision||"—"],["Dias",ob.days??ob.shadow_days??"—"],["Trades",ob.trades??s.trades??0],["Cobertura",ob.coverage_pct!=null?pct(ob.coverage_pct):"—"],["Drawdown",pct(s.max_drawdown_pct)]].map(x=>'<div class="row"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join("");
  $("posbody").innerHTML=(d.positions||[]).map(x=>'<tr><td>'+badge(x.status)+'</td><td>'+esc(tm(x.entry_time))+'</td><td>'+num(x.entry_price,4)+'</td><td>'+num(x.stop_price,4)+'</td><td>'+num(x.target_price,4)+'</td><td>'+esc(tm(x.exit_time))+'</td><td>'+esc(x.exit_reason||"—")+'</td><td>'+pct(x.equity_return_pct)+'</td></tr>').join("")||'<tr><td colspan="8" class="empty">Nenhuma posição</td></tr>';
  $("sigbody").innerHTML=(d.signal_history||[]).map(x=>'<tr><td>'+esc(tm(x.signal_time))+'</td><td>'+badge(x.action)+'</td><td>'+num(+x.probability*100,1)+'%</td><td>'+num(x.threshold,2)+'</td><td>'+num(x.atr_abs,4)+'</td></tr>').join("");

  const hc2=r.hypothesis_counts||{}; $("hcounts").textContent=Object.entries(hc2).map(x=>x[0]+" "+x[1]).join(" · ");
  $("hyp").innerHTML=(r.hypotheses||[]).map(x=>'<div class="line"><div><b>'+esc(x.name)+'</b><small>'+esc(x.category)+' · '+esc(x.applicable_market)+'</small></div>'+badge(x.status)+'</div>').join("");
  $("expbody").innerHTML=(r.recent_experiments||[]).map(x=>{const w=x.walkforward_summary||{};return'<tr><td>'+esc(x.hypothesis_name)+'</td><td>'+esc(x.symbol)+'</td><td>'+esc(x.timeframe)+'</td><td>'+esc(x.research_rule)+'</td><td>'+badge(x.status)+'</td><td>#'+esc(x.model_id??"—")+'</td><td>'+pct(w.compounded_test_return_pct)+'</td><td>'+pct(w.worst_test_drawdown_pct)+'</td><td>'+esc(w.total_test_trades??"—")+'</td></tr>'}).join("");

  $("pipeShadow").textContent=(s.status||"—")+" · "+(g.decision||"—"); $("pipeTestnet").textContent=pre.ready?"READY":"BLOQUEADO"; $("pipeReal").textContent=ex.real_execution_unlocked?"UNLOCKED":"LOCKED / MANUAL";
  $("sysrows").innerHTML=[["Market data",hc.market_fresh?"FRESH":"STALE"],["Features",hc.feature_fresh?"FRESH":"STALE"],["Critical",hc.recent_critical_events??"—"],["Kill switch",ex.kill_switch?"ATIVO":"OFF"],["Real money",ex.real_execution_unlocked?"UNLOCKED":"LOCKED"]].map(x=>'<div class="row"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join("");
  $("blocks").innerHTML=(pre.blockers||[]).map(x=>'<span class="blocker">'+esc(x)+'</span>').join("")||'<span class="badge ok">SEM BLOCKERS</span>';
  $("cronbody").innerHTML=(d.recent_crons||[]).map(x=>'<tr><td>'+esc(x.jobname)+'</td><td>'+badge(x.status)+'</td><td>'+esc(tm(x.start_time))+'</td><td>'+(x.end_time&&x.start_time?num((new Date(x.end_time)-new Date(x.start_time))/1000,2)+"s":"—")+'</td></tr>').join("");
  $("sync").textContent="LIVE · "+tm(d.generated_at); $("dot").style.background="#46d698";
}
function showLogin(){sessionStorage.removeItem("tra_token");$("app").classList.add("hidden");$("login").classList.remove("hidden")}
function showApp(){$("login").classList.add("hidden");$("app").classList.remove("hidden")}
async function load(){
  const token=sessionStorage.getItem("tra_token"); if(!token)return showLogin();
  try{
    const q=await fetch(API+"?api=snapshot",{headers:{authorization:"Bearer "+token},cache:"no-store"});
    if(q.status===401)return showLogin();
    const j=await q.json(); if(!q.ok||!j.ok)throw new Error();
    showApp(); render(j.data);
  }catch{$("sync").textContent="OFFLINE";$("dot").style.background="#ff6b75"}
}
$("loginForm").onsubmit=async e=>{
  e.preventDefault(); const er=$("err"); er.style.display="none";
  try{
    const q=await fetch(API+"?action=login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:$("user").value,password:$("pass").value})});
    const j=await q.json();
    if(!q.ok||!j.ok){er.textContent=j.error==="RATE_LIMITED"?"Muitas tentativas. Aguarde 15 minutos.":"Usuário ou senha incorretos.";er.style.display="block";return}
    sessionStorage.setItem("tra_token",j.token); $("pass").value=""; await load();
  }catch{er.textContent="Falha de conexão.";er.style.display="block"}
};
$("logout").onclick=showLogin;
load(); setInterval(()=>{if(sessionStorage.getItem("tra_token"))load()},15000);