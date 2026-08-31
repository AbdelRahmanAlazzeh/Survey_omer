/**
 * Survey Configuration Settings
 * إعدادات استبيان تفضيل ومقارنة الصور
 */

const SURVEY_CONFIG = {
  // عنوان الاستبيان
  title: {
    ar: "استبيان التفضيل البصري",
    en: "Visual Preference Survey"
  },

  // صيغ الصور المدعومة للبحث التلقائي
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],

  // رابط Google Apps Script Webhook لاستقبال البيانات في Google Sheets
  googleSheetWebhookUrl: "https://script.google.com/macros/s/AKfycbzfksdMmWwYL2FrwtCJglXINhmtRVg05i9-Y1Ul78crM7UBriyx7FgnUSNlVgiK19b3/exec",

  // رمز المرور السري للوحة الإدارة (Admin PIN)
  adminPin: "2026",

  // الفئات الأربعة مع عدد الصور الفعلي ونوع النسبة البصرية (landscape أو portrait)
  categories: [
    {
      id: "arab_female",
      titleAr: "إناث - الشرق الأوسط / عرب",
      titleEn: "Middle Eastern / Arab Females",
      descAr: "اختر الصورة الأفضل في كل جولة مقارنة حتى نصل للصورة الفائزة في هذه الفئة.",
      descEn: "Select the preferred image in each round until the final champion is determined.",
      folder: "assets/images/arab_female",
      badgeColor: "#ec4899", // وردي
      totalImages: 42,
      aspectRatioType: "portrait"
    },
    {
      id: "arab_male",
      titleAr: "ذكور - الشرق الأوسط / عرب",
      titleEn: "Middle Eastern / Arab Males",
      descAr: "اختر الصورة الأفضل في كل جولة مقارنة حتى نصل للصورة الفائزة في هذه الفئة.",
      descEn: "Select the preferred image in each round until the final champion is determined.",
      folder: "assets/images/arab_male",
      badgeColor: "#3b82f6", // أزرق
      totalImages: 18,
      aspectRatioType: "portrait"
    },
    {
      id: "chinese_male",
      titleAr: "ذكور - صينيين",
      titleEn: "Chinese Males",
      descAr: "اختر الصورة الأفضل في كل جولة مقارنة حتى نصل للصورة الفائزة في هذه الفئة.",
      descEn: "Select the preferred image in each round until the final champion is determined.",
      folder: "assets/images/chinese_male",
      badgeColor: "#8b5cf6", // بنفسجي
      totalImages: 36,
      aspectRatioType: "landscape"
    },
    {
      id: "chinese_female",
      titleAr: "إناث - صينيات",
      titleEn: "Chinese Females",
      descAr: "اختر الصورة الأفضل في كل جولة مقارنة حتى نصل للصورة الفائزة في هذه الفئة.",
      descEn: "Select the preferred image in each round until the final champion is determined.",
      folder: "assets/images/chinese_female",
      badgeColor: "#10b981", // زمردي
      totalImages: 32,
      aspectRatioType: "landscape"
    }
  ],

  // إعدادات إضافية
  settings: {
    enableKeyboardShortcuts: true,
    persistProgressLocally: true,
    enableZoomPreview: true
  }
};

// إتاحة الكائن في النطاق العام
window.SURVEY_CONFIG = SURVEY_CONFIG;
