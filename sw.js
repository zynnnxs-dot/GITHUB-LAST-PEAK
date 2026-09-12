const CACHE = "ndrex-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./qris.jpg",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
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

