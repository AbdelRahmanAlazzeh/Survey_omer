/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT FOR SURVEY RESPONSES WITH VISUAL IMAGES EMBEDDED
 * كود استقبال النتائج في Google Sheets مع عرض الصور المصغرة والروابط مباشرة
 * ==============================================================================
 *
 * 📌 لتحديث الكود في جدولك الحالي (Update in 1 Minute):
 * 1. افتح جدول Google Sheet الخاص بك.
 * 2. من القائمة العلوية: Extensions (الإضافات) -> Apps Script.
 * 3. استبدل الكود الموجود بهذا الكود كاملاً.
 * 4. اضغط حفظ (Save) 💾.
 * 5. اضغط Deploy -> Manage deployments -> اضغط على علامة القلم ✏️ (Edit).
 * 6. اختر Version: New version واضغط Deploy.
 *
 * النتيجة: ستظهر الصور الفعلية لكل فائز مباشرة داخل خلايا الجدول مع روابط للمعاينة الكبيرة!
 * ==============================================================================
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // إعداد عناوين الأعمدة وتنسيق الجدول التلقائي إذا كان فارغاً
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "التاريخ والوقت\nTimestamp",
        "اسم المشارك\nParticipant Name",
        "العمر\nAge",
        "الجنس\nGender",
        "المحاولة\nAttempt",
        "صورة إناث عرب\nArab Female",
        "صورة ذكور عرب\nArab Male",
        "صورة ذكور صينيين\nChinese Male",
        "صورة إناث صينيات\nChinese Female",
        "روابط الصور المباشرة (عالية الدقة)\nDirect Image Links",
        "وقت البدء والانتهاء\nDuration",
        "إجمالي القرارات\nDecisions"
      ]);
      
      // تنسيق السطر الأول كعنوان جذاب
      var headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setFontWeight("bold")
                 .setBackground("#1e293b")
                 .setFontColor("#ffffff")
                 .setHorizontalAlignment("center")
                 .setVerticalAlignment("middle");
      sheet.setRowHeight(1, 45);
      
      // تعيين عرض مناسب للأعمدة لعرض الصور بوضوح
      sheet.setColumnWidth(1, 160); // Timestamp
      sheet.setColumnWidth(2, 160); // Name
      sheet.setColumnWidth(3, 70);  // Age
      sheet.setColumnWidth(4, 80);  // Gender
      sheet.setColumnWidth(5, 70);  // Attempt
      sheet.setColumnWidth(6, 110); // Arab Female Image
      sheet.setColumnWidth(7, 110); // Arab Male Image
      sheet.setColumnWidth(8, 110); // Chinese Male Image
      sheet.setColumnWidth(9, 110); // Chinese Female Image
      sheet.setColumnWidth(10, 240); // Direct Links
      sheet.setColumnWidth(11, 160); // Duration
      sheet.setColumnWidth(12, 90);  // Total Decisions
    }

    var data = JSON.parse(e.postData.contents);
    var rawBase = "https://raw.githubusercontent.com/AbdelRahmanAlazzeh/Survey_omer/main/assets/images";

    var afNum = data.winnerArabFemale || "";
    var amNum = data.winnerArabMale || "";
    var cmNum = data.winnerChineseMale || "";
    var cfNum = data.winnerChineseFemale || "";

    var afUrl = afNum ? (rawBase + "/arab_female/" + afNum + ".jpg") : "";
    var amUrl = amNum ? (rawBase + "/arab_male/" + amNum + ".jpg") : "";
    var cmUrl = cmNum ? (rawBase + "/chinese_male/" + cmNum + ".jpg") : "";
    var cfUrl = cfNum ? (rawBase + "/chinese_female/" + cfNum + ".jpg") : "";

    // استخدام صيغة =IMAGE لعرض الصورة مباشرة داخل الخلية في إكسل
    var afCell = afUrl ? ('=IMAGE("' + afUrl + '", 1)') : "N/A";
    var amCell = amUrl ? ('=IMAGE("' + amUrl + '", 1)') : "N/A";
    var cmCell = cmUrl ? ('=IMAGE("' + cmUrl + '", 1)') : "N/A";
    var cfCell = cfUrl ? ('=IMAGE("' + cfUrl + '", 1)') : "N/A";

    var linksText = [
      afNum ? ("إناث عرب #" + afNum + ": " + afUrl) : "",
      amNum ? ("ذكور عرب #" + amNum + ": " + amUrl) : "",
      cmNum ? ("ذكور صينيين #" + cmNum + ": " + cmUrl) : "",
      cfNum ? ("إناث صينيات #" + cfNum + ": " + cfUrl) : ""
    ].filter(Boolean).join("\n");

    var startTimeStr = data.startTime ? new Date(data.startTime).toLocaleTimeString() : "";
    var endTimeStr = data.endTime ? new Date(data.endTime).toLocaleTimeString() : "";
    var durationStr = (startTimeStr && endTimeStr) ? (startTimeStr + " ➔ " + endTimeStr) : (startTimeStr || "N/A");

    // إضافة سطر الإجابة
    sheet.appendRow([
      new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }),
      data.participantName || data.participantId || "Anonymous",
      data.participantAge || data.age || "N/A",
      data.gender || "N/A",
      "#" + (data.attemptNumber || 1),
      afCell,
      amCell,
      cmCell,
      cfCell,
      linksText,
      durationStr,
      data.totalDecisions || 124
    ]);

    // تكبير ارتفاع سطر النتائج لتظهر الصور المصغرة بحجم واضح
    var newRow = sheet.getLastRow();
    sheet.setRowHeight(newRow, 90);
    
    // محاذاة النص في منتصف الخلية
    sheet.getRange(newRow, 1, 1, 12).setVerticalAlignment("middle").setHorizontalAlignment("center");

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Response recorded with images" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Visual Survey Webhook is active and rendering image thumbnails!");
}
