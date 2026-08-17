/* ==========================================================================
   MEHRAAB — shared behaviour for every route
   ========================================================================== */

/* ---- SWAP BEFORE SENDING: your own details in the footer ---- */
const DESIGNER = {
  name : "Beni · PdktDev",
  phone: "+91 XXXXX XXXXX",     // e.g. "+91 98450 12345"
  tel  : "+91XXXXXXXXXX",       // digits only
  email: "beniel.herlin@gmail.com"
};
const BUSINESS_WA = "919876543210";   // fallback target if the API is unreachable
const SCENE = "couture";

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- footer designer block ---------- */
(function designer(){
  const n=document.getElementById('d-name'), p=document.getElementById('d-phone'),
        m=document.getElementById('d-mail'), w=document.getElementById('d-wa');
  if(!n) return;
  n.textContent=DESIGNER.name;
  p.textContent=DESIGNER.phone; p.href='tel:'+DESIGNER.tel.replace(/\s/g,'');
  m.textContent=DESIGNER.email; m.href='mailto:'+DESIGNER.email;
  const digits=DESIGNER.tel.replace(/[^0-9]/g,'');
  if(w) w.href = /^\d{10,}$/.test(digits)
    ? 'https://wa.me/'+digits+'?text='+encodeURIComponent("Hi, I saw the demo site you built. Let's talk about making it live.")
    : 'mailto:'+DESIGNER.email;
})();

/* ---------- scroll reveal ---------- */
(function reveal(){
  const els=document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('in')); return; }
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:.1, rootMargin:'0px 0px -6% 0px'});
  els.forEach(el=>io.observe(el));
})();

/* ---------- nav state, mobile menu, sticky action bar ---------- */
(function chrome(){
  const nav=document.getElementById('nav'), bar=document.getElementById('bar'),
        burger=document.getElementById('burger'), menu=document.getElementById('menu');
  let ticking=false;
  function onScroll(){
    const y=scrollY;
    if(nav && !nav.classList.contains('solid')) nav.classList.toggle('scrolled', y>40);
    if(bar) bar.classList.toggle('show', y>innerHeight*.5);
    ticking=false;
  }
  addEventListener('scroll',()=>{ if(!ticking){ requestAnimationFrame(onScroll); ticking=true; } },{passive:true});
  onScroll();
  if(burger && menu){
    const toggle=o=>{
      document.body.classList.toggle('menu-open',o);
      burger.setAttribute('aria-expanded',o?'true':'false');
      menu.setAttribute('aria-hidden',o?'false':'true');
    };
    burger.addEventListener('click',()=>toggle(!document.body.classList.contains('menu-open')));
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>toggle(false)));
    addEventListener('keydown',e=>{ if(e.key==='Escape') toggle(false); });
  }
})();

/* ---------- count-up numbers (gym only; couture ships none) ---------- */
(function counters(){
  const nums=document.querySelectorAll('[data-count]');
  if(!nums.length || !('IntersectionObserver' in window)) return;
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(!e.isIntersecting) return;
      const el=e.target, end=+el.dataset.count, suf=el.dataset.suffix||'';
      io.unobserve(el);
      if(reduceMotion) return;
      let t0=null;
      const step=ts=>{
        if(!t0) t0=ts;
        const k=Math.min((ts-t0)/900,1), v=Math.round(end*(1-Math.pow(1-k,3)));
        el.textContent=v.toLocaleString('en-IN')+(k===1?suf:'');
        if(k<1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  },{threshold:.6});
  nums.forEach(n=>io.observe(n));
})();

/* ---------- ticker ---------- */
(function ticker(){
  const tr=document.getElementById('track');
  if(tr) tr.innerHTML += tr.innerHTML;
})();

/* ---------- image slots: drop anything that fails to load ---------- */
(function media(){
  document.querySelectorAll('.tile img').forEach(img=>{
    const ok=()=>img.classList.add('ok');
    if(img.complete && img.naturalWidth>0) ok(); else img.addEventListener('load',ok,{once:true});
    img.addEventListener('error',()=>img.remove(),{once:true});
  });
})();

/* ==========================================================================
   ANIMATED HERO CANVAS
   Fixed, full-bleed, drawn in JS. Sections below are opaque and scroll over it.
   The loop stops whenever the hero leaves the viewport or the tab is hidden.
   ========================================================================== */
(function heroCanvas(){
  const cv=document.getElementById('scene');
  if(!cv) return;
  const ctx=cv.getContext('2d');
  let W=0,H=0,dpr=1,raf=null,running=false,t=0;

  function size(){
    dpr=Math.min(devicePixelRatio||1,2);
    W=cv.clientWidth; H=cv.clientHeight;
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  size(); addEventListener('resize',size,{passive:true});

  /* ---- deterministic pseudo-random so the loop looks designed, not noisy ---- */
  const rnd=(i,s)=>{ const x=Math.sin(i*127.1+s*311.7)*43758.5453; return x-Math.floor(x); };

  /* ---------- gym: equaliser rig, chalk dust, scanning light ---------- */
  function gym(){
    ctx.fillStyle='#0E1013'; ctx.fillRect(0,0,W,H);

    // scanning light sweep
    const sx=((t*0.045)%1.5-0.25)*W;
    const g=ctx.createRadialGradient(sx,H*0.42,0,sx,H*0.42,Math.max(W,H)*0.55);
    g.addColorStop(0,'rgba(255,77,20,0.13)'); g.addColorStop(1,'rgba(255,77,20,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    // faint floor grid
    ctx.strokeStyle='rgba(255,255,255,0.035)'; ctx.lineWidth=1;
    for(let i=0;i<14;i++){ const y=H*0.55+i*i*2.2; if(y>H) break;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // the rig — bars pulsing like a lift tempo
    const N=Math.max(14,Math.round(W/64)), gap=W/N, base=H*0.98;
    for(let i=0;i<N;i++){
      const ph=rnd(i,3)*6.28, sp=0.9+rnd(i,4)*1.5;
      const amp=(0.16+rnd(i,5)*0.34)*H;
      const h=amp*(0.45+0.55*Math.abs(Math.sin(t*sp+ph)));
      const x=i*gap+gap*0.22, w=gap*0.56;
      const grd=ctx.createLinearGradient(0,base-h,0,base);
      grd.addColorStop(0,'rgba(255,77,20,0.72)');
      grd.addColorStop(0.35,'rgba(255,77,20,0.14)');
      grd.addColorStop(1,'rgba(255,77,20,0)');
      ctx.fillStyle=grd; ctx.fillRect(x,base-h,w,h);
      ctx.fillStyle='rgba(255,138,90,0.85)'; ctx.fillRect(x,base-h,w,2);
    }

    // chalk dust
    const P=70, span=H+140;
    for(let i=0;i<P;i++){
      const y=((rnd(i,1)*span - t*(12+rnd(i,2)*26)) % span + span) % span - 60;
      const x=rnd(i,6)*W + Math.sin(t*0.6+i)*14;
      const r=0.6+rnd(i,7)*1.9;
      ctx.fillStyle=`rgba(235,238,242,${0.06+rnd(i,8)*0.20})`;
      ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill();
    }

    // vignette
    const v=ctx.createRadialGradient(W*0.5,H*0.5,Math.min(W,H)*0.25,W*0.5,H*0.5,Math.max(W,H)*0.78);
    v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.75)');
    ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  }

  /* ---------- couture: silk ribbons drifting in still air ---------- */
  function couture(){
    ctx.fillStyle='#F7F3EC'; ctx.fillRect(0,0,W,H);

    const bands=[
      {c:'107,18,32', a:0.10, y:0.34, amp:0.085, len:1.5, sp:0.055, th:0.30},
      {c:'176,141,79', a:0.13, y:0.48, amp:0.105, len:1.1, sp:0.041, th:0.20},
      {c:'107,18,32', a:0.06, y:0.62, amp:0.075, len:1.9, sp:0.033, th:0.34},
      {c:'176,141,79', a:0.09, y:0.74, amp:0.120, len:0.8, sp:0.048, th:0.16}
    ];
    bands.forEach((b,bi)=>{
      const th=H*b.th;
      for(let layer=0;layer<3;layer++){
        ctx.beginPath();
        const off=layer*th*0.34, ph=t*b.sp*6.283+bi*1.7+layer*0.5;
        ctx.moveTo(-20,H*b.y+off);
        for(let x=-20;x<=W+20;x+=14){
          const u=x/W*6.283*b.len;
          const y=H*b.y+off+Math.sin(u+ph)*H*b.amp+Math.sin(u*0.5-ph*0.7)*H*b.amp*0.4;
          ctx.lineTo(x,y);
        }
        ctx.lineTo(W+20,H+40); ctx.lineTo(-20,H+40); ctx.closePath();
        const g=ctx.createLinearGradient(0,H*b.y-th,0,H*b.y+th);
        g.addColorStop(0,`rgba(${b.c},0)`);
        g.addColorStop(0.45,`rgba(${b.c},${b.a*(1-layer*0.28)})`);
        g.addColorStop(1,`rgba(${b.c},0)`);
        ctx.fillStyle=g; ctx.fill();
      }
    });

    // gold dust caught in the light
    const P=48, span=H+120;
    for(let i=0;i<P;i++){
      const y=((rnd(i,1)*span - t*(4+rnd(i,2)*9)) % span + span) % span - 60;
      const x=rnd(i,6)*W + Math.sin(t*0.25+i)*20;
      const r=0.7+rnd(i,7)*1.5;
      ctx.fillStyle=`rgba(176,141,79,${0.10+rnd(i,8)*0.30})`;
      ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill();
    }

    // light from the top-left, the way a fitting room window falls
    const g2=ctx.createRadialGradient(W*0.18,-H*0.1,0,W*0.18,-H*0.1,Math.max(W,H)*0.9);
    g2.addColorStop(0,'rgba(255,255,255,0.55)'); g2.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);
  }

  const draw=()=> SCENE==='gym' ? gym() : couture();

  function frame(ts){
    t = ts/1000;
    draw();
    raf = running ? requestAnimationFrame(frame) : null;
  }
  function start(){ if(running||reduceMotion) return; running=true; raf=requestAnimationFrame(frame); }
  function stop(){ running=false; if(raf) cancelAnimationFrame(raf); raf=null; }

  draw();                              // always paint one frame
  if(reduceMotion) return;             // …and stop there if motion is unwelcome
  start();

  const hero=document.getElementById('hero');
  if(hero && 'IntersectionObserver' in window){
    new IntersectionObserver(([e])=>{ e.isIntersecting ? start() : stop(); },{threshold:0.01}).observe(hero);
  }
  addEventListener('visibilitychange',()=>{ document.hidden ? stop() : start(); });
})();

/* ==========================================================================
   ENQUIRY FORM  →  posts to the endpoint in the form's action attribute
   Falls back to WhatsApp with the message pre-filled if the API is unreachable.
   ========================================================================== */
(function enquiry(){
  const form=document.getElementById('enq');
  if(!form) return;
  const msgBox=document.getElementById('formmsg');
  const btn=form.querySelector('button[type=submit]');
  const show=(type,text)=>{ msgBox.className='formmsg '+type; msgBox.textContent=text; };

  /* ?plan=Unlimited or ?type=Bridal from the cards on other pages */
  const q=new URLSearchParams(location.search);
  ['plan','type','collection'].forEach(key=>{
    const val=q.get(key); if(!val) return;
    const sel=form.querySelector('[name='+key+']');
    if(sel && [...sel.options].some(o=>o.value===val)) sel.value=val;
    const ta=form.querySelector('[name=message]');
    if(ta && !ta.value) ta.value=form.dataset.prefill ? form.dataset.prefill.replace('{v}',val) : '';
  });

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    const name=(data.name||'').trim(), phone=(data.phone||'').trim();
    form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
    const digits=phone.replace(/\D/g,'');
    if(!name || digits.length<10){
      if(!name) form.querySelector('[name=name]').setAttribute('aria-invalid','true');
      if(digits.length<10) form.querySelector('[name=phone]').setAttribute('aria-invalid','true');
      show('err','Please add your name and a phone number we can call back on.');
      return;
    }
    btn.disabled=true; const label=btn.textContent; btn.textContent='Sending…';
    try{
      const res=await fetch(form.getAttribute('action'),{
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
      const out=await res.json().catch(()=>({}));
      if(!res.ok || !out.ok) throw new Error(out.error||'Request failed');
      show('ok', form.dataset.success.replace('{name}',name).replace('{phone}',phone));
      form.reset();
    }catch(err){
      const text=`Hi, I'd like to enquire.%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0A${encodeURIComponent(data.message||'')}`;
      show('err','Couldn’t reach the server just now — opening WhatsApp so your message still gets through.');
      open(`https://wa.me/${BUSINESS_WA}?text=${text}`,'_blank','noopener');
    }finally{ btn.disabled=false; btn.textContent=label; }
  });
})();
