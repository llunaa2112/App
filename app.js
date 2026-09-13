const $=id=>document.getElementById(id);
const defaults={instrument:"MNQ",contracts:1,maxLoss:100,target:150,stretch:200,maxTrades:3,pause:10,start:"09:30",end:"16:00"};
let settings=JSON.parse(localStorage.getItem("tdg_settings")||"null")||defaults;
let session=JSON.parse(localStorage.getItem("tdg_session")||"null")||newSession();
let history=JSON.parse(localStorage.getItem("tdg_history")||"[]");
const qs=[
["Horario válido","¿Estoy dentro de mi horario de trading?"],
["Zona válida","¿Estoy en una zona donde mi estrategia tiene ventaja?"],
["Setup completo","¿El setup está completamente confirmado?"],
["Riesgo aceptable","¿Acepto perder $"+settings.maxLoss+" si esta operación falla?"],
["Impulso","¿Estoy entrando por impulso?","inverse"],
["Recuperación","¿Estoy intentando recuperar una pérdida?","inverse"],
["Exceso","¿Estoy intentando sacar más dinero innecesariamente?","inverse"]
];
function newSession(){return {date:new Date().toISOString(),pnl:0,trades:0,score:100,loss:false,started:true};}
function save(){localStorage.setItem("tdg_session",JSON.stringify(session));localStorage.setItem("tdg_history",JSON.stringify(history));}
function money(n){return (n<0?"−":"")+"$"+Math.abs(n).toFixed(0)}
function r(n){return (n/settings.maxLoss).toFixed(2)+"R"}
function render(){
 $("score").textContent=session.score;
 $("pnl").textContent=money(session.pnl);
 $("rPnl").textContent=r(session.pnl);
 $("trades").textContent=session.trades+"/"+settings.maxTrades;
 $("status").textContent=session.pnl<=-settings.maxLoss||session.trades>=settings.maxTrades?"SESIÓN BLOQUEADA":session.score>=90?"LISTO PARA OPERAR":session.score>=75?"ATENCIÓN":"DISCIPLINA EN RIESGO";
 $("statusDot").className="dot "+(session.pnl<=-settings.maxLoss||session.trades>=settings.maxTrades?"red":session.score>=90?"green":"yellow");
 const locked=session.pnl<=-settings.maxLoss||session.trades>=settings.maxTrades;
 $("lockBox").classList.toggle("hidden",!locked);
 if(locked)$("lockBox").textContent=session.pnl<=-settings.maxLoss?"Pérdida máxima diaria alcanzada. No más operaciones.":"Máximo de operaciones alcanzado. Sesión cerrada.";
 renderHistory();renderStats();
}
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.screen===id));}
document.querySelectorAll("[data-screen]").forEach(b=>b.onclick=()=>show(b.dataset.screen));
$("settingsBtn").onclick=()=>show("settings");
$("newTrade").onclick=()=>{if(session.pnl<=-settings.maxLoss||session.trades>=settings.maxTrades)return alert("Sesión bloqueada.");buildQuestions();show("trade")};
function buildQuestions(){
 $("questions").innerHTML=qs.map((q,i)=>`<div class="q"><p>${i+1}. ${q[1]}</p><div class="opts"><button data-i="${i}" data-v="yes">Sí</button><button data-i="${i}" data-v="no">No</button></div></div>`).join("");
 document.querySelectorAll(".opts button").forEach(b=>b.onclick=()=>{document.querySelectorAll(`.opts button[data-i="${b.dataset.i}"]`).forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
 $("decision").className="decision hidden";
}
$("evaluate").onclick=()=>{
 let answers=[];for(let i=0;i<qs.length;i++){let x=document.querySelector(`.opts button.selected[data-i="${i}"]`);if(!x)return alert("Responde todas las preguntas.");answers.push(x.dataset.v)}
 let score=0;answers.forEach((a,i)=>{let good=qs[i][2]==="inverse"?a==="no":a==="yes";score+=good?[15,15,20,15,10,15,10][i]:0});
 session.score=Math.min(session.score,score);
 let allowed=score>=90 && answers[4]==="no"&&answers[5]==="no"&&answers[6]==="no";
 $("decision").className="decision "+(allowed?"allow":"deny");
 $("decision").textContent=allowed?"🟢 TRADE PERMITIDO — ejecuta exactamente tu plan.":"🔴 NO TRADE — no necesitas esta operación.";
 if(allowed){session.trades++;save();render();}
};
$("endSession").onclick=()=>{
 if(!session.started)return;
 history.unshift({...session,closed:new Date().toISOString()});history=history.slice(0,100);
 session=newSession();save();render();alert("Sesión guardada.");
};
function renderHistory(){
 let el=$("historyList");if(!history.length){el.innerHTML='<div class="empty">Aún no hay sesiones.</div>';return}
 el.innerHTML=history.map((s,i)=>`<div class="card session-card"><div class="row"><span>${new Date(s.closed||s.date).toLocaleDateString("es-ES")}</span><b class="${s.pnl>=0?'good':'bad'}">${money(s.pnl)}</b></div><div class="row"><span>Disciplina</span><b>${s.score}/100</b></div><div class="row"><span>Operaciones</span><b>${s.trades}</b></div></div>`).join("");
}
function renderStats(){
 $("sCount").textContent=history.length;
 $("avgScore").textContent=history.length?Math.round(history.reduce((a,s)=>a+s.score,0)/history.length):"—";
 $("totalPnl").textContent=money(history.reduce((a,s)=>a+s.pnl,0));
 $("totalTrades").textContent=history.reduce((a,s)=>a+s.trades,0);
 $("bars").innerHTML=history.slice(0,10).map(s=>`<div class="bar"><small>${new Date(s.closed||s.date).toLocaleDateString("es-ES")}</small><div class="barline"><i style="width:${s.score}%"></i></div></div>`).join("")||'<div class="empty">Sin datos todavía.</div>';
}
function loadSettings(){
 for(const k of Object.keys(defaults))if($(k))$(k).value=settings[k];
}
$("saveSettings").onclick=()=>{
 for(const k of Object.keys(defaults))if($(k))settings[k]=$(k).type==="number"?Number($(k).value):$(k).value;
 localStorage.setItem("tdg_settings",JSON.stringify(settings));render();buildQuestions();alert("Configuración guardada.");
};
loadSettings();buildQuestions();render();
if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js");
