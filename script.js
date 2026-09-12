const defaultApps=[
  {id:"netflix",name:"NETFLIX",icon:"N",image:"logo-netflix.jpg",category:"STREAMING",description:"Basic • VIP • Reseller",
    tiers:[["BASIC","Rp5.000",true],["VIP","Rp10.000",true],["RESELLER","Rp25.000",true]]},
  {id:"canva",name:"CANVA",icon:"C",image:"logo-canva.png",category:"DESIGN",description:"Basic • VIP",
    tiers:[["BASIC","Rp5.000",true],["VIP","Rp10.000",true]]},
  {id:"alight-motion",name:"ALIGHT MOTION",icon:"A",category:"EDITING",description:"VIP 1 Tahun • Generator APK",
    tiers:[["VIP 1 TAHUN","Rp2.000",true],["GENERATOR APK","Rp15.000",true]]}
];
let apps=load(),admin=false;
function load(){
  try{
    let x=localStorage.getItem("ndrex_apps");
    if(x){
      let a=JSON.parse(x);
      a.forEach(app=>{
        if(!app.image){
          let d=defaultApps.find(x=>x.id===app.id);
          if(d&&d.image) app.image=d.image;
        }
      });
      return a;
    }
    let old=localStorage.getItem("ndrex_products");
    if(old){
      let o=JSON.parse(old);
      return Object.entries(o).map(([name,tiers])=>{
        let d=defaultApps.find(a=>a.name===name);
        return {id:d?d.id:slugify(name),name,icon:d?d.icon:name[0].toUpperCase(),image:d?d.image:undefined,category:d?d.category:"PRODUK",description:d?d.description:"",tiers};
      });
    }
    return structuredClone(defaultApps);
  }catch{return structuredClone(defaultApps)}
}
function slugify(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||("app-"+Date.now())}
function type(){let s="NDREX PROJECT",i=0,e=document.getElementById("typingText");(function t(){if(i<s.length){e.textContent+=s[i++];setTimeout(t,105)}})()}

/* ===== SPACE DOOR INTRO ===== */
const doorIntro = document.getElementById("doorIntro");
function openDoors(){
  if(!doorIntro){ type(); return; }
  requestAnimationFrame(()=>doorIntro.classList.add("opening"));
  setTimeout(()=>{
    doorIntro.style.display="none";
    type();
  },1150);
}
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",openDoors);
}else{
  openDoors();
}

function goToStore(){document.getElementById("slide1").style.display="none";document.getElementById("slide2").classList.add("show");window.scrollTo(0,0)}

function renderProductGrid(){
  const grid=document.getElementById("productGrid");
  if(!grid) return;
  grid.innerHTML="";
  if(!apps.length){
    grid.innerHTML=`<div class="grid-empty">Belum ada aplikasi. Tambahkan lewat panel admin.</div>`;
    return;
  }
  apps.forEach(a=>{
    const tiers=Array.isArray(a.tiers)?a.tiers:[];
    const active=tiers.filter(x=>x&&x[2]).length;
    const stockState=!tiers.length||active===0?"HABIS":(active<tiers.length?"TERBATAS":"TERSEDIA");
    const stockClass=stockState.toLowerCase();
    const b=document.createElement("button");
    b.className="product-card";
    b.onclick=()=>openTiers(a.id);
    b.innerHTML=`
      <div class="icon${a.image?" has-image":""}">${a.image?`<img src="${esc(a.image)}" alt="${esc(a.name)}">`:esc(a.icon||a.name[0]||"?")}</div>
      <div class="product-stock ${stockClass}"><i></i>${stockState}</div>
      <small>${esc(a.category||"PRODUK")}</small>
      <h3>${esc(a.name)}</h3>
      <p>${esc(a.description||"")}</p>
      <b>→</b>`;
    if(stockState==="HABIS") b.classList.add("is-sold-out");
    grid.appendChild(b);
  });
  requestAnimationFrame(()=>{ updateCarouselPadding(); updateCarouselFocus(); });
}

/* ===== CAROUSEL: CENTER FOCUS + BLUR-ON-SCROLL ===== */
function updateCarouselPadding(){
  const grid=document.getElementById("productGrid");
  const first=grid?.querySelector(".product-card");
  if(!grid||!first) return;
  const pad=Math.max(0,(grid.clientWidth-first.offsetWidth)/2);
  grid.style.paddingLeft=pad+"px";
  grid.style.paddingRight=pad+"px";
}
function updateCarouselFocus(){
  const grid=document.getElementById("productGrid");
  if(!grid) return;
  const cards=grid.querySelectorAll(".product-card");
  if(!cards.length) return;
  const gr=grid.getBoundingClientRect();
  const centerX=gr.left+gr.width/2;
  cards.forEach(card=>{
    const r=card.getBoundingClientRect();
    const dist=Math.abs(centerX-(r.left+r.width/2));
    const norm=Math.min(dist/(gr.width/2||1),1.3);
    card.style.filter=`blur(${(norm*5).toFixed(2)}px)`;
    card.style.transform=`scale(${(1-norm*0.1).toFixed(3)})`;
    card.style.opacity=(1-norm*0.4).toFixed(3);
  });
}
(function setupCarouselListeners(){
  const grid=document.getElementById("productGrid");
  if(!grid) return;
  let ticking=false;
  grid.addEventListener("scroll",()=>{
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(()=>{ updateCarouselFocus(); ticking=false; });
  },{passive:true});
  window.addEventListener("resize",()=>{ updateCarouselPadding(); updateCarouselFocus(); });
})();

let selectedOrder=null;

function openTiers(id){
  const a=apps.find(x=>x.id===id);
  if(!a) return;
  modal("tierModal");
  document.getElementById("modalTitle").textContent=a.name;
  const l=document.getElementById("tierList");
  l.innerHTML="";
  if(!a.tiers.length){l.innerHTML=`<p class="note">Belum ada tier untuk produk ini.</p>`;return}
  a.tiers.forEach(x=>{
    const b=document.createElement("button");
    b.className="tier";
    b.disabled=!x[2];
    b.innerHTML=`<span>${esc(x[0])}</span><span class="tier-price">${esc(x[1])}${x[2]?"":" • HABIS"}</span>`;
    if(x[2]) b.onclick=()=>openOrder(a,x);
    l.appendChild(b);
  });
}

function openOrder(app,tier){
  selectedOrder={appId:app.id,product:app.name,tier:tier[0],price:tier[1]};
  closeModal();
  document.getElementById("orderProduct").textContent=app.name;
  document.getElementById("orderTier").textContent=tier[0];
  document.getElementById("orderPrice").textContent=tier[1];
  modal("orderModal");
}
function closeOrder(){document.getElementById("orderModal").classList.remove("show")}
function continueToPayment(){
  closeOrder();
  openPayment();
}

function modal(id){document.getElementById(id).classList.add("show")}
function closeModal(){document.getElementById("tierModal").classList.remove("show")}
function openPayment(){closeModal();modal("paymentModal")} function closePayment(){document.getElementById("paymentModal").classList.remove("show")}
async function copyNumber(){try{await navigator.clipboard.writeText("085718558667");document.getElementById("copyStatus").textContent=" Tersalin ✓"}catch{}setTimeout(()=>document.getElementById("copyStatus").textContent="",1800)}
function openAdminLogin(){document.getElementById("adminPassword").value="";document.getElementById("adminError").textContent="";modal("adminLoginModal")}
function closeAdminLogin(){document.getElementById("adminLoginModal").classList.remove("show")}
function loginAdmin(){if(document.getElementById("adminPassword").value!=="ndrex123"){document.getElementById("adminError").textContent="Password salah.";return}admin=true;closeAdminLogin();renderAdmin();modal("adminModal")}

function renderAdmin(){
  const c=document.getElementById("adminProducts");
  c.innerHTML="";
  const rpInput=document.getElementById("resellerPasswordInput");
  if(rpInput) rpInput.value=getResellerPassword();
  if(!apps.length){
    c.innerHTML=`<p class="note">Belum ada aplikasi. Klik "+ Tambah Aplikasi" di bawah.</p>`;
  }
  apps.forEach((a,ai)=>{
    const s=document.createElement("div");
    s.className="admin-section";
    s.innerHTML=`
      <div class="admin-app-head">
        <div class="admin-icon-preview">${esc((a.icon||"?").slice(0,2))}</div>
        <div class="admin-app-fields">
          <input class="aa-name" data-ai="${ai}" placeholder="Nama aplikasi" value="${esc(a.name)}">
          <div class="admin-app-sub">
            <input class="aa-cat" data-ai="${ai}" placeholder="Kategori" value="${esc(a.category)}">
            <input class="aa-icon" data-ai="${ai}" placeholder="Ikon" maxlength="2" value="${esc(a.icon)}">
          </div>
        </div>
        <button type="button" class="app-delete" title="Hapus aplikasi" onclick="deleteApp(${ai})">×</button>
      </div>
      <input class="aa-desc" data-ai="${ai}" placeholder="Deskripsi singkat (mis. Basic • VIP)" value="${esc(a.description)}">
      <div class="reseller-link-edit">
        <label class="note">LINK AKSES RESELLER</label>
        <input class="ar-link" data-ai="${ai}" type="url" placeholder="https://link-yang-admin-berikan.com/..." value="${esc(a.resellerLink||"")}">
        <small>Link ini akan muncul di Panel Reseller, bukan sebagai harga khusus.</small>
      </div>
      <div class="tier-edit-list" data-ai="${ai}"></div>
      <button type="button" class="add-tier-btn" onclick="addTier(${ai})">+ Tambah Tier</button>
    `;
    const tierWrap=s.querySelector(".tier-edit-list");
    a.tiers.forEach((x,i)=>{
      const row=document.createElement("div");
      row.className="admin-row";
      row.innerHTML=`<input class="an" data-ai="${ai}" data-i="${i}" value="${esc(x[0])}" placeholder="Nama tier"><input class="ap" data-ai="${ai}" data-i="${i}" value="${esc(x[1])}" placeholder="Harga"><label class="admin-stock"><input type="checkbox" class="as" data-ai="${ai}" data-i="${i}" ${x[2]?"checked":""}> STOK</label><button type="button" class="tier-delete" title="Hapus tier" onclick="deleteTier(${ai},${i})">×</button>`;
      tierWrap.appendChild(row);
    });
    c.appendChild(s);
  });
}

function syncFromDOM(){
  document.querySelectorAll(".aa-name").forEach(e=>apps[e.dataset.ai].name=e.value);
  document.querySelectorAll(".aa-cat").forEach(e=>apps[e.dataset.ai].category=e.value);
  document.querySelectorAll(".aa-icon").forEach(e=>apps[e.dataset.ai].icon=e.value);
  document.querySelectorAll(".aa-desc").forEach(e=>apps[e.dataset.ai].description=e.value);
  document.querySelectorAll(".ar-link").forEach(e=>apps[e.dataset.ai].resellerLink=e.value.trim());
  document.querySelectorAll(".an").forEach(e=>apps[e.dataset.ai].tiers[e.dataset.i][0]=e.value);
  document.querySelectorAll(".ap").forEach(e=>apps[e.dataset.ai].tiers[e.dataset.i][1]=e.value);
  document.querySelectorAll(".as").forEach(e=>apps[e.dataset.ai].tiers[e.dataset.i][2]=e.checked);
}

function addNewApp(){
  syncFromDOM();
  apps.push({id:"app-"+Date.now(),name:"",icon:"?",category:"",description:"",resellerLink:"",tiers:[["TIER BARU","Rp0",true]]});
  renderAdmin();
  const sections=document.querySelectorAll(".admin-section");
  sections[sections.length-1]?.scrollIntoView({behavior:"smooth",block:"center"});
}

function deleteApp(ai){
  syncFromDOM();
  apps.splice(ai,1);
  renderAdmin();
}

function addTier(ai){
  syncFromDOM();
  apps[ai].tiers.push(["TIER BARU","Rp0",true]);
  renderAdmin();
}

function deleteTier(ai,i){
  syncFromDOM();
  apps[ai].tiers.splice(i,1);
  renderAdmin();
}

function saveAdminData(){
  syncFromDOM();
  apps.forEach(a=>{ if(!a.id) a.id=slugify(a.name); });
  localStorage.setItem("ndrex_apps",JSON.stringify(apps));
  const rpInput=document.getElementById("resellerPasswordInput");
  if(rpInput && rpInput.value.trim()) localStorage.setItem("ndrex_reseller_password", rpInput.value.trim());
  renderAdmin();
  renderProductGrid();
  document.getElementById("adminSaved").textContent="Perubahan tersimpan ✓";
  setTimeout(()=>document.getElementById("adminSaved").textContent="",1800);
}

function resetAdminData(){
  apps=structuredClone(defaultApps);
  localStorage.setItem("ndrex_apps",JSON.stringify(apps));
  renderAdmin();
  renderProductGrid();
}
function closeAdmin(){document.getElementById("adminModal").classList.remove("show")}
function esc(x){return String(x??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeOrder();closePayment();closeAdminLogin();closeAdmin();closeResellerLogin();closeResellerPanel()}})

/* ===== RESELLER PANEL ===== */
const DEFAULT_RESELLER_PASSWORD="reseller123";
function getResellerPassword(){return localStorage.getItem("ndrex_reseller_password")||DEFAULT_RESELLER_PASSWORD}

function openResellerLogin(){
  document.getElementById("resellerPassword").value="";
  document.getElementById("resellerError").textContent="";
  modal("resellerLoginModal");
}
function closeResellerLogin(){document.getElementById("resellerLoginModal").classList.remove("show")}

function loginReseller(){
  const val=document.getElementById("resellerPassword").value;
  if(val!==getResellerPassword()){
    document.getElementById("resellerError").textContent="Password salah.";
    return;
  }
  closeResellerLogin();
  renderResellerPanel();
  modal("resellerModal");
}
function closeResellerPanel(){document.getElementById("resellerModal").classList.remove("show")}

function renderResellerPanel(){
  const list=document.getElementById("resellerList");
  list.innerHTML="";
  const rows=[];
  apps.forEach((a,ai)=>{
    // Link reseller berdiri sendiri: tidak bergantung pada tier/harga RESELLER.
    // Kalau admin mengisi link, produk akan selalu muncul di panel reseller.
    if((a.resellerLink||"").trim()){
      rows.push({app:a.name||"Produk", link:a.resellerLink||"", stock:true, ai});
    }
  });
  if(!rows.length){
    list.innerHTML=`<p class="note">Belum ada akses reseller yang tersedia saat ini.</p>`;
    return;
  }
  rows.forEach(r=>{
    const el=document.createElement("div");
    el.className="reseller-access-card";
    el.innerHTML=`
      <div class="reseller-access-info">
        <span class="reseller-access-title">${esc(r.app)}</span>
        <span class="reseller-access-status">${r.stock ? "AKSES TERSEDIA" : "AKSES NONAKTIF"}</span>
      </div>
      <button class="reseller-link-btn" ${r.stock && r.link ? `onclick="openResellerLink(${r.ai})"` : "disabled"}>
        ${r.stock && r.link ? "BUKA LINK AKSES ↗" : "LINK BELUM DIBERIKAN"}
      </button>`;
    list.appendChild(el);
  });
}

function openResellerLink(ai){
  const a=apps[ai];
  const link=(a?.resellerLink||"").trim();
  if(!link){
    alert("Link akses belum diberikan admin.");
    return;
  }
  try{
    const u=new URL(link);
    if(!/^https?:$/.test(u.protocol)) throw new Error("invalid");
    window.open(u.href,"_blank","noopener,noreferrer");
  }catch(e){
    alert("Link akses reseller belum valid. Silakan hubungi admin.");
  }
}

function confirmPayment(){
  const message = encodeURIComponent(
    "Halo admin NDREX PROJECT, saya ingin konfirmasi pembelian. Saya sudah melakukan pembayaran dan akan mengirimkan bukti pembayaran."
  );
  window.open("https://wa.me/6285715559734?text=" + message, "_blank");
}

/* ===== CLICK / TRANSITION ANIMATIONS ===== */
const transitionEl = document.getElementById("pageTransition");
const rippleLayer = document.getElementById("clickRipples");

function playTransition(){
  transitionEl.classList.remove("active");
  void transitionEl.offsetWidth;
  transitionEl.classList.add("active");
  setTimeout(()=>transitionEl.classList.remove("active"),700);
}

document.addEventListener("click", (e)=>{
  const target = e.target.closest("button, .intro");
  if(!target) return;
  const ripple = document.createElement("span");
  ripple.className = "click-ripple";
  ripple.style.left = e.clientX + "px";
  ripple.style.top = e.clientY + "px";
  rippleLayer.appendChild(ripple);
  setTimeout(()=>ripple.remove(),700);
});

const originalGoToStore = goToStore;
const starLoader = document.getElementById("starLoader");
const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STAR_LOADER_MS = prefersReducedMotion ? 200 : 3000;

goToStore = function(){
  playTransition();
  if(!starLoader){ setTimeout(originalGoToStore,160); return; }
  starLoader.classList.add("show");
  setTimeout(()=>{
    originalGoToStore();
    setTimeout(()=>{ starLoader.classList.remove("show"); },250);
  },STAR_LOADER_MS);
};

/* ===== PWA: SERVICE WORKER + INSTALL PROMPT (ANDROID) ===== */
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}

let deferredInstallPrompt = null;
const installToast = document.getElementById("installToast");

window.addEventListener("beforeinstallprompt",(e)=>{
  e.preventDefault();
  deferredInstallPrompt = e;
  if(localStorage.getItem("ndrex_install_dismissed")) return;
  setTimeout(()=>{ if(installToast) installToast.classList.add("show"); },1200);
});

function installApp(){
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.finally(()=>{
    deferredInstallPrompt = null;
    installToast.classList.remove("show");
  });
}

function dismissInstall(){
  installToast.classList.remove("show");
  localStorage.setItem("ndrex_install_dismissed","1");
}

window.addEventListener("appinstalled",()=>{
  if(installToast) installToast.classList.remove("show");
});

/* ===== INTRO PORTAL PARALLAX ===== */
const introSection = document.getElementById("slide1");
const portalEl = document.querySelector(".portal");
if(introSection && portalEl){
  introSection.addEventListener("mousemove",(e)=>{
    const r = introSection.getBoundingClientRect();
    const x = (e.clientX - r.left)/r.width - .5;
    const y = (e.clientY - r.top)/r.height - .5;
    portalEl.style.transform = `translate(${x*-16}px,${y*-16}px)`;
  });
  introSection.addEventListener("mouseleave",()=>{ portalEl.style.transform = ""; });
}

renderProductGrid();

/* ===== THEME TOGGLE (ZIPPER TRANSITION) ===== */
const zipperOverlay = document.getElementById("zipperOverlay");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const ZIP_MS = 1150;
const HERO_VIDEO_LIGHT = "hero-light.mp4";
const HERO_VIDEO_DARK = "hero.mp4";

function updateHeroVideoForTheme(theme){
  const source = document.getElementById("heroVideoSource");
  const video = document.getElementById("heroVideo");
  if(!source || !video) return;
  const wanted = theme === "light" ? HERO_VIDEO_LIGHT : HERO_VIDEO_DARK;
  if(!source.getAttribute("src").endsWith(wanted)){
    source.setAttribute("src", wanted);
    video.load();
    video.play().catch(()=>{});
  }
}

function updateThemeButtonLabel(theme){
  if(themeToggleBtn) themeToggleBtn.textContent = theme === "light" ? "MODE GELAP" : "MODE TERANG";
}

function setTheme(theme){
  document.body.setAttribute("data-theme", theme === "light" ? "light" : "dark");
  localStorage.setItem("ndrex_theme", theme);
  updateHeroVideoForTheme(theme);
  updateThemeButtonLabel(theme);
}

function toggleTheme(){
  const next = document.body.getAttribute("data-theme") === "light" ? "dark" : "light";
  if(!zipperOverlay){ setTheme(next); return; }
  zipperOverlay.classList.add("show");
  setTimeout(()=>{ setTheme(next); }, 60);
  setTimeout(()=>{ zipperOverlay.classList.remove("show"); }, ZIP_MS);
}

(function initTheme(){
  const saved = localStorage.getItem("ndrex_theme") || "dark";
  setTheme(saved);
})();

/* NDREX V24 — locate only the top-left brand */
document.addEventListener("DOMContentLoaded", function(){
  const candidates = Array.from(document.querySelectorAll("header .logo, header .brand, nav .logo, nav .brand, .logo, .brand"));
  const el = candidates.find(x => /NDREX\s*PROJECT/i.test(x.textContent || ""));
  if (el && !el.querySelector(".ndrex-logo-text")) {
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    let n;
    while(n=walker.nextNode()){
      if(/NDREX\s*PROJECT/i.test(n.nodeValue||"")){
        const span=document.createElement("span");
        span.className="ndrex-logo-text";
        span.textContent=n.nodeValue;
        n.parentNode.replaceChild(span,n);
        break;
      }
    }
  }
});


/* NDREX V25 — social popup + admin settings, isolated from existing functions */
(function(){
  const KEY='ndrex_social_links_v25';
  const defaults=[
    {name:'Instagram',icon:'◎',url:''},
    {name:'TikTok',icon:'♪',url:''},
    {name:'WhatsApp',icon:'◉',url:''},
    {name:'Telegram',icon:'➤',url:''}
  ];
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||defaults}catch(e){return defaults}}
  function save(x){localStorage.setItem(KEY,JSON.stringify(x))}
  function render(){
    const root=document.getElementById('ndrexSocialPopup'); if(!root)return;
    const data=load();
    const list=root.querySelector('.ndrex-social-list');
    list.innerHTML=data.filter(x=>x.url).map(x=>`<a class="ndrex-social-link" href="${escapeHtml(x.url)}" target="_blank" rel="noopener"><span class="ndrex-social-icon">${escapeHtml(x.icon)}</span><span class="ndrex-social-name">${escapeHtml(x.name)}</span></a>`).join('');
  }
  function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  window.ndrexSocialAdmin=function(){
    const data=load();
    const rows=data.map((x,i)=>`<label style="display:block;font-size:11px">${escapeHtml(x.name)}<input data-social-index="${i}" value="${escapeHtml(x.url)}" placeholder="https://..."></label>`).join('');
    const wrap=document.createElement('div');
    wrap.className='ndrex-social-admin';
    wrap.innerHTML=rows+'<button type="button" id="ndrexSocialSave">Simpan Sosial Media</button>';
    return wrap;
  };
  function mount(){
    if(document.getElementById('ndrexSocialPopup')){render();return}
    const root=document.createElement('div');
    root.id='ndrexSocialPopup'; root.className='ndrex-social-popup';
    root.innerHTML=`<div class="ndrex-social-card"><div class="ndrex-social-title">Ikuti Kami</div><div class="ndrex-social-list"></div></div><button class="ndrex-social-toggle" aria-label="Sosial Media" title="Sosial Media">✦</button>`;
    document.body.appendChild(root);
    root.querySelector('.ndrex-social-toggle').onclick=()=>root.classList.toggle('open');
    render();
  }
  document.addEventListener('DOMContentLoaded',mount);
  window.ndrexSocialRender=render;
  window.ndrexSocialLoad=load;
  window.ndrexSocialSave=save;
})();



/* NDREX V26 — render social settings visibly in the Admin modal */
(function(){
  const names = [
    {name:'Instagram', icon:'◎'},
    {name:'TikTok', icon:'♪'},
    {name:'WhatsApp', icon:'◉'},
    {name:'Telegram', icon:'➤'}
  ];
  function esc2(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function renderFields(){
    const box=document.getElementById('ndrexSocialAdminFields');
    if(!box || !window.ndrexSocialLoad) return;
    const data=window.ndrexSocialLoad();
    box.innerHTML=names.map((n,i)=>{
      const row=data[i]||{name:n.name,icon:n.icon,url:''};
      return `<label class="note" style="display:block;text-align:left;margin:8px 0 4px">${n.name}</label>
      <input class="admin-input ndrex-social-url" data-social-index="${i}" type="url"
        placeholder="https://..." value="${esc2(row.url)}">`;
    }).join('');
  }
  function saveFields(){
    if(!window.ndrexSocialLoad || !window.ndrexSocialSave) return;
    const data=window.ndrexSocialLoad();
    document.querySelectorAll('.ndrex-social-url').forEach(inp=>{
      const i=Number(inp.dataset.socialIndex);
      if(!data[i]) data[i]={name:names[i].name,icon:names[i].icon,url:''};
      data[i].url=inp.value.trim();
    });
    window.ndrexSocialSave(data);
    if(window.ndrexSocialRender) window.ndrexSocialRender();
    const msg=document.getElementById('ndrexSocialSaved');
    if(msg){msg.textContent='Link sosial media tersimpan ✓'; setTimeout(()=>msg.textContent='',1800)}
  }
  document.addEventListener('DOMContentLoaded',function(){
    renderFields();
    const b=document.getElementById('ndrexSocialSave');
    if(b) b.addEventListener('click',saveFields);
  });
  window.ndrexRenderSocialAdmin=renderFields;
})();



/* NDREX V27 — populate/save the Admin social editor only */
(function(){
  const names=['Instagram','TikTok','WhatsApp','Telegram'];
  function fill(){
    if(!window.ndrexSocialLoad)return;
    const d=window.ndrexSocialLoad();
    document.querySelectorAll('.ndrex-social-url').forEach(x=>{
      const i=+x.dataset.socialIndex;
      x.value=(d[i]&&d[i].url)||'';
    });
  }
  function save(){
    if(!window.ndrexSocialLoad||!window.ndrexSocialSave)return;
    const d=window.ndrexSocialLoad();
    document.querySelectorAll('.ndrex-social-url').forEach(x=>{
      const i=+x.dataset.socialIndex;
      if(!d[i])d[i]={name:names[i],icon:'',url:''};
      d[i].url=x.value.trim();
    });
    window.ndrexSocialSave(d);
    if(window.ndrexSocialRender)window.ndrexSocialRender();
    const msg=document.getElementById('ndrexSocialSaved');
    if(msg){msg.textContent='Tersimpan ✓';setTimeout(()=>msg.textContent='',1500)}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    fill();
    const b=document.getElementById('ndrexSocialSave');
    if(b)b.addEventListener('click',save);
  });
})();

