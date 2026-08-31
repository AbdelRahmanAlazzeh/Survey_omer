/**
 * Survey Configuration Settings
 * إعدادات استبيان تصفية ومقارنة الصور
 */

const SURVEY_CONFIG = {
  // عنوان الاستبيان
  title: {
    ar: "استبيان المفاضلة والاختيار البصري",
    en: "Visual Preference & Selection Survey"
  },
  
  // عدد الصور في كل قسم
  imagesPerCategory: 35,
  
  // صيغ الصور المدعومة للبحث التلقائي
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],

  // رابط Google Apps Script Webhook لاستقبال البيانات في Google Sheets
  // ضع الرابط الخاص بك هنا بعد نشره كما هو موضح في ملف google-sheet-script.js
  googleSheetWebhookUrl: "",

  // الفئات الأربعة
  categories: [
    {
      id: "arab_female",
      titleAr: "إناث - الشرق الأوسط / عرب",
      titleEn: "Middle Eastern / Arab Females",
      descAr: "اختر الصورة الأفضل في كل جولة مقارنة حتى نصل للصورة الفائزة في هذه الفئة.",
      descEn: "Select the preferred image in each round until the final champion is determined.",
      folder: "assets/images/arab_female",
      badgeColor: "#ec4899", // وردي
      totalImages: 35
    },
    {
      id: "arab_male",
      titleAr: "ذكور - الشرق الأوسط / عرب",
      titleEn: "Middle Eastern / Arab Males",
      descAr: "اختر الصورة الأفضل في كل جولة مقارنة حتى نصل للصورة الفائزة في هذه الفئة.",
      descEn: "Select the preferred image in each round until the final champion is determined.",
      folder: "assets/images/arab_male",
      badgeColor: "#3b82f6", // أزرق
      totalImages: 35
    },
    {
      id: "chinese_male",
      titleAr: "ذكور - صينيين",
      titleEn: "Chinese Males",
      descAr: "اختر الصورة الأفضل في كل جولة مقارنة حتى نصل للصورة الفائزة في هذه الفئة.",
      descEn: "Select the preferred image in each round until the final champion is determined.",
      folder: "assets/images/chinese_male",
      badgeColor: "#8b5cf6", // بنفسجي
      totalImages: 35
    },
    {
      id: "chinese_female",
      titleAr: "إناث - صينيات",
      titleEn: "Chinese Females",
      descAr: "اختر الصورة الأفضل في كل جولة مقارنة حتى نصل للصورة الفائزة في هذه الفئة.",
      descEn: "Select the preferred image in each round until the final champion is determined.",
      folder: "assets/images/chinese_female",
      badgeColor: "#10b981", // زمردي
      totalImages: 35
    }
  ],

  // إعدادات إضافية
  settings: {
    // تفعيل الاختصارات من لوحة المفاتيح (1/2 أو الأسهم)
    enableKeyboardShortcuts: true,
    // حفظ التقدم مؤقتاً في متصفح المستخدم
    persistProgressLocally: true,
    // إمكانية تكبير الصورة للمعاينة الدقيقة
    enableZoomPreview: true
  }
};

// إتاحة الكائن في النطاق العام
window.SURVEY_CONFIG = SURVEY_CONFIG;
