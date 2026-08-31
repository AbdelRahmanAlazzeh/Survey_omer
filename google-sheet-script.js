function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // إعداد الترويسة إذا كان الجدول فارغاً
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "التاريخ والوقت",
        "اسم المشارك",
        "الجنس",
        "العمر",
        "Arab Female Winner (إناث عرب)",
        "Arab Male Winner (ذكور عرب)",
        "Chinese Male Winner (ذكور صينيين)",
        "Chinese Female Winner (إناث صينيات)",
        "Start Time",
        "End Time",
        "Total Decisions",
        "المحاولة (Attempt)"
      ]);
      
      var headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setFontWeight("bold")
                 .setBackground("#1e293b")
                 .setFontColor("#ffffff")
                 .setHorizontalAlignment("center")
                 .setVerticalAlignment("middle");
      sheet.setRowHeight(1, 45);
      
      sheet.setColumnWidth(1, 160); // Timestamp
      sheet.setColumnWidth(2, 160); // Name
      sheet.setColumnWidth(3, 80);  // Gender
      sheet.setColumnWidth(4, 70);  // Age
      sheet.setColumnWidth(5, 110); // Arab Female Image
      sheet.setColumnWidth(6, 110); // Arab Male Image
      sheet.setColumnWidth(7, 110); // Chinese Male Image
      sheet.setColumnWidth(8, 110); // Chinese Female Image
      sheet.setColumnWidth(9, 160); // Start Time
      sheet.setColumnWidth(10, 160); // End Time
      sheet.setColumnWidth(11, 90);  // Decisions
      sheet.setColumnWidth(12, 80);  // Attempt
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

    // إدراج الصور المصغرة داخل خلايا الجدول مباشرة
    var afCell = afUrl ? ('=IMAGE("' + afUrl + '", 1)') : "N/A";
    var amCell = amUrl ? ('=IMAGE("' + amUrl + '", 1)') : "N/A";
    var cmCell = cmUrl ? ('=IMAGE("' + cmUrl + '", 1)') : "N/A";
    var cfCell = cfUrl ? ('=IMAGE("' + cfUrl + '", 1)') : "N/A";

    // إضافة سطر الإجابة متطابقاً تماماً مع عناوين الأعمدة (12 عمود)
    sheet.appendRow([
      new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }), // Col 1: Timestamp
      data.participantName || data.participantId || "Anonymous",       // Col 2: Name
      data.gender || "N/A",                                           // Col 3: Gender
      data.participantAge || data.age || "N/A",                       // Col 4: Age
      afCell,                                                         // Col 5: Arab Female Winner
      amCell,                                                         // Col 6: Arab Male Winner
      cmCell,                                                         // Col 7: Chinese Male Winner
      cfCell,                                                         // Col 8: Chinese Female Winner
      data.startTime || "",                                           // Col 9: Start Time
      data.endTime || "",                                             // Col 10: End Time
      data.totalDecisions || 124,                                     // Col 11: Total Decisions
      "#" + (data.attemptNumber || 1)                                  // Col 12: Attempt
    ]);

    var newRow = sheet.getLastRow();
    sheet.setRowHeight(newRow, 90);
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
