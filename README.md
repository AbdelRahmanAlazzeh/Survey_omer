# 👑 استبيان المفاضلة والاختيار البصري (King of the Hill Visual Survey)

تطبيق ويب تفاعلي حديث وفاخر مصمم لإجراء دراسات واستبيانات المفاضلة والتفضيل البصري للوجوه عبر 4 فئات مختلفة، بنظام التصفية الزوجية (**King of the Hill Tournament**)، وجاهز للنشر المباشر عبر **GitHub Pages** واستيعاب أكثر من 300+ مقيّم مع حفظ البيانات في **Google Sheets**.

---

## 🌟 الفئات الأربعة (4 Face Categories)
1. **إناث - الشرق الأوسط / عرب** (`assets/images/arab_female/`)
2. **ذكور - الشرق الأوسط / عرب** (`assets/images/arab_male/`)
3. **ذكور - صينيين** (`assets/images/chinese_male/`)
4. **إناث - صينيات** (`assets/images/chinese_female/`)

---

## 🖼️ كيفية إضافة الصور (How to Add Images)
كل ما عليك هو وضع صورك الـ 35 لكل فئة داخل المجلد المخصص لها في مسار `assets/images/`:
- الفئة الأولى: `assets/images/arab_female/` وضع الصور بأرقام: `1.jpg`, `2.jpg`, ..., `35.jpg`.
- الفئة الثانية: `assets/images/arab_male/` وضع الصور بأرقام: `1.jpg`, `2.jpg`, ..., `35.jpg`.
- الفئة الثالثة: `assets/images/chinese_male/` وضع الصور بأرقام: `1.jpg`, `2.jpg`, ..., `35.jpg`.
- الفئة الرابعة: `assets/images/chinese_female/` وضع الصور بأرقام: `1.jpg`, `2.jpg`, ..., `35.jpg`.

> 💡 **ملاحظة:** التطبيق يدعم صيغ `.jpg`, `.png`, `.webp`. وإذا لم تقم بإضافة الصور بعد، سيعرض التطبيق تلقائياً صوراً بديلة تفاعلية (SVG Placeholders) مرقمة بأناقة لتجربة النظام فوراً!

---

## 📊 ربط الاستبيان مع Google Sheets (لحفظ بيانات أكثر من 300 مقيّم مجاناً)
1. افتح جدول بيانات جديد في [Google Sheets](https://sheets.new).
2. اضغط على القائمة: **Extensions** (الإضافات) ⬅️ **Apps Script**.
3. افتح الملف [`google-sheet-script.js`](./google-sheet-script.js) الموجود في المشروع، وانسخ الكود بالكامل والصقه في نافذة Apps Script.
4. اضغط **Save** 💾 ثم اضغط **Deploy** ⬅️ **New deployment**.
5. اختر نوع النشر: **Web app**، واجعل الخيار **Who has access** = **Anyone**.
6. اضغط **Deploy** وانسخ الرابط الناتج (**Web app URL**).
7. افتح ملف [`config.js`](./config.js) وضع الرابط داخل المتغير:
   ```javascript
   googleSheetWebhookUrl: "ضع الرابط هنا"
   ```

---

## 🚀 النشر على GitHub Pages (Deployment Guide)
1. ارفع ملفات هذا المستودع إلى GitHub عبر الأمر:
   ```bash
   git add .
   git commit -m "Initial commit for Visual Survey"
   git push origin main
   ```
2. ادخل على صفحة المستودع في GitHub، واضغط على **Settings** ⚙️.
3. من القائمة الجانبية اليسرى، اختر **Pages**.
4. تحت قسم **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** اختر `main` واجعل المجلد `/(root)`
5. اضغط **Save**.
6. خلال دقيقة سيظهر لك رابط الموقع الحي جاهزاً ومتاحاً لمشاركته مع المشاركين والمقيمين! 🎉

---

## ✨ المميزات الرئيسية
- ⚡ **سريع وخفيف جداً:** مبني بدون أي أطر عمل ثقيلة (Zero dependencies) ليعمل بأعلى سرعة على الهواتف والحواسيب.
- 🌐 **دعم كامل للغتين:** العربية (RTL) والإنجليزية (LTR) مع تبديل فوري وحفظ الخيار.
- 🌓 **وضع مظلم وفاتح:** Dark & Light Mode بتصميم Glassmorphism حديث ومريح للعين.
- ⌨️ **دعم اختصارات لوحة المفاتيح:** التقييم السريع عبر الأسهم (⬅️ / ➡️) أو الأرقام (1 و 2).
- 🔍 **معاينة مكبرة (Zoom Modal):** فحص تفاصيل ملامح الوجه بدقة عالية قبل اتخاذ القرار.
- 📥 **تصدير محلي:** تنزيل تقارير CSV و JSON مباشرة تحسباً لأي انقطاع في الاتصال.
