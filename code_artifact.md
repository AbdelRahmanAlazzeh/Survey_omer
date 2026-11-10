# موقع تقييم جاذبية الوجه
Facial Attractiveness Rating Website

شرح كامل: كيف يعمل الموقع، ماذا يرى المشارك، وكيف تصل إجاباته إلى الباحث
Full walkthrough: how it works, what the participant sees, and how the answers reach the researcher

---

## فكرة الموقع
The idea

- **يرى المشارك صورتين لشخصين، ويضغط على الأكثر جاذبية**
  The participant sees two people and taps the more attractive one
- **كل شخص يظهر من 3 زوايا: جانب أيسر، أمام، جانب أيمن**
  Each person is shown from 3 angles: left • front • right
- **من آلاف الاختيارات نحسب درجة جاذبية لكل وجه (Bradley-Terry)**
  Thousands of choices $\rightarrow$ an attractiveness score per face (Bradley-Terry)
- **ثم نقارن: هل يختلف حكم المقيمين الصينيين عن الشرق أوسطيين؟**
  Then compare: do Han Chinese and Middle Eastern raters judge differently?

---

## كيف تبنى جلسة كل مشارك
How each session is built

- **138 وجها حاليا (نساء وررجال، صينيون وشرق أوسطيون)**
  138 faces now (women & men, Chinese & Middle Eastern)
- **كل مشارك يقيم جزأين: نساء ثم رجال (أو العكس عشوائيا)**
  Every participant does 2 parts: women then men (and random order)
- **في كل جزء: 24 وجها، 30 مقارنة + مقارنتان مكررتان = 64 اختبارا (~5 دقائق)**
  Per part: 24 faces, 30 pairs + 2 repeats = 64 choices (~5 min)
- **الخادم يختار أولا الوجوه الأقل ظهورا $\leftarrow$ كل الوجوه تحصل على عدد متقارب من المقارنات**
  The server picks the least-shown faces first $\leftarrow$ balanced exposure
- **المقارنان المكررتان (بتبديل الجانبين) تقيسان ثبات المشارك**
  The 2 repeated pairs (sides swapped) measure rater consistency

---

## ماذا يرى المشارك
What the participant sees

- **على الهاتف • بدون تسجيل دخول • بدون أي رمز**
  On a phone • no login • no code

### الصفحة الأولى: اللغة تختار تلقائيا حسب لغة الهاتف
First page: language is chosen automatically from the phone

- دراسة إدراك جاذبية الوجه
- حوالي 5 دقائق • مجهولة الهوية
- **معلومات الدراسة والموافقة**
  ندعوك للمشاركة في دراسة بحثية حول كيفية إدراك الناس لجاذبية الوجه. يجريها قسم الجراحة التجميلية والترميمية، مستشفى تشونجيانغ، جامعة الجنوب الطبية.
  سنرى أزواجًا من صور متطوعين بالغين، واختتر الشخص الذي تراه أكثر جاذبية. لا توجد إجابات صحيحة أو خاطئة – اعتمد على انطباعك الأول. تستغرق حوالي 5 دقائق.
  المشاركة طوعية ومجهولة الهوية. لا تجمع أسماء، أو رقم هاتفك أو أي معلومات تعرف بك، يمكنك التوقف في أي وقت بإغلاق الصفحة.
  تغرض الصور لأغراض هذا البحث. فقط يرجى عدم التقاط شحات صاشة أو مشاركتها.
  رقم الموافقة الأخلاقية: `(to be added)`
  للاستفسار: `(to be added)`

---

## شرح الدراسة والموافقة المستنيرة
Study information and informed consent

- **لا يستطيع المتابعة إلا بعد الموافقة (18 عاما أو أكثر)**
  Cannot continue without consent (18+)
- **عُمري 18 عاما أو أكثر، وقد قرأت المعلومات أعلاه، وأوافق على المشاركة**
  [ ] موافقة

---

## أسئلة قصيرة عن المشارك – كلها بالضغط
Short questions about the participant — all tap-to-answer

- **معلومات عنك**
  تساعدنا هذه الأسئلة في تحليل النتائج. جميع الإجابات مجهولة الهوية.
- **العمر (بالسنوات)**
- **الجنس:** أنثى / ذكر
- **أي مجموعة تصفك بشكل أفضل؟**
  - صيني من قومية الهان
  - صيني من قومية أخرى
  - عربي
  - فارسي / إيراني
  - تركي
  - كردي
  - من الشرق الأوسط (أخرى)
  - أخرى

---

## مكان الإقامة وسنوات العيش في الصين والشرق الأوسط
Where they live + years lived in China / the Middle East

- **أين تقيم حاليا؟**
  - البر الرئيسي للصين / هونغ كونغ / ماكو / تايوان
  - الشرق الأوسط / شمال أفريقيا
  - دولة أخرى
- **عدد السنوات التي عشتها في الصين (إن لم تعش فيها):**
- **عدد السنوات التي عشتها في الشرق الأوسط (إن لم تعش فيه):**
- **كم مرة تتعامل مع أشخاص من شرق آسيا في حياتك اليومية؟**
  أبداً / نادراً / أحياناً / كثيراً / يومياً
- **كم مرة تتعامل مع أشخاص من الشرق الأوسط في حياتك اليومية؟**
  أبداً / نادراً / أحياناً / كثيراً / يومياً
- **هل تعمل أو تدرس في الجراحة التجميلية، أو الأمراض الجلدية، أو الطب التجميلي، أو الفن، أو التصوير الاحترافي؟**
  نعم / لا
- **هل شاركت في هذه الدراسة من قبل؟**
  نعم / لا

---

## التعليمات: اضغط على الشخص الأكثر جاذبية، بالانطباع الأول
Instructions: tap the more attractive person, first impression

**طريقة المشاركة:**
1. تعرض كل شاشة شخصين، ويظهر كل شخص من ثلاث روايا: الجانب الأيسر، الأمام، والجانب الأيمن.
2. اضغط على الشخص الذي تراه أكثر جاذبية.
3. اعتمد على انطباعك الأول: تكفي عادة 5-2 ثوان لكل اختيار.
4. هناك جزئان قصيران: أحدهما للنساء والآخر للرجال.

---

## أثناء الاختبار (أمثلة وشاشات العرض)
- **الجزء 1: شخصان، كل منهما من 3 زوايا** (Part 1: two people, each from 3 angles)
- **بمجرد الضغط يُرسل الاختيار فورًا إلى الخادم ويحفظ** (Each tap is sent to the server and saved immediately)
- **شريط التقدم في الأعلى يوضح كم بقي** (The progress bar shows how much is left)
- **الجزء 1 – المقارنة 6 من 32** (Part 1 — comparison 6 of 32)
- **آخر مقارنتين في الجزء: أزواج مكررة لقياس الثبات** (Last 2 of each part: repeated pairs (consistency check))
- **استراحة قصيرة في المنتصف، ثم الجزء الثاني (الجنس الآخر)** (Short break, then part 2 (the other sex))
  *أنجزت النصف! خذ استراحة قصيرة. الجزء التالي يعرض صور النساء.*

---

## ثلاثة أسئلة أخيرة
Three final questions

- **ما ملامح الوجه التي أثرت في اختياراتك أكثر؟ (اختر حتى 2)**
  - العيان والحاجبان
  - الأنف
  - الشفتان والفم
  - الفك والذقن
  - شكل الوجه العام وتناسيه
  - البشرة
  - الشعر / شعر أخرى
- **أي زاوية نظرت إليها أكثر؟**
  - الأمامية غالباً
  - الجانبية غالباً
  - الاثنتان بالتساوي
- **ما مدى ثقتك في اختياراتك؟**
  - لست واثقا إطلاقا
  - قليلاً
  - متوسط
  - واثق
  - واثق جدًا

---

## انتهى: الإجابات محفوظة تلقائيا – لا يرسل المشارك أي شيء
Done: answers saved automatically — the participant sends nothing

- **شكرًا لك!**
  تم حفظ إجاباتك تلقائيا. ولا يلزمك أي إجراء آخر.
  يمكنك الآن إغلاق هذه الصفحة. نرجو مشاركة رابط الدراسة مع أصدقائك الراغبين في المشاركة.

---

## كيف تصل إجابات المشاركين إلى الباحث؟
How the answers reach the researcher

1. **هاتف المشارك** (Participant's phone) $\rightarrow$ كل صفطة $\leftarrow$ small message
2. **الخادم (server.py)** (The server) $\rightarrow$ يتحقق من الاختبار ويحفظه فورًا (validates & saves instantly)
3. **قاعدة البيانات (data/study.db)** (SQLite database) $\rightarrow$ جدول المشاركين + جدول الاختبارات + نسخة احتياطية يومية (raters table + trials table + daily backup)
4. **صفحة الباحث (admin.html)** (Researcher page - private key) $\rightarrow$ أرقام مباشرة + تنزيل ملفات CSV تتيح في Excel (live numbers + CSV downloads for Excel)

---

## ماذا لو انقطع الإنترنت؟
What if the connection drops?

- **كل اختيار يُحفظ لحظة الضغط – لا شيء يضيع إذا أغلق المشارك الصفحة** (Every choice is saved on tap – nothing is lost if the page is closed)
- **إذا انقطع الإنترنت: الاختيارات تنتظر في الهاتف وتُرسل عند عودة الاتصال** (If offline: choices wait on the phone and are sent back when online)
- **إذا فتح الرابط مرة أخرى: يكمل من حيث توقف** (If the link is reopened: continues where it stopped)
- **لا اسم ولا رقم هاتق – المشارك مجهول الهوية (رقم عشوائي فقط)** (No name, no phone number – anonymous (random ID only))
- **أسماء ملفات الصور رموز عشوائية – لا تكشف الجنس أو الأصل** (Image file names are random codes – reveal nothing)

---

## صفحة الباحث: كم مشاركا بدأ وأكمل، من كل مجموعة – تتحدث مباشرة
Researcher page: who started / completed, per group – live

- **Progress • 进度** (11 completed / 11 started - 已完成 / 已开始)
  - arab / female: 1 / 1
  - arab / male: 6 / 6
  - han / female: 1 / 1
  - han / male: 1 / 1
  - persian / female: 1 / 1
  - turkish / male: 1 / 1
- **Answered comparisons:** 704
- **Active faces:** F-CN: 10, F-ME: 53, M-CN: 29, M-ME: 46
- **Comparisons per face:** min 6, mean 9.6, max 30
- **Repeat-pair agreement (intra-rater reliability):** 45.5% of 44
- **Study open:** true
- **Download data - 下载数据**
  - `raters.csv`
  - `comparisons.csv`
  - `bt_scores.csv (completed raters)`
  - `bt_scores.csv (all)`
  - `faces.csv`
- **Refresh • 刷新**

---

## أزرار التنزيل: 5 ملفات بيانات جاهزة للتحليل (بيانات تجريبية هنا)
Download buttons: 5 analysis-ready files (test data shown)

### 1. `comparisons.csv` (كل ضغطة = سطر / every tap = one row)
- أعمدة: `rater_population`, `face_sex`, `left_population`, `right_population`, `winner`, `rt_ms`
- who rated, which faces, winner & loser, response time (ms)

### 2. `raters.csv` (كل مشارك = سطر / one row per participant)
- أعمدة: `population`, `sex`, `age`, `residence`, `years_china`, `years_mideast`, `post_regions`
- جميع الاستبيان كاملة، وقت الإجمال، نوع الجهاز، مصدر الرابط
- all questionnaire answers, completion time, device, link source

### 3. `bt_scores.csv` (درجة جاذبية لكل وجه / an attractiveness score per face)
- أعمدة: `code`, `face_sex`, `face_population`, `rater_group`, `bt_log_strength`, `wins`, `comparisons`
- الدرجة محسوبة لكل المقيمين مقاً، ولكل مجموعة مقيمين على حدة $\leftarrow$ هذا ما نقارنه في الرسالة
- score from all raters and from each rater group separately $\rightarrow$ the core comparison of the thesis

### 4. `faces.csv` و `bt_scores (all)`
- **faces.csv: مفتاح فك الرمز $\rightarrow$ اسم الصورة الأصلية، الجنس، الأصل (سري)** (faces.csv: decoding key — code $\rightarrow$ original photo, sex, population (private))
- هذا المفتاح يربط الدرجات بقياسات الوجه D1-D18 لاحقا (This key links scores to the D1-D18 facial measurements later)
- **bt_scores (all): نفس الدرجات لكن تشمل من لم يكمل أيضا** (bt_scores (all): same scores including participants who did not finish)

---

## التقنية والتشغيل الدائم
Technology & permanent hosting

- **Python فقط (المكتبة القياسية) – بدون مكتبات خارجية ويدعم Google أو CDN** (Python standard library only — no packages, no Google, no CDN) $\rightarrow$ So it loads the same inside and outside China
- **لذلك يعمل في الصين وخارجها بنفس السرعة**
- **يحتاج خادما يعمل دائما – الأفضل في هونغ كونغ (بدون ترخيص 备案)** (Needs an always-on server — Hong Kong is best (no ICP licence))
- **التشغيل: نسخ المجلد $\leftarrow$ systemd $\leftarrow$ Caddy $\leftarrow$ HTTPS $\leftarrow$ نسخ احتياطي يومي** (Deploy: copy folder $\rightarrow$ systemd $\rightarrow$ Caddy for HTTPS $\rightarrow$ daily backup)
- **كل خطوات الملف DEVELOPER_HANDOFF.md** (All steps are in DEVELOPER_HANDOFF.md)

---

# كيف يعمل الموقع من الداخل
How the site works inside

## بنية المجلد (Folder structure)
```text
rating_platform/
├── server.py             - the whole server (Python stdlib only)
├── config.json           - settings: admin key, pairs per rater..
├── public/               - participant page
│   ├── index.html        - participant page
│   ├── app.js            - participant logic (screens, taps, retry)
│   ├── i18n.js           - all texts: 中文 / English / العربية
│   └── style.css         - design (phone first)
├── admin.html            - researcher page
└── faces/                - processed photos f_xxxxxx.jpg
data/
├── faces.csv             - photo key (private)
└── study.db              - all answers (SQLite)
tools/prepare_faces.py    - adds / prepares photos
deploy/                   - server service, HTTPS, backup
```

### ثلاثة أجزاء فقط (Only three parts)
1. **الواجهة (public/)** (Front-end: HTML + JavaScript) $\rightarrow$ ما يراه المشارك في المتصفح – بدون أي مكتبة خارجية (what the participant sees — no external libraries)
2. **الخادم (server.py)** (Server: Python standard library) $\rightarrow$ يوزع الصور، يبني المقارنات، يحفظ الإجابات، يصدر البيانات (serves photos, builds pairs, saves answers, exports data)
3. **قاعدة البيانات (study.db)** (Database: SQLite file) $\rightarrow$ جدول raters (المشاركون) + جدول trials (كل مقارنة) (raters table + trials table)

---

## إضافة الصور (Adding photos)

### الخطوة 1: تسمية الصور (Step 1: name the photo files)
- رقم + F أو M – وإذا كان صينيا تُضاف كلمة `chinese` (`number + F/M – add the word "chinese" for Chinese faces`)
- كل صورة = شخص واحد بثلاث زوايا (جانب، أمام، جانب) (`one image = one person, 3 views (side • front • side)`)
- توضع كل الصور في مجلد واحد (`pic for test`) (`all photos go in one folder`)

### الخطوة 2: تشغيل أداة التجهيز (Step 2: run the preparation tool)
```bash
$ python tools/prepare_faces.py --src "pic for test"
```
أمر واحد يجهز كل الصور ويطبع ملخصا بعد الوجوه في كل مجموعة (`one command prepares extra photos and prints a summary per group`)

### ماذا تفعل الأداة بكل صورة؟ (What the tool does to each photo)
1. تقرأ الجنس والأصل من اسم الملف (`1. reads sex & population from the file name`)
2. تحذف الصور المكررة (بصمة الملف) (`2. removes exact duplicates (file hash) – e.g. 37M = 35M`)
3. تكشف الوجه الأمامي وتوحد حجمه في كل الصور (`3. detects the frontal face and makes its identical size in all photos`)
4. تعيد توزيع الزوايا الثلاث بمقاسات متساوية على خلفية بيضاء $1000 \times 400$ (`4. re-spaces the 3 views evenly on a white 1000 x 400 canvas`)
5. تحذف البيانات المخفية وتضغط الصورة (~35 KB) (`5. strips hidden metadata, compresses (~35 KB)`)
6. تعطي كل صورة اسما عشوائيا مثل `f_zk83xz.jpg` (`6. gives a random name like f_zk83xz.jpg`)
7. تكتب المفتاح في `data/faces.csv` (`7. writes the key into data/faces.csv`)

### قبل وبعد: لماذا نُوحد الحجم؟ (Before / after: why size is standardized)
- `15M chinese.jpg original` (في الأصل كان الوجه صغيرا وسط مساحة بيضاء كبيرة / originally the face was tiny in a lot of white space)
- `m_92c1fl.jpg processed`

### قبل وبعد: صورة أخرى (Before / after: another photo)
- `1F.jpeg original`
- `f_zk83xz.jpg processed` (لو بقيت الأحجام مختلفة، قد يختار المشارك الوجه الأكبر حجما لا الأجمل / without this, raters could pick the bigger picture, not the more attractive face)

### الملف `data/faces.csv`: مفتاح الصور (data/faces.csv: the photo key)
- أعمدة: `code`, `source_file`, `sex`, `population`, `provenance`, `status`, `note`
- يربط الاسم العشوائي بالصورة الأصلية – يبقى سريا (`links the random name to the original photo – keep private`)
- `status: active` = تظهر في الموقع (appears in site) / `excluded` = مستبعدة مع السبب (removed with reason)
- `provenance: ok` = مصدر الصورة (original source) / `ai_confirmed` = لا تحتمل الحساسية (provenance flag kept for sensitivity analysis)

---

## الخطوة 3: نقل الصور إلى الخادم (Step 3: put the photos on the server)
1. انسخ المجلد `public/faces` والملف `data/faces.csv` إلى الخادم (`copy public/faces/ and data/faces.csv to the server`)
2. أعد تشغيل الموقع: `sudo systemctl restart rating` (`restart: sudo systemctl restart rating`)
3. الصور الجديدة تظهر فورًا، والصور القديمة تحتفظ بنفس أسمائها (`new photos appear at once; old photos keep the same codes`)
4. **مهم: أضف كل الصور قبل بدء جمع البيانات الحقيقية** (`important: add all photos BEFORE real data collection starts`)

---

# طريقة عرض الصور (How photos are shown)

## عندما يضغط المشارك «أبدأ» (When the participant taps "start")
1. **الخادم يختار 24 امرأة و24 رجلًا** (server picks 24 women + 24 men) $\rightarrow$ الأقل ظهورا أولا، وبعضهم صينيون وبعضهم شرق أوسطيون (least-shown first, half Chinese, half Middle Eastern)
2. **يبني 30 مقارنة لكل جنس** (builds 30 pairs per sex) $\rightarrow$ دائرة ربط الوجوه + روابط عشوائية إضافية (a cycle linking every face + random extra links)
3. **يخلط الترتيب ويختار اليمين/اليسار عشوائيا** (shuffles order, random left/right) $\rightarrow$ ولا يظهر نفس الوجه في مقارنتين متتاليتين (no face in two consecutive pairs)
4. **يضيف مقارنتين مكررتين في نهاية كل جزء** (adds 2 repeated pairs (sides swapped)) $\rightarrow$ لقياس ثبات المشارك (to measure rater consistency)

### شكل المقارنات (مثال مبسط بـ 12 وجها) (Pair design (simplified, 12 faces))
- كل خط = مقارنة. الدائرة تضمن أن كل الوجوه مترابطة، فيمكن حساب درجة لكل وجه على مقياس واحد (`each line = one comparison. The cycle connects all faces, so every face gets a score on one common scale`)

---

## على شاشة المشارك (On the participant's screen)
- **صورتان فوق بعض (A وB) لتناسب الهاتف** (two images stacked (A/B) to fit a phone)
- **حجم الصورة يكيف مع الشاشة لنظر الاثنتان كامفتين** (size adapts so both fit on screen)
- **الضغط معطل 0.25 ثانية بعد ظهور الصور لمنع الضغط المزدوج** (taps blocked 0.25 s after loading (no double taps))
- **نسجل زمن الاستجابة من لحظة أكتمال تحميل الصورتين** (response time measured from when both images loaded)
- **منع الحفظ بالضغط المطول والسحب** (long-press save and drag are disabled)

---

## السرعة في الصين وخارجها (Speed in China and abroad)
- **كل صورة ~35 KB فقط** (`each photo is only ~35 KB`)
- **الموقع يحمل صور المقارنات الأربع التالية مسبقًا** (`the next 4 pairs are pre-loaded in the background`)
- **المتصفح يحتفظ بالصور يومًا كاملًا (cache)** (`the browser caches photos for 24 h`)
- **لا خطوط ولا مكتبات من Google أو CDN – كل شيء من الخادم نفسه** (`no Google fonts / CDN – everything comes from our own server`)
- **الخادم في هونغ كونغ = قريب من الصين والشرق الأوسط، وبدون ترخيص 备案** (`a Hong Kong server is close to both regions, no ICP licence`)

---

## الإعدادات القابلة للتغيير – `config.json` (Adjustable settings — config.json)
```json
{
  "faces_per_sex": 24,
  "pairs_per_sex": 30,
  "repeat_pairs_per_sex": 2,
  "access_code": "",
  "study_open": true,
  "ethics_approval_no": "_",
  "contact_email": "_"
}
```
*بعد أي تعديل: إعادة تشغيل الموقع (after any change: restart the service)*

---

## الخلاصة (Summary)
صور مسقاة $\leftarrow$ أداة التجهيز $\leftarrow$ `public/faces + faces.csv`
الخادم $\leftarrow$ المشارك يرى صورتين متساويتين في الحجم $\leftarrow$ كل ضغطة تُحفظ

`named photos -> prepare_faces.py -> public/faces + faces.csv -> server -> participant sees two equal-size photos -> every tap saved`

---

## شكرًا
- رابط المشاركين: `https://{النطاق}/` (Participant link)
- رابط الباحث (سري): `https://{النطاق}/admin.html?key=...` (Researcher link (private))