/* ============ API HELPER ============ */
const TOKEN_KEY="ndrex_token";
let adminToken=localStorage.getItem(TOKEN_KEY)||null;
async function api(path,{method="GET",body}={}){
  const headers={"Content-Type":"application/json"};
  if(adminToken) headers["Authorization"]="Bearer "+adminToken;
  const res=await fetch(path,{method,headers,body:body?JSON.stringify(body):undefined});
  let data=null; try{data=await res.json()}catch{}
  if(!res.ok) throw new Error((data&&data.error)||("HTTP_"+res.status));
  return data;
}
function esc(x){return String(x??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}

/* ============ STATE ============ */
let apps=[];
let socialLinks=[];

async function loadProducts(){
  try{ apps=await api("/api/products"); }catch(e){ apps=[]; }
}
async function loadSocial(){
  try{ socialLinks=await api("/api/social"); }catch(e){ socialLinks=[]; }
}

/* ===== TYPING INTRO ===== */
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

/* ===== PRODUCT GRID ===== */
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
    const active=tiers.filter(x=>x&&x.stock).length;
    const stockState=!tiers.length||active===0?"HABIS":(active<tiers.length?"TERBATAS":"TERSEDIA");
    const stockClass=stockState.toLowerCase();
    const b=document.createElement("button");
    b.className="product-card";
    b.onclick=()=>openTiers(a.id);
    b.innerHTML=`
      <div class="icon${a.image?" has-image":""}">${a.image?`<img src="${esc(a.image)}" alt="${esc(a.name)}">`:esc((a.name||"?")[0])}</div>
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

/* ===== TIER / ORDER / PAYMENT ===== */
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
    b.disabled=!x.stock;
    b.innerHTML=`<span>${esc(x.name)}</span><span class="tier-price">${esc(x.price)}${x.stock?"":" • HABIS"}</span>`;
    if(x.stock) b.onclick=()=>openOrder(a,x);
    l.appendChild(b);
  });
}

function openOrder(app,tier){
  selectedOrder={appId:app.id,product:app.name,tier:tier.name,price:tier.price};
  closeModal();
  document.getElementById("orderProduct").textContent=app.name;
  document.getElementById("orderTier").textContent=tier.name;
  document.getElementById("orderPrice").textContent=tier.price;
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

function confirmPayment(){
  const message = encodeURIComponent(
    "Halo admin NDREX PROJECT, saya ingin konfirmasi pembelian. Saya sudah melakukan pembayaran dan akan mengirimkan bukti pembayaran."
  );
  window.open("https://wa.me/6285715559734?text=" + message, "_blank");
}

/* ===== ADMIN LOGIN (via API) ===== */
function openAdminLogin(){
  document.getElementById("adminPassword").value="";
  const u=document.getElementById("adminUsername"); if(u) u.value="";
  document.getElementById("adminError").textContent="";
  modal("adminLoginModal");
}
function closeAdminLogin(){document.getElementById("adminLoginModal").classList.remove("show")}

async function loginAdmin(){
  const uEl=document.getElementById("adminUsername");
  const username=(uEl?uEl.value:"admin").trim()||"admin";
  const password=document.getElementById("adminPassword").value;
  try{
    const data=await api("/api/login",{method:"POST",body:{username,password}});
    adminToken=data.token;
    localStorage.setItem(TOKEN_KEY,adminToken);
    document.getElementById("adminError").textContent="";
    closeAdminLogin();
    await renderAdmin();
    modal("adminModal");
  }catch(e){
    document.getElementById("adminError").textContent="Username atau password salah.";
  }
}
function closeAdmin(){document.getElementById("adminModal").classList.remove("show")}
function logoutAdmin(){ adminToken=null; localStorage.removeItem(TOKEN_KEY); closeAdmin(); }

/* ===== ADMIN: PRODUCT + TIER MANAGEMENT ===== */
async function renderAdmin(){
  const c=document.getElementById("adminProducts");
  c.innerHTML="";
  if(!apps.length){
    c.innerHTML=`<p class="note">Belum ada aplikasi. Klik "+ Tambah Aplikasi" di bawah.</p>`;
  }
  apps.forEach((a)=>{
    const s=document.createElement("div");
    s.className="admin-section";
    s.innerHTML=`
      <div class="admin-app-head">
        <div class="admin-app-fields">
          <input class="aa-name" placeholder="Nama aplikasi" value="${esc(a.name)}">
          <div class="admin-app-sub">
            <input class="aa-cat" placeholder="Kategori" value="${esc(a.category||"")}">
            <input class="aa-image" placeholder="Nama file gambar (opsional)" value="${esc(a.image||"")}">
          </div>
        </div>
        <button type="button" class="app-delete" title="Hapus aplikasi">×</button>
      </div>
      <input class="aa-desc" placeholder="Deskripsi singkat (mis. Basic • VIP)" value="${esc(a.description||"")}">
      <button type="button" class="copy-btn full aa-save">SIMPAN PRODUK INI</button>
      <div class="tier-edit-list"></div>
      <button type="button" class="add-tier-btn">+ Tambah Tier</button>
    `;
    const tierWrap=s.querySelector(".tier-edit-list");
    (a.tiers||[]).forEach((t)=>{
      const row=document.createElement("div");
      row.className="admin-row";
      row.innerHTML=`<input class="an" value="${esc(t.name)}" placeholder="Nama tier"><input class="ap" value="${esc(t.price)}" placeholder="Harga"><label class="admin-stock"><input type="checkbox" class="as" ${t.stock?"checked":""}> STOK</label><button type="button" class="tier-save">✓</button><button type="button" class="tier-delete">×</button>`;
      row.querySelector(".tier-save").onclick=()=>saveTier(t.id,row);
      row.querySelector(".tier-delete").onclick=()=>deleteTier(t.id);
      tierWrap.appendChild(row);
    });
    c.appendChild(s);

    s.querySelector(".aa-save").onclick=()=>saveProduct(a.id,s);
    s.querySelector(".app-delete").onclick=()=>deleteProduct(a.id);
    s.querySelector(".add-tier-btn").onclick=()=>addTier(a.id);
  });
  renderSocialAdminFields();
}

function flashSaved(){
  const el=document.getElementById("adminSaved");
  if(el){ el.textContent="Tersimpan ✓"; setTimeout(()=>el.textContent="",1500); }
}

async function saveProduct(id,section){
  const name=section.querySelector(".aa-name").value;
  const category=section.querySelector(".aa-cat").value;
  const image=section.querySelector(".aa-image").value;
  const description=section.querySelector(".aa-desc").value;
  try{
    await api("/api/products",{method:"PUT",body:{id,name,category,image,description,status:"active"}});
    await loadProducts(); await renderAdmin(); renderProductGrid();
    flashSaved();
  }catch(e){ alert("Gagal simpan: "+e.message); }
}

async function deleteProduct(id){
  if(!confirm("Hapus produk ini?")) return;
  try{ await api("/api/products",{method:"DELETE",body:{id}}); await loadProducts(); await renderAdmin(); renderProductGrid(); }
  catch(e){ alert("Gagal hapus: "+e.message); }
}

async function addNewApp(){
  try{
    await api("/api/products",{method:"POST",body:{name:"PRODUK BARU",description:"",category:"PRODUK",status:"active"}});
    await loadProducts(); await renderAdmin(); renderProductGrid();
    const sections=document.querySelectorAll(".admin-section");
    sections[sections.length-1]?.scrollIntoView({behavior:"smooth",block:"center"});
  }catch(e){ alert("Gagal tambah aplikasi: "+e.message); }
}

async function addTier(productId){
  try{
    await api("/api/tiers",{method:"POST",body:{product_id:productId,name:"TIER BARU",price:"0",stock:true}});
    await loadProducts(); await renderAdmin(); renderProductGrid();
  }catch(e){ alert("Gagal tambah tier: "+e.message); }
}

async function saveTier(tierId,row){
  const name=row.querySelector(".an").value;
  const price=row.querySelector(".ap").value;
  const stock=row.querySelector(".as").checked;
  try{
    await api("/api/tiers",{method:"PUT",body:{id:tierId,name,price,stock}});
    await loadProducts(); await renderAdmin(); renderProductGrid();
    flashSaved();
  }catch(e){ alert("Gagal simpan tier: "+e.message); }
}

async function deleteTier(tierId){
  if(!confirm("Hapus tier ini?")) return;
  try{ await api("/api/tiers",{method:"DELETE",body:{id:tierId}}); await loadProducts(); await renderAdmin(); renderProductGrid(); }
  catch(e){ alert("Gagal hapus tier: "+e.message); }
}

/* Kompatibilitas tombol lama di index.html */
async function saveAdminData(){ flashSaved(); }
async function resetAdminData(){ await loadProducts(); await renderAdmin(); renderProductGrid(); }

/* ===== RESELLER (belum tersambung ke backend baru) ===== */
function openResellerLogin(){
  document.getElementById("resellerPassword").value="";
  document.getElementById("resellerError").textContent="";
  modal("resellerLoginModal");
}
function closeResellerLogin(){document.getElementById("resellerLoginModal").classList.remove("show")}
function loginReseller(){
  document.getElementById("resellerError").textContent="Fitur reseller belum aktif di versi ini.";
}
function closeResellerPanel(){document.getElementById("resellerModal").classList.remove("show")}

document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeOrder();closePayment();closeAdminLogin();closeAdmin();closeResellerLogin();closeResellerPanel()}})

/* ===== SOCIAL MEDIA (via API) ===== */
function renderSocialPopup(){
  const root=document.getElementById("ndrexSocialPopup");
  if(!root) return;
  const list=root.querySelector(".ndrex-social-list");
  list.innerHTML=socialLinks.filter(x=>x.enabled&&x.url).map(x=>
    `<a class="ndrex-social-link" href="${esc(x.url)}" target="_blank" rel="noopener"><span class="ndrex-social-name">${esc(x.platform)}</span></a>`
  ).join("");
}
function mountSocialPopup(){
  if(document.getElementById("ndrexSocialPopup")) return;
  const root=document.createElement("div");
  root.id="ndrexSocialPopup"; root.className="ndrex-social-popup";
  root.innerHTML=`<div class="ndrex-social-card"><div class="ndrex-social-title">Ikuti Kami</div><div class="ndrex-social-list"></div></div><button class="ndrex-social-toggle" aria-label="Sosial Media" title="Sosial Media">✦</button>`;
  document.body.appendChild(root);
  root.querySelector(".ndrex-social-toggle").onclick=()=>root.classList.toggle("open");
}
function renderSocialAdminFields(){
  const names=["Instagram","TikTok","WhatsApp","Telegram"];
  document.querySelectorAll(".ndrex-social-url").forEach(inp=>{
    const i=Number(inp.dataset.socialIndex);
    const found=socialLinks.find(x=>x.platform===names[i]);
    inp.value=found?found.url:"";
  });
}
async function saveSocialFields(){
  const names=["Instagram","TikTok","WhatsApp","Telegram"];
  try{
    for(const inp of document.querySelectorAll(".ndrex-social-url")){
      const i=Number(inp.dataset.socialIndex);
      await api("/api/social",{method:"POST",body:{platform:names[i],url:inp.value.trim(),enabled:true}});
    }
    await loadSocial(); renderSocialPopup();
    const msg=document.getElementById("ndrexSocialSaved");
    if(msg){ msg.textContent="Link sosial media tersimpan ✓"; setTimeout(()=>msg.textContent="",1800); }
  }catch(e){ alert("Gagal simpan sosial media: "+e.message); }
}
document.addEventListener("DOMContentLoaded",function(){
  mountSocialPopup();
  const b=document.getElementById("ndrexSocialSave");
  if(b) b.addEventListener("click",saveSocialFields);
});

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
  const savedTheme = localStorage.getItem("ndrex_theme");
  setTheme(savedTheme === "light" ? "light" : "dark");
})();
