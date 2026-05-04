# fantrove-banner

# Headless Low-Code Banner Engine

Low-Code Management System with Real-Time Preview — Strategic Blueprint 2026

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Fantrove (Cloudflare Pages)       Banner Engine (Vercel)   │
│                                                             │
│  home/index.html                   /api/banners          ← admin │
│  <div data-banner="slug">    ────► /api/public/banners/slug  │
│  assets/js/banner-engine.js        /api/publish/id           │
│                                    /banners  ← dashboard    │
│  Cloudflare CDN ◄──── purge ───── bannerService.ts          │
└─────────────────────────────────────────────────────────────┘
         ▲                                    ▼
         └──────── JSON config only ──────── Supabase
                   (Zero JS injection)       banners table
                                             banner_audit_logs
```

**Stack:** Next.js 15 (App Router) + Supabase (PostgreSQL + Storage) + Cloudflare CDN + Vercel

---

## Quick Start

### 1. Supabase Setup

1. สร้าง project ใหม่ที่ [supabase.com](https://supabase.com)
2. เปิด **SQL Editor** แล้วรัน `supabase/schema.sql`
3. รัน `supabase/seed.sql` สำหรับ dev data (optional)
4. คัดลอก **Project URL** และ **service_role key** จาก Settings → API

### 2. Clone & Install

```bash
git clone <this-repo>
cd banner-engine
npm install
cp .env.example .env.local
# แก้ค่าใน .env.local ทุกบรรทัด
```

### 3. Run Dashboard

```bash
npm run dev
# เปิด http://localhost:3000/banners
```

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
# ตั้งค่า Environment Variables เดียวกับ .env.example ใน Vercel Dashboard
```

---

## Fantrove Integration

### Step 1: Copy SDK to Fantrove

```bash
# วางไฟล์นี้ใน Fantrove repo
cp assets/js/banner-engine.js <fantrove-repo>/assets/js/banner-engine.js
```

### Step 2: แก้ URL ใน banner-engine.js

เปิดไฟล์ `assets/js/banner-engine.js` แล้วแก้บรรทัดนี้:

```js
var BANNER_ENGINE_URL = (
  global.__BANNER_ENGINE_URL ||
  'https://your-banner-engine.vercel.app'  // ← เปลี่ยนเป็น Vercel URL จริง
);
```

### Step 3: เพิ่ม Script ใน home/index.html

```html
<!-- เพิ่มก่อน </body> (หลัง scripts อื่นๆ) -->
<script defer src="/assets/js/banner-engine.js?v=1.0.0"></script>
```

### Step 4: วาง Banner Mount Points

```html
<!-- ในส่วนที่ต้องการแสดง banner -->
<div data-banner="welcome-banner"></div>

<!-- หรือในหน้าอื่นๆ -->
<div data-banner="sale-countdown"></div>
```

### Step 5: JS Effects บน Fantrove

banner-engine.js รัน JS effects ที่ฝั่ง Fantrove โดยอัตโนมัติ — ไม่ต้องเพิ่มโค้ดใดๆ เพิ่มเติม effects ทั้งหมดถูก hardcode ใน `JS_TRIGGERS` ใน banner-engine.js แล้ว

**Preset ที่มี:**
| Key | Effect |
|-----|--------|
| `confetti` | Confetti burst เมื่อ banner โหลด |
| `shake` | Shake เมื่อ hover |
| `pulse` | Glowing pulse animation |
| `scroll_reveal` | Fade in เมื่อ scroll มาถึง |
| `bounce` | Bounce เมื่อโหลด |
| `glow` | Glowing border |

### การใช้ JavaScript API

```js
// Manual mount
BannerEngine.mount('#my-element', 'welcome-banner');

// Force refresh ทุก banner (bypass cache)
BannerEngine.refresh();

// Destroy timers (สำหรับ SPA — เรียกตอน unmount page)
BannerEngine.destroy();
```

---

## Development Workflow

```
Design                Preview               Publish              Live
──────                ───────               ───────              ────
เลือก Component  ──► ตรวจสอบ Mobile/     ──► บันทึกลง         ──► CDN อัปเดต
และปรับ Style      Desktop แบบ Real-time     Supabase และ         และส่งแบนเนอร์
ผ่าน Admin UI                               ส่ง Purge Signal      ใหม่สู่ผู้ใช้
```

1. **Design** — เปิด `/banners/new` หรือ `/banners/[id]`
2. **Preview** — ดู Live Preview ทั้ง Desktop/Mobile ด้านขวา
3. **Save** — กด Save (บันทึกเป็น Draft, ไม่กระทบ production)
4. **Publish** — กด Publish → ระบบ:
   - บันทึก Audit Log
   - Mark `is_published = true` ใน Supabase
   - ส่ง Purge signal ไปยัง Cloudflare CDN
5. **Live** — Fantrove ได้รับ config ใหม่ภายใน 60 วินาที

---

## Data Model

| Data Key | Logic Type | Config Format | Update Strategy |
|----------|-----------|---------------|-----------------|
| `banner_styles` | Custom CSS | Raw Text/String | CDN Purge on Save |
| `button_config` | Component UI | JSON Object | Stale-While-Revalidate |
| `image_assets` | Media Storage | URL (Supabase S3) | Lazy Load on Client |
| `js_trigger` | Client Preset | Function Key | Hardcoded Logic |

---

## Security Standards

- **Zero Injected Scripts** — DB เก็บเฉพาะ JSON config และ preset key ไม่มี JS จริงใน DB
- **Supabase RLS** — Row Level Security จำกัดสิทธิ์เฉพาะ service_role เท่านั้น
- **API Validation** — Domain Whitelist ใน `allowed_domains` field
- **Audit Logs** — บันทึกทุก mutation ก่อน execute
- **Bearer Auth** — Admin API ทุก route ต้องผ่าน `withAuth` middleware

---

## File Structure

```
banner-engine/
├── supabase/
│   ├── schema.sql              # Database schema + RLS
│   └── seed.sql                # Dev seed data
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx      # Dashboard shell + sidebar
│   │   │   └── banners/
│   │   │       ├── page.tsx            # Banner list
│   │   │       ├── new/page.tsx        # Create banner
│   │   │       └── [id]/
│   │   │           ├── page.tsx        # Edit banner
│   │   │           ├── BannerEditorClient.tsx
│   │   │           └── audit/page.tsx  # Audit log
│   │   ├── api/
│   │   │   ├── banners/
│   │   │   │   ├── route.ts            # GET list, POST create
│   │   │   │   └── [id]/route.ts       # GET, PATCH, DELETE
│   │   │   ├── publish/
│   │   │   │   └── [id]/route.ts       # POST publish, DELETE unpublish
│   │   │   └── public/
│   │   │       └── banners/[slug]/route.ts  # Public CDN-cached API
│   │   └── globals.css
│   ├── features/banner-editor/
│   │   ├── components/
│   │   │   ├── BannerEditor.tsx        # Main editor layout
│   │   │   ├── ButtonFactory.tsx       # CTA button configurator
│   │   │   ├── CountdownEditor.tsx     # Countdown timer
│   │   │   ├── SliderEditor.tsx        # Image slider
│   │   │   ├── StylePicker.tsx         # CSS + JS trigger picker
│   │   │   └── LivePreview.tsx         # WYSIWYG iframe preview
│   │   ├── hooks/
│   │   │   └── useBannerEditor.ts      # Editor state + API calls
│   │   └── services/
│   │       └── bannerService.ts        # All DB operations + audit
│   └── shared/
│       ├── lib/
│       │   ├── env.ts                  # Validated env vars
│       │   ├── db.ts                   # Supabase service-role client
│       │   └── cloudflare.ts           # CDN purge helper
│       ├── middleware/
│       │   └── withAuth.ts             # Bearer token auth HOC
│       └── types/
│           ├── banner.ts               # Domain types
│           └── database.ts             # Supabase generated types
├── assets/js/
│   └── banner-engine.js        # Client SDK → deploy to Fantrove
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Adding a New JS Trigger Preset

1. เพิ่มใน `JS_TRIGGER_PRESETS` array ใน `src/shared/types/banner.ts`:
   ```ts
   export const JS_TRIGGER_PRESETS = [
     ...existing,
     'my_new_effect',  // ← เพิ่มที่นี่
   ] as const;
   ```

2. เพิ่ม function ใน `JS_TRIGGERS` object ใน `assets/js/banner-engine.js`:
   ```js
   var JS_TRIGGERS = {
     ...existing,
     my_new_effect: function(bannerEl) {
       // DOM manipulation only — no eval, no innerHTML JS
       bannerEl.style.animation = '...';
     },
   };
   ```

3. เพิ่ม metadata ใน `TRIGGER_META` ใน `src/features/banner-editor/components/StylePicker.tsx`

4. Deploy banner-engine.js ใหม่ไปที่ Fantrove