function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Setup header on first run
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "التاريخ والوقت",
        "اسم المشارك",
        "العمر",
        "الجنس",
        "المحاولة",
        "صورة إناث عرب",
        "صورة ذكور عرب",
        "صورة ذكور صينيين",
        "صورة إناث صينيات",
        "🔗 تقرير الويب البصري (نقرة واحدة)",
        "وقت البدء والانتهاء",
        "إجمالي القرارات"
      ]);
      
      var headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setFontWeight("bold")
                 .setBackground("#1e293b")
                 .setFontColor("#ffffff")
                 .setHorizontalAlignment("center")
                 .setVerticalAlignment("middle");
      sheet.setRowHeight(1, 45);
      
      sheet.setColumnWidth(1, 160);
      sheet.setColumnWidth(2, 160);
      sheet.setColumnWidth(3, 70);
      sheet.setColumnWidth(4, 80);
      sheet.setColumnWidth(5, 70);
      sheet.setColumnWidth(6, 110);
      sheet.setColumnWidth(7, 110);
      sheet.setColumnWidth(8, 110);
      sheet.setColumnWidth(9, 110);
      sheet.setColumnWidth(10, 260);
      sheet.setColumnWidth(11, 160);
      sheet.setColumnWidth(12, 90);
    }

    var data = JSON.parse(e.postData.contents);
    var rawBase = "https://raw.githubusercontent.com/AbdelRahmanAlazzeh/Survey_omer/main/assets/images";
    var pagesBase = "https://abdelrahmanalazzeh.github.io/Survey_omer";

    var afNum = data.winnerArabFemale || "";
    var amNum = data.winnerArabMale || "";
    var cmNum = data.winnerChineseMale || "";
    var cfNum = data.winnerChineseFemale || "";
    var pName = data.participantName || data.participantId || "Anonymous";
    var pAge = data.participantAge || data.age || "";

    var afUrl = afNum ? (rawBase + "/arab_female/" + afNum + ".jpg") : "";
    var amUrl = amNum ? (rawBase + "/arab_male/" + amNum + ".jpg") : "";
    var cmUrl = cmNum ? (rawBase + "/chinese_male/" + cmNum + ".jpg") : "";
    var cfUrl = cfNum ? (rawBase + "/chinese_female/" + cfNum + ".jpg") : "";

    // إدراج الصور المصغرة داخل خلايا الإكسل
    var afCell = afUrl ? ('=IMAGE("' + afUrl + '", 1)') : "N/A";
    var amCell = amUrl ? ('=IMAGE("' + amUrl + '", 1)') : "N/A";
    var cmCell = cmUrl ? ('=IMAGE("' + cmUrl + '", 1)') : "N/A";
    var cfCell = cfUrl ? ('=IMAGE("' + cfUrl + '", 1)') : "N/A";

    // رابط مباشر لفتح التقرير البصري التفاعلي بكامل الصور
    var reportUrl = pagesBase + "/results-viewer.html?name=" + encodeURIComponent(pName) + 
                    "&age=" + encodeURIComponent(pAge) + 
                    "&af=" + afNum + "&am=" + amNum + "&cm=" + cmNum + "&cf=" + cfNum;
    
    var reportLinkCell = '=HYPERLINK("' + reportUrl + '", "🖼️ فتح التقرير البصري للنتائج")';

    var startTimeStr = data.startTime ? new Date(data.startTime).toLocaleTimeString() : "";
    var endTimeStr = data.endTime ? new Date(data.endTime).toLocaleTimeString() : "";
    var durationStr = (startTimeStr && endTimeStr) ? (startTimeStr + " ➔ " + endTimeStr) : (startTimeStr || "N/A");

    sheet.appendRow([
      new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }),
      pName,
      pAge || "N/A",
      data.gender || "N/A",
      "#" + (data.attemptNumber || 1),
      afCell,
      amCell,
      cmCell,
      cfCell,
      reportLinkCell,
      durationStr,
      data.totalDecisions || 124
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
