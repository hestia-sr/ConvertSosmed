const $=s=>document.querySelector(s);
const T={
id:{
tag:"PRIVAT • CEPAT • MOBILE",heroTitle:"Link kamu.<br><span>Media kamu.</span>",
heroSub:"Unduh media publik dan ubah video yang kompatibel menjadi MP3.",
video:"🎬 Video",mp3:"♫ MP3",best:"Kualitas terbaik",download:"Download <b>→</b>",
supported:"Link publik yang didukung",card1h:"Tempel & preview",
card1p:"ConvertSosmed membaca metadata dasar sebelum mengunduh.",card2h:"Pilih format",
card2p:"Simpan video atau ekstrak file audio MP3.",card3h:"Download & selesai",
card3p:"File sementara dibersihkan otomatis dari perangkat.",recent:"Download terbaru",
clear:"Hapus",responsible:"Gunakan dengan bijak.",
legal:"Unduh hanya konten yang boleh kamu simpan. ConvertSosmed tidak mendukung pembobolan DRM, akun, atau konten yang dibatasi akses.",
url:"Tempel URL video…",ready:"Siap.",reading:"Membaca informasi media…",
processing:"Mengunduh dan menyiapkan file…",done:"Selesai — file siap diunduh.",empty:"Belum ada download.",queued:"Menyiapkan download…"
},
en:{
tag:"PRIVATE • FAST • MOBILE",heroTitle:"Your links.<br><span>Your media.</span>",
heroSub:"Download public media and turn compatible videos into MP3.",
video:"🎬 Video",mp3:"♫ MP3",best:"Best quality",download:"Download <b>→</b>",
supported:"Supported public links",card1h:"Paste & preview",
card1p:"ConvertSosmed reads basic public metadata before downloading.",card2h:"Choose your format",
card2p:"Keep video or extract a convenient MP3 audio file.",card3h:"Download & go",
card3p:"Temporary files are automatically cleaned from the device.",recent:"Recent downloads",
clear:"Clear",responsible:"Use responsibly.",
legal:"Only download content you own or are authorized to save. ConvertSosmed does not support bypassing DRM, accounts, or access-restricted content.",
url:"Paste a video URL…",ready:"Ready.",reading:"Reading media information…",
processing:"Downloading and preparing your file…",done:"Done — your file is ready.",empty:"No downloads yet.",queued:"Preparing download…"
}};
let lang=localStorage.getItem("mf_lang")||"id",mode="video",meta={},previewTimer;

function tr(k){return T[lang][k]||k}
function setStatus(msg,type=""){
 const e=$("#status"); e.textContent=msg; e.className=type;
}
function applyLang(){
 document.documentElement.lang=lang;
 document.querySelectorAll("[data-i18n]").forEach(e=>e.innerHTML=tr(e.dataset.i18n));
 const inp=$("#url"); inp.placeholder=tr("url");
 $("#lang").textContent=lang==="id"?"🇮🇩 ID":"🇬🇧 EN";
}
function formatDuration(sec){
 if(!sec&&sec!==0)return "—";
 sec=Math.round(sec); const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
 return h?`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${m}:${String(s).padStart(2,"0")}`;
}
function platform(url){
 const u=(url||"").toLowerCase();
 if(u.includes("youtube")||u.includes("youtu.be"))return "YouTube";
 if(u.includes("instagram"))return "Instagram";
 if(u.includes("facebook")||u.includes("fb.watch"))return "Facebook";
 if(u.includes("twitter")||u.includes("x.com"))return "X";
 return "Media";
}
function resetPreview(){
 meta={};
 $("#preview").classList.remove("ready","loading");
 $("#preview-thumb").removeAttribute("src");
 $("#preview-thumb").style.display="none";
 $("#preview-placeholder").style.display="grid";
 $("#preview-platform").textContent="—";
 $("#preview-status").textContent="Pratinjau media";
 $("#preview-title").textContent=lang==="id"?"Masukkan link untuk melihat preview":"Paste a link to see preview";
 $("#preview-uploader").textContent="—";
 $("#preview-duration").textContent="⏱ —";
 $("#preview-type").textContent="● —";
}
async function preview(){
 const url=$("#url").value.trim();
 if(!url){resetPreview();return}
 $("#preview").classList.add("loading");
 $("#preview-status").textContent=tr("reading");
 try{
   const r=await fetch("/api/info",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
   const d=await r.json();
   if(!r.ok)throw Error(d.error||"Preview gagal");
   meta=d;
   $("#preview").classList.remove("loading");$("#preview").classList.add("ready");
   $("#preview-thumb").src=d.thumbnail||"";
   $("#preview-thumb").style.display=d.thumbnail?"block":"none";
   $("#preview-placeholder").style.display=d.thumbnail?"none":"grid";
   $("#preview-platform").textContent=platform(url);
   $("#preview-status").textContent=tr("ready");
   $("#preview-title").textContent=d.title||"Untitled media";
   $("#preview-uploader").textContent=d.uploader||"—";
   $("#preview-duration").textContent=`⏱ ${formatDuration(d.duration)}`;
   $("#preview-type").textContent=`● ${mode==="mp3"?"MP3":"Video"}`;
 }catch(e){
   $("#preview").classList.remove("loading");
   $("#preview-status").textContent="—";
   setStatus(e.message,"error");
 }
}
$("#url").addEventListener("input",()=>{clearTimeout(previewTimer);previewTimer=setTimeout(preview,550)});
$("#clear").onclick=()=>{$("#url").value="";resetPreview();setStatus("")};
document.querySelectorAll(".mode").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".mode").forEach(x=>x.classList.remove("active"));
 b.classList.add("active");mode=b.dataset.mode;
 $("#quality").style.display=mode==="mp3"?"none":"block";
 if(meta.title)$("#preview-type").textContent=`● ${mode==="mp3"?"MP3":"Video"}`;
});
$("#lang").onclick=()=>{lang=lang==="id"?"en":"id";localStorage.setItem("mf_lang",lang);applyLang();if($("#url").value.trim())preview()};
$("#download").onclick=async()=>{
 const url=$("#url").value.trim();
 if(!url){setStatus(lang==="id"?"Tempel URL dulu.":"Paste a URL first.","error");return}
 const btn=$("#download");btn.disabled=true;
 const box=$("#download-progress"),bar=$("#progress-bar"),val=$("#progress-value"),label=$("#progress-label");
 box.hidden=false;bar.style.width="2%";val.textContent="0%";label.textContent=tr("queued");setStatus(tr("processing"));
 try{
  const r=await fetch("/api/download",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({url,mode,quality:$("#quality").value,title:meta.title||""})});
  const text=await r.text();
  let d;
  try{d=JSON.parse(text)}catch{throw Error(text.trim().startsWith("<!doctype")||text.trim().startsWith("<")?"Server mengembalikan halaman error. Pastikan app.py yang baru sedang berjalan.":"Respons server tidak valid.")}
  if(!r.ok)throw Error(d.error||"Download gagal");
  await pollJob(d.job,bar,val,label);
 }catch(e){setStatus(e.message,"error");box.hidden=true}
 finally{btn.disabled=false}
};
async function pollJob(job,bar,val,label){
 for(let i=0;i<240;i++){
  await new Promise(r=>setTimeout(r,700));
  const r=await fetch("/api/job/"+encodeURIComponent(job));
  const text=await r.text();let d;
  try{d=JSON.parse(text)}catch{throw Error("Respons server tidak valid.")}
  if(!r.ok)throw Error(d.error||"Job gagal");
  const p=Math.round(d.progress||0);bar.style.width=p+"%";val.textContent=p+"%";label.textContent=d.message||tr("processing");
  if(d.status==="done"){
   setStatus(tr("done"),"success");await loadHistory();
   const a=document.createElement("a");a.href=d.url;a.download=d.filename||"";a.style.display="none";document.body.appendChild(a);a.click();a.remove();
   return;
  }
  if(d.status==="error") {
   bar.style.width="0%";val.textContent="0%";label.textContent=lang==="id"?"Download gagal":"Download failed";
   throw Error(d.message||"Download gagal");
  }
 }
 throw Error(lang==="id"?"Download terlalu lama.":"Download timed out.");
}
async function loadHistory(){
 try{
  const r=await fetch("/api/history");const d=await r.json();const list=$("#historyList");list.innerHTML="";
  const items=d.items||[];
  if(!items.length){list.innerHTML=`<div class="empty">${tr("empty")}</div>`;return}
  items.slice(0,8).forEach(x=>{
   const item=document.createElement("a");item.className="history-item";item.href=x.url;
   item.innerHTML=`<span class="history-icon">${x.mode==="mp3"?"♫":"▶"}</span><span class="history-name">${escapeHtml(x.title||x.filename)}</span><span class="history-type">${x.mode==="mp3"?"MP3":"VIDEO"} ↓</span>`;
   list.appendChild(item);
  });
 }catch{}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
$("#clearHistory").onclick=async()=>{await fetch("/api/clear-history",{method:"POST"});loadHistory()};
let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#install").hidden=false});
$("#install").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#install").hidden=true};
if("serviceWorker" in navigator)navigator.serviceWorker.register("/static/sw.js").catch(()=>{});
applyLang();resetPreview();loadHistory();
