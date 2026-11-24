# Survey v2.0 Production Plan (Architecture, Security, UX/UI & Deployment)
# خطة النسخة النهائية للإنتاج v2.0 (المعمارية، الأمان، تجربة المستخدم، والنشر)

---

## English Version

### 1. System Design & Clean MVC Architecture
To satisfy the core specification (`plans/code_artifact.md`)—fast execution both inside and outside China with zero CDN/external libraries and Python standard library only—the production codebase should be organized into a clean layered MVC structure without adding heavy server dependencies:

```text
rating_platform/
├── server.py                  # Lightweight entry point (~20 lines)
├── config.json                # Runtime config (validated at startup)
├── app/
│   ├── config.py              # Config loader + strict schema validation
│   ├── db.py                  # Model layer: SQLite WAL + synchronous=NORMAL + isolated queries
│   ├── security.py            # Security layer: Rate Limiter, CSP/Headers, Auth, Input Sanitizer
│   ├── routes.py              # Controller layer: HTTP routing & payload validation
│   └── services/
│       ├── session_service.py # Face balancing (least-shown first, cycle + swapped repeats)
│       └── analytics_service.py # Bradley-Terry MM solver, live stats, formula-safe CSV exports
├── public/                    # View layer: zero external fonts/CDN
│   ├── index.html
│   ├── admin.html
│   ├── style.css
│   ├── i18n.js                # Arabic (RTL), English (LTR), Simplified Chinese (LTR)
│   ├── api.js                 # Network client + offline queue & retry
│   └── app.js                 # Screen state machine & UX handlers
├── tools/
│   ├── prepare_faces.py       # 3-angle standardization & EXIF stripping
│   └── review_sheet.py        # Local visual thumbnail sheet to catch duplicate persons
├── deploy/                    # systemd unit, Caddyfile, backup.sh, setup_vps.sh
├── tests/                     # Unit, integration & 300+ concurrent rater load simulation
└── docs/                      # README.md, ARCHITECTURE.md, DEPLOY_GUIDE.md
```

**Capacity for 300–2000+ Participants:**
- 300 participants × 64 comparisons = 19,200 rows (~3 MB SQLite DB).
- ~48 unique faces × 32 KB ≈ 1.5 MB bandwidth per participant (~450 MB total for 300 participants).
- Production server hardening: `socket timeout (15s)`, `daemon_threads = True`, `ETag / 304 Not Modified` image caching, and `SQLite WAL + synchronous=NORMAL`.

### 2. Security Design
- **Admin Auth Protection:** Replace `?key=...` query parameter auth with an `X-Admin-Key` header login flow in `admin.html` so secrets never leak in browser history or logs, paired with brute-force lockout after 5 failed attempts.
- **In-Memory Rate Limiting:** Reverse-proxy-aware IP rate limiting (`10 sessions/hour` on `/api/rater`, `120 taps/minute` on `/api/answer`) to block automated spam while allowing shared university Wi-Fi.
- **Security Headers:** `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, plus `robots.txt` (`Disallow: /`).
- **Privacy (Zero PII) & Data Safety:** Zero names, emails, phone numbers, or IP addresses stored in SQLite; 32 KB max request body; spreadsheet formula-injection escaping (`csv_safe`) preserving negative floats.

### 3. UX / UI Hardening
- **Mobile / WeChat / iOS Safari Viewport Fit:** Strict `100dvh` layout so Candidate A and Candidate B fit completely without scrolling or cropping.
- **Tactile Selection Feedback:** Subtle ~120ms highlight flash on tap confirmation before advancing.
- **Resilient Image Loading:** Automatic retry (up to 3 attempts) on transient network drop; guard `onBothLoaded` against double-firing when images hit browser cache.
- **Form Usability & Smart Close Guard:** Scroll to first missing field with highlight; `(1/2)`–`(2/2)` feature counter; `beforeunload` warning only when unsynced local answers remain.

### 4. Phased Execution Roadmap
- **Phase 1 — Data Hygiene & Visual Deduplication:** Re-run `prepare_faces.py` after source photo cleanup and build `tools/review_sheet.py` for human visual audit of all active faces.
- **Phase 2 — Clean MVC Refactor & Security Layer:** Split `server.py` into `app/`, add rate limiting, security headers, `X-Admin-Key` admin login, `socket timeout`, and `ETag`.
- **Phase 3 — Frontend UX/UI Polish:** Split `api.js`, add image retry logic, tap feedback flash, error scroll, and WeChat/iOS layout refinements.
- **Phase 4 — Load Testing (300+ Raters), Docs & Deployment:** Add `tests/test_load.py`, write `ARCHITECTURE.md` & `DEPLOY_GUIDE.md`, and add `deploy/setup_vps.sh`.

### 5. Public Deployment Stack (300+ Participants)
- **Not Needed:** No extra MCP servers, no Docker, no Kubernetes, no PostgreSQL, no Redis, no React.
- **Required:**
  1. **Hong Kong Linux VPS (`Ubuntu 24.04`, `1 vCPU / 1 GB RAM`, ~\$5–7/month)** via **Alibaba Cloud (Hong Kong)** or **Tencent Cloud Lighthouse (Hong Kong)** for fast low-latency access in both China and the Middle East without an ICP license.
  2. **Domain Name (~\$10/year):** Point `A` record to the VPS IP (if using Cloudflare DNS, keep proxy **grey / DNS Only** so mainland China traffic connects directly; Caddy handles free automatic HTTPS).
  3. **Production Config (`config.json`):** Strong `admin_key`, final `ethics_approval_no`, and `contact_email`.

---

<div dir="rtl">

## النسخة العربية (Arabic Version)

### 1. تصميم النظام والهيكلة النظيفة (<bdo dir="ltr">`System Design & Clean MVC`</bdo>)
لتحقيق شروط المواصفات (<bdo dir="ltr">`plans/code_artifact.md`</bdo>) بالعمل السريع داخل الصين وخارجها بدون أي مكتبات خارجية أو <bdo dir="ltr">`CDN`</bdo> وبـ <bdo dir="ltr">`Python stdlib`</bdo> فقط، تُقسَّم المنصة إلى بنية <bdo dir="ltr">`MVC`</bdo> نظيفة وسهلة الصيانة:

* **طبقة الإعدادات (<bdo dir="ltr">`app/config.py`</bdo>):** قراءة <bdo dir="ltr">`config.json`</bdo> والتحقق من صحة القيم عند التشغيل.
* **طبقة البيانات / <bdo dir="ltr">`Model` (`app/db.py`)</bdo>:** قاعدة <bdo dir="ltr">`SQLite WAL`</bdo> مع <bdo dir="ltr">`synchronous=NORMAL`</bdo> وإغلاق حتمي للاتصالات.
* **طبقة الأمان (<bdo dir="ltr">`app/security.py`</bdo>):** محدد معدل الطلبات (<bdo dir="ltr">`Rate Limiter`</bdo>)، ترويسات الحماية، مصادقة المشرف، وتعقيم البيانات.
* **طبقة التحكم / <bdo dir="ltr">`Controller` (`app/routes.py`)</bdo>:** استقبال الطلبات والتحقق الصارم من المدخلات.
* **طبقة الخدمات (<bdo dir="ltr">`app/services/`</bdo>):** منطق توزيع الجلسات (الأقل ظهوراً أولاً + الدائرة + التكرار المعكوس) وحساب <bdo dir="ltr">`Bradley-Terry`</bdo> وتصدير <bdo dir="ltr">`CSV`</bdo>.
* **طبقة العرض / <bdo dir="ltr">`View` (`public/`)</bdo>:** واجهة المشارك ولوحة الباحث بدون أي ملفات خارجية.

**سعة النظام لأكثر من 300 مشارك:**
* 300 مشارك × 64 مقارنة = 19,200 سطر (~3 ميجابايت فقط في <bdo dir="ltr">`SQLite`</bdo>).
* استهلاك النقل لكل مشارك ≈ 1.5 ميجابايت (أي ~450 ميجابايت إجمالاً لـ 300 مشارك).
* تحصين الخادم عبر <bdo dir="ltr">`socket timeout (15s)`</bdo> و <bdo dir="ltr">`daemon_threads = True`</bdo> و <bdo dir="ltr">`ETag / 304`</bdo> لتسريع الصور ومنع تعليق الاتصالات البطيئة.

---

### 2. تصميم الأمان (<bdo dir="ltr">`Security Design`</bdo>)
1. **مصادقة لوحة الباحث:** استبدال تمرير المفتاح في الرابط (<bdo dir="ltr">`?key=`</bdo>) بشاشة دخول ترسل المفتاح عبر الترويسة <bdo dir="ltr">`X-Admin-Key`</bdo> مع حظر مؤقت بعد 5 محاولات فاشلة.
2. **منع الإغراق (<bdo dir="ltr">`Rate Limiting`</bdo>):** حد مدمج بالذاكرة يقرأ IP الحقيقي خلف <bdo dir="ltr">`Caddy`</bdo> (مثلاً 10 جلسات/ساعة للـ IP و 120 نقرة/دقيقة).
3. **ترويسات الحماية (<bdo dir="ltr">`HTTP Security Headers`</bdo>):** تفعيل <bdo dir="ltr">`CSP`</bdo>، <bdo dir="ltr">`X-Frame-Options: DENY`</bdo>، <bdo dir="ltr">`X-Content-Type-Options: nosniff`</bdo>، <bdo dir="ltr">`Referrer-Policy: no-referrer`</bdo>، و <bdo dir="ltr">`robots.txt`</bdo>.
4. **الخصوصية (<bdo dir="ltr">`Zero PII`</bdo>):** عدم حفظ أي أسماء أو إيميلات أو هواتف أو عناوين IP، وتحديد حجم الطلب بـ <bdo dir="ltr">`32 KB`</bdo>، وحماية ملفات <bdo dir="ltr">`CSV`</bdo> من حقن الصيغ دون تشويه الأرقام السالبة.

---

### 3. تحسينات تجربة المستخدم (<bdo dir="ltr">`UX / UI`</bdo>)
1. ضبط الارتفاع (<bdo dir="ltr">`100dvh`</bdo>) داخل متصفح <bdo dir="ltr">`WeChat`</bdo> و <bdo dir="ltr">`iOS Safari`</bdo> لظهور الصورتين <bdo dir="ltr">`A`</bdo> و <bdo dir="ltr">`B`</bdo> كاملتين دون تمرير.
2. ومضة تأكيد لمسية لطيفة (~120 مللي ثانية) عند اختيار الصورة.
3. إعادة تحميل الصورة تلقائياً حتى 3 مرات عند ضعف الشبكة، ومنع تكرار مؤقت القفل عند التحميل من الكاش.
4. التمرير التلقائي لأول سؤال ناقص في الاستبيان، وإظهار عداد <bdo dir="ltr">`(1/2)`</bdo> – <bdo dir="ltr">`(2/2)`</bdo> في سؤال الملامح، وتحذير إغلاق الصفحة فقط إذا بقيت إجابات محلية لم تُرسل بعد.

---

### 4. مراحل التنفيذ (<bdo dir="ltr">`Phases`</bdo>)
* **المرحلة 1:** تنظيف الصور وبناء أداة المعاينة البصرية (<bdo dir="ltr">`tools/review_sheet.py`</bdo>) لاكتشاف أي وجوه مكررة.
* **المرحلة 2:** إعادة الهيكلة (<bdo dir="ltr">`Clean MVC`</bdo>) وإضافة الأمان ومحدد المعدل و <bdo dir="ltr">`ETag`</bdo>.
* **المرحلة 3:** صقل الواجهة وحالات الانقطاع وتوافق الجوال و <bdo dir="ltr">`WeChat`</bdo>.
* **المرحلة 4:** اختبار محاكاة حمل **300 مشارك متزامن** (<bdo dir="ltr">`test_load.py`</bdo>)، كتابة التوثيق النهائي، وسكربت تهيئة السيرفر (<bdo dir="ltr">`setup_vps.sh`</bdo>).

---

### 5. متطلبات النشر العام لأكثر من 300 مشارك
* **غير مطلوب:** لا تحتاج أي <bdo dir="ltr">`MCP`</bdo> أو <bdo dir="ltr">`Docker`</bdo> أو <bdo dir="ltr">`PostgreSQL`</bdo> أو <bdo dir="ltr">`Redis`</bdo>.
* **المطلوب فعلاً (3 أشياء فقط):**
  1. **سيرفر <bdo dir="ltr">`VPS (Ubuntu 24.04)`</bdo> في هونغ كونغ** (<bdo dir="ltr">`1 vCPU / 1 GB RAM`</bdo>، مثل <bdo dir="ltr">`Alibaba Cloud HK`</bdo> أو <bdo dir="ltr">`Tencent Cloud Lighthouse HK`</bdo>) لسرعة الوصول داخل الصين والشرق الأوسط بدون ترخيص <bdo dir="ltr">`ICP`</bdo>.
  2. **نطاق (<bdo dir="ltr">`Domain`</bdo>)** مرتبط بعنوان السيرفر (مع إبقاء سحابة <bdo dir="ltr">`Cloudflare`</bdo> رمادية <bdo dir="ltr">`DNS Only`</bdo> إذا استُخدمت، ويتولى <bdo dir="ltr">`Caddy`</bdo> شهادة <bdo dir="ltr">`HTTPS`</bdo> تلقائياً).
  3. **بيانات الدراسة في <bdo dir="ltr">`config.json`</bdo>:** كلمة سر قوية للباحث، رقم الموافقة الأخلاقية، وبريد التواصل.

</div>
