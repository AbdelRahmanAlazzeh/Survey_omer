/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT FOR SURVEY RESPONSES (WEBHOOK BACKEND)
 * كود الربط التلقائي لاستقبال نتائج الاستبيان في جدول بيانات جوجل (Google Sheet)
 * ==============================================================================
 *
 * 📌 خطوات التفعيل في دقيقتين فقط (Setup Instructions):
 *
 * 1. افتح جدول بيانات جديد في Google Sheets (https://sheets.new).
 * 2. من القائمة العلوية اضغط على: Extensions (الإضافات) -> Apps Script.
 * 3. امسح أي كود موجود هناك، وانسخ الكود الموجود في هذا الملف كاملاً والصقه هناك.
 * 4. اضغط على زر حفظ (Save) 💾.
 * 5. اضغط على زر Deploy (نشر) بالأعلى واختر "New deployment" (نشر جديد).
 * 6. اختر نوع النشر: "Web app" (تطبيق ويب).
 * 7. اضبط الإعدادات كالتالي:
 *    - Description: Survey Webhook
 *    - Execute as: Me (حسابك)
 *    - Who has access: Anyone (أي شخص - لكي يتمكن المتصفح من إرسال البيانات دون تسجيل دخول).
 * 8. اضغط Deploy ووافق على الصلاحيات المطلوبة (Authorize access).
 * 9. انسخ رابط "Web app URL" وضعه في ملف config.js داخل المتغير: googleSheetWebhookUrl.
 *
 * مبروك! الآن أي مقيم ينهي الاستبيان ستظهر إجابته والـ 4 صور الفائزة تلقائياً في السطر التالي فوراً!
 * ==============================================================================
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // إعداد عناوين الأعمدة تلقائياً إذا كان الجدول فارغاً
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Participant ID",
        "Gender",
        "Age",
        "Arab Female Winner (إناث عرب)",
        "Arab Male Winner (ذكور عرب)",
        "Chinese Male Winner (ذكور صينيين)",
        "Chinese Female Winner (إناث صينيات)",
        "Start Time",
        "End Time",
        "Total Decisions",
        "Full Details JSON"
      ]);
      // تنسيق السطر الأول كعنوان
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
    }

    var data = JSON.parse(e.postData.contents);

    // إضافة سطر جديد ببيانات المقيّم
    sheet.appendRow([
      new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }),
      data.participantId || "N/A",
      data.gender || "N/A",
      data.age || "N/A",
      data.winnerArabFemale || "",
      data.winnerArabMale || "",
      data.winnerChineseMale || "",
      data.winnerChineseFemale || "",
      data.startTime || "",
      data.endTime || "",
      data.totalDecisions || 136,
      JSON.stringify(data.detailedHistory || [])
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Response recorded" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Visual Survey Webhook is active and running!");
}
