// Path:    src/features/banner-editor/lib/templateLibrary.ts
// Purpose: Template presets derived from the Banner Training Library PDF.
//          Each template provides a complete HTML + CSS starting point for
//          'full' editor mode. Users can pick one and freely modify from there.
// Used by: FullHtmlEditor.tsx

export interface BannerTemplate {
  id:          string;
  name:        string;
  category:    'support' | 'promo' | 'alert' | 'info' | 'grid';
  description: string;
  icon:        string;
  html:        string;   // full HTML from root element
  css:         string;   // complete CSS (not scoped)
}

// ── Base CSS reset shared across templates ────────────────────────────────────
const BASE_RESET = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Inter,system-ui,-apple-system,sans-serif;font-size:14px;}
a{text-decoration:none;}
img{max-width:100%;display:block;}
`.trim();

// ── Shared button utility classes ─────────────────────────────────────────────
const BTN_BASE = `
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:999px;font-weight:600;font-size:14px;text-decoration:none;border:2px solid transparent;cursor:pointer;transition:opacity .15s,transform .12s;white-space:nowrap;}
.btn:hover{opacity:.88;transform:translateY(-1px);}
.btn-primary{background:#13b47f;color:#fff;border-color:#13b47f;}
.btn-dark{background:#111827;color:#fff;border-color:#111827;}
.btn-outline{background:transparent;color:#111827;border-color:#d1d5db;}
.btn-outline:hover{border-color:#111827;}
.btn-danger{background:#ef4444;color:#fff;border-color:#ef4444;}
.btn-white{background:#fff;color:#111827;border-color:#fff;}
.btn-lg{padding:14px 28px;font-size:15px;}
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const SUPPORT_BTN_RIGHT: BannerTemplate = {
  id: 'support-btn-right',
  name: 'Support — Button Right',
  category: 'support',
  description: 'Icon + text left, CTA button pinned to the right',
  icon: '☕',
  html: `<div class="banner-wrap">
  <div class="banner-icon-slot">
    <img src="https://via.placeholder.com/64" alt="Icon" class="banner-icon-img" />
  </div>
  <div class="banner-text-slot">
    <span class="banner-title">Support the Developer</span>
    <span class="banner-desc">Buy us a coffee to keep the platform running</span>
  </div>
  <div class="banner-action-slot">
    <a href="#" class="btn btn-primary">Support Now ♥</a>
  </div>
</div>`,
  css: `${BASE_RESET}
${BTN_BASE}

.banner-wrap{
  display:flex;
  align-items:center;
  gap:16px;
  padding:20px 24px;
  background:#fff;
  border-radius:16px;
  box-shadow:0 2px 16px rgba(0,0,0,.07);
}

.banner-icon-slot{
  flex-shrink:0;
  width:72px; height:72px;
  background:#f5f5f5;
  border-radius:12px;
  overflow:hidden;
  display:flex; align-items:center; justify-content:center;
}
.banner-icon-img{width:100%;height:100%;object-fit:cover;}

.banner-text-slot{flex:1; display:flex; flex-direction:column; gap:4px;}
.banner-title{font-size:16px;font-weight:700;color:#111827;}
.banner-desc{font-size:13px;color:#6b7280;}

.banner-action-slot{flex-shrink:0;}

@media(max-width:560px){
  .banner-wrap{flex-direction:column;align-items:flex-start;}
  .banner-action-slot{width:100%;}
  .banner-action-slot .btn{width:100%;justify-content:center;}
}`,
};

const SUPPORT_BTN_LEFT: BannerTemplate = {
  id: 'support-btn-left',
  name: 'Support — Button Left',
  category: 'support',
  description: 'CTA button on the left, icon + text on the right. Dashed border style.',
  icon: '🚀',
  html: `<div class="banner-wrap">
  <div class="banner-action-slot">
    <a href="#" class="btn btn-dark">Join Community</a>
  </div>
  <div class="banner-icon-slot">
    <span style="font-size:36px">🚀</span>
  </div>
  <div class="banner-text-slot">
    <span class="banner-title">Level Up Our Platform</span>
    <span class="banner-desc">Be part of the next era of banner innovation</span>
  </div>
</div>`,
  css: `${BASE_RESET}
${BTN_BASE}

.banner-wrap{
  display:flex;
  align-items:center;
  gap:16px;
  padding:20px 24px;
  background:#fff;
  border-radius:16px;
  border:2px dashed #3b82f6;
}

.banner-icon-slot{
  flex-shrink:0;
  width:72px; height:72px;
  background:#eff6ff;
  border-radius:12px;
  display:flex; align-items:center; justify-content:center;
}

.banner-text-slot{flex:1; display:flex; flex-direction:column; gap:4px;}
.banner-title{font-size:16px;font-weight:700;color:#111827;}
.banner-desc{font-size:13px;color:#6b7280;}

.banner-action-slot{flex-shrink:0;}

@media(max-width:560px){
  .banner-wrap{flex-direction:column;}
  .banner-action-slot{width:100%; order:-1;}
  .banner-action-slot .btn{width:100%;justify-content:center;}
}`,
};

const PROGRESS_TRACKER: BannerTemplate = {
  id: 'progress-tracker',
  name: 'Progress Tracker',
  category: 'info',
  description: 'Shows milestone progress with animated fill bar and percentage',
  icon: '📊',
  html: `<div class="banner-wrap">
  <div class="banner-header">
    <span class="banner-title">Current Milestone</span>
    <span class="banner-pct">75%</span>
  </div>
  <div class="banner-bar-track">
    <div class="banner-bar-fill" style="width:75%"></div>
  </div>
  <p class="banner-desc">Only 25% more to unlock AI Template Generation!</p>
</div>`,
  css: `${BASE_RESET}

.banner-wrap{
  padding:24px 28px;
  background:#fff;
  border-radius:16px;
  box-shadow:0 2px 16px rgba(0,0,0,.07);
  display:flex;
  flex-direction:column;
  gap:12px;
}

.banner-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
}

.banner-title{font-size:15px;font-weight:700;color:#111827;}
.banner-pct{font-size:22px;font-weight:800;color:#3b82f6;}

.banner-bar-track{
  width:100%;
  height:10px;
  background:#e5e7eb;
  border-radius:999px;
  overflow:hidden;
}

.banner-bar-fill{
  height:100%;
  background:linear-gradient(90deg,#3b82f6,#60a5fa);
  border-radius:999px;
  transition:width .6s cubic-bezier(.4,0,.2,1);
}

.banner-desc{font-size:13px;color:#6b7280;}`,
};

const HIGH_IMPACT_PROMO: BannerTemplate = {
  id: 'high-impact-promo',
  name: 'High-Impact Promo',
  category: 'promo',
  description: 'Big headline flash sale with badge, large CTA, and optional image',
  icon: '⚡',
  html: `<div class="banner-wrap">
  <div class="banner-content">
    <span class="banner-badge">LIMITED OFFER</span>
    <h1 class="banner-headline">FLASH SALE</h1>
    <h2 class="banner-subheadline">70% OFF</h2>
    <p class="banner-desc">Transform your site today with our premium banner toolkit at a special price</p>
    <a href="#" class="btn btn-dark btn-lg">Get Started Now</a>
  </div>
  <div class="banner-image-slot">
    <img src="https://via.placeholder.com/340x220" alt="Promo visual" />
  </div>
</div>`,
  css: `${BASE_RESET}
${BTN_BASE}

.banner-wrap{
  display:flex;
  align-items:center;
  gap:32px;
  padding:32px 36px;
  background:#f8fafc;
  border-radius:20px;
}

.banner-content{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:10px;
}

.banner-badge{
  display:inline-block;
  padding:4px 12px;
  background:#fef3c7;
  color:#92400e;
  font-size:11px;
  font-weight:800;
  letter-spacing:.08em;
  border-radius:999px;
}

.banner-headline{
  font-size:clamp(28px,5vw,48px);
  font-weight:900;
  line-height:1;
  color:#111827;
}

.banner-subheadline{
  font-size:clamp(22px,4vw,38px);
  font-weight:900;
  line-height:1;
  color:#3b82f6;
}

.banner-desc{font-size:14px;color:#6b7280;max-width:360px;}

.banner-image-slot{flex-shrink:0; max-width:340px;}
.banner-image-slot img{border-radius:12px;}

@media(max-width:640px){
  .banner-wrap{flex-direction:column;}
  .banner-image-slot{display:none;}
}`,
};

const MULTI_OPTION_GRID: BannerTemplate = {
  id: 'multi-option-grid',
  name: 'Multi-Option Support Grid',
  category: 'grid',
  description: '3-column tier cards with icon, title, description, and individual CTAs',
  icon: '🃏',
  html: `<div class="banner-grid">
  <div class="grid-card">
    <span class="grid-icon">🍩</span>
    <span class="grid-title">Standard</span>
    <p class="grid-desc">Support with snacks and coffee for the team</p>
    <a href="#" class="btn btn-outline">Donate $5</a>
  </div>
  <div class="grid-card grid-card--featured">
    <span class="grid-icon">💎</span>
    <span class="grid-title">Premium</span>
    <p class="grid-desc">Help unlock high-speed server performance</p>
    <a href="#" class="btn btn-dark">Donate $25</a>
  </div>
  <div class="grid-card">
    <span class="grid-icon">🏛</span>
    <span class="grid-title">Enterprise</span>
    <p class="grid-desc">Become a core partner in platform development</p>
    <a href="#" class="btn btn-outline">Contact Us</a>
  </div>
</div>`,
  css: `${BASE_RESET}
${BTN_BASE}

.banner-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:16px;
}

.grid-card{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:12px;
  padding:28px 20px;
  background:#fff;
  border-radius:16px;
  border:2px solid #e5e7eb;
  text-align:center;
  transition:border-color .15s,box-shadow .15s;
}
.grid-card:hover{border-color:#d1d5db;box-shadow:0 4px 20px rgba(0,0,0,.06);}

.grid-card--featured{
  border-color:#111827;
  box-shadow:0 4px 20px rgba(0,0,0,.1);
}

.grid-icon{font-size:32px;}
.grid-title{font-size:16px;font-weight:700;color:#111827;}
.grid-desc{font-size:13px;color:#6b7280;line-height:1.5;}

.grid-card .btn{margin-top:auto;width:100%;justify-content:center;}

@media(max-width:640px){
  .banner-grid{grid-template-columns:1fr;}
}`,
};

const SERVICE_ALERT: BannerTemplate = {
  id: 'service-alert',
  name: 'Service Alert',
  category: 'alert',
  description: 'Centered alert bar with icon, message, and CTA. Ideal for maintenance notices.',
  icon: '🔔',
  html: `<div class="banner-alert">
  <span class="alert-icon">⚠️</span>
  <span class="alert-msg">System maintenance in 3 hours. Please save your work.</span>
  <a href="#" class="btn btn-danger">Learn More</a>
</div>`,
  css: `${BASE_RESET}
${BTN_BASE}

.banner-alert{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:12px;
  flex-wrap:wrap;
  padding:14px 24px;
  background:#fef2f2;
  border-radius:12px;
  border:1px solid #fecaca;
}

.alert-icon{font-size:20px;flex-shrink:0;}
.alert-msg{font-size:14px;font-weight:600;color:#b91c1c;flex:1;min-width:200px;}

@media(max-width:480px){
  .banner-alert{flex-direction:column;text-align:center;}
  .banner-alert .btn{width:100%;justify-content:center;}
}`,
};

// Gradient hero variant
const GRADIENT_HERO: BannerTemplate = {
  id: 'gradient-hero',
  name: 'Gradient Hero',
  category: 'promo',
  description: 'Full-width dark gradient with heading, body text, and dual CTA buttons',
  icon: '🌊',
  html: `<div class="banner-wrap">
  <div class="banner-body">
    <h2 class="banner-title">Ready to Level Up?</h2>
    <p class="banner-desc">Join thousands of developers building with our banner platform</p>
    <div class="banner-actions">
      <a href="#" class="btn btn-white">Get Started</a>
      <a href="#" class="btn btn-ghost">Learn More</a>
    </div>
  </div>
</div>`,
  css: `${BASE_RESET}
${BTN_BASE}

.btn-ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.4);}
.btn-ghost:hover{background:rgba(255,255,255,.1);}

.banner-wrap{
  padding:36px 40px;
  background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);
  border-radius:20px;
  position:relative;
  overflow:hidden;
}

.banner-wrap::before{
  content:'';
  position:absolute;
  inset:0;
  background:radial-gradient(ellipse at 70% 50%,rgba(59,130,246,.15) 0%,transparent 70%);
  pointer-events:none;
}

.banner-body{
  position:relative;
  display:flex;
  flex-direction:column;
  gap:14px;
  max-width:480px;
}

.banner-title{font-size:clamp(20px,3.5vw,32px);font-weight:800;color:#fff;line-height:1.2;}
.banner-desc{font-size:14px;color:rgba(255,255,255,.7);line-height:1.6;}
.banner-actions{display:flex;gap:12px;flex-wrap:wrap;}

@media(max-width:480px){
  .banner-wrap{padding:24px 20px;}
  .banner-actions{flex-direction:column;}
  .banner-actions .btn{width:100%;justify-content:center;}
}`,
};

// ── Export ────────────────────────────────────────────────────────────────────
export const TEMPLATE_LIBRARY: BannerTemplate[] = [
  SUPPORT_BTN_RIGHT,
  SUPPORT_BTN_LEFT,
  PROGRESS_TRACKER,
  HIGH_IMPACT_PROMO,
  MULTI_OPTION_GRID,
  SERVICE_ALERT,
  GRADIENT_HERO,
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all',     label: 'ทั้งหมด' },
  { id: 'support', label: 'Support' },
  { id: 'promo',   label: 'Promo'   },
  { id: 'alert',   label: 'Alert'   },
  { id: 'info',    label: 'Info'    },
  { id: 'grid',    label: 'Grid'    },
] as const;