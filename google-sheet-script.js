/**
 * GOOGLE APPS SCRIPT - SURVEY WEBHOOK ENGINE (SECURE & PRODUCTION READY)
 * 
 * Security & Integrity Features:
 * - Anti-Formula Injection (Sanitizes strings starting with =, +, -, @ to prevent spreadsheet command execution)
 * - Anti-Data Loss Protection: Never deletes data of participants who share the same name
 * - Honeypot Bot Trap: Silently drops spam submissions from automated bots
 * - Strict Image URL Validation: Only allows verified numeric IDs to prevent malformed image formula injections
 * - Concurrency Safe Lock Execution: Prevents race conditions during simultaneous participant submissions
 * - Embedded Live Thumbnail Image Rendering with fallback
 */

function sanitizeCell(val) {
  if (val === null || val === undefined) return "";
  var str = String(val).trim();
  // If the cell value starts with formula characters, prefix with single quote to force plain text
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
}

function safeImageNumber(num) {
  if (!num) return "";
  var parsed = parseInt(num, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 500) {
    return "";
  }
  return String(parsed);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Concurrency protection up to 15 seconds
    lock.tryLock(15000);

    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No payload received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid JSON payload" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Honeypot check: If the hidden bot field is filled, silently discard spam
    if (data.botCheck && String(data.botCheck).trim().length > 0) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // 2. Setup Headers if sheet is empty
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
        "المحاولة (Attempt)",
        "معرف الجلسة (Session ID)"
      ]);
      
      var headerRange = sheet.getRange(1, 1, 1, 13);
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
      sheet.setColumnWidth(13, 140); // Session ID
    }

    // 3. Sanitize inputs to prevent Formula Injections
    var safeName = sanitizeCell(data.participantName || data.participantId || "Anonymous");
    var safeGender = sanitizeCell(data.gender || "N/A");
    var safeAge = sanitizeCell(data.participantAge || data.age || "N/A");
    var safeStartTime = sanitizeCell(data.startTime || "");
    var safeEndTime = sanitizeCell(data.endTime || "");
    var safeSessionId = sanitizeCell(data.sessionId || "N/A");
    var safeAttempt = parseInt(data.attemptNumber, 10) || 1;
    var safeDecisions = parseInt(data.totalDecisions, 10) || 0;

    // 4. Validate image numbers strictly as numeric values
    var afNum = safeImageNumber(data.winnerArabFemale);
    var amNum = safeImageNumber(data.winnerArabMale);
    var cmNum = safeImageNumber(data.winnerChineseMale);
    var cfNum = safeImageNumber(data.winnerChineseFemale);

    var rawBase = "https://raw.githubusercontent.com/AbdelRahmanAlazzeh/Survey_omer/main/assets/images";

    var afCell = afNum ? ('=IMAGE("' + rawBase + '/arab_female/' + afNum + '.jpg", 1)') : "N/A";
    var amCell = amNum ? ('=IMAGE("' + rawBase + '/arab_male/' + amNum + '.jpg", 1)') : "N/A";
    var cmCell = cmNum ? ('=IMAGE("' + rawBase + '/chinese_male/' + cmNum + '.jpg", 1)') : "N/A";
    var cfCell = cfNum ? ('=IMAGE("' + rawBase + '/chinese_female/' + cfNum + '.jpg", 1)') : "N/A";

    // 5. Append row safely without deleting past responses
    sheet.appendRow([
      new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }), // Col 1: Timestamp
      safeName,                                                       // Col 2: Name
      safeGender,                                                     // Col 3: Gender
      safeAge,                                                        // Col 4: Age
      afCell,                                                         // Col 5: Arab Female Winner
      amCell,                                                         // Col 6: Arab Male Winner
      cmCell,                                                         // Col 7: Chinese Male Winner
      cfCell,                                                         // Col 8: Chinese Female Winner
      safeStartTime,                                                  // Col 9: Start Time
      safeEndTime,                                                    // Col 10: End Time
      safeDecisions,                                                  // Col 11: Total Decisions
      "#" + safeAttempt,                                              // Col 12: Attempt
      safeSessionId                                                   // Col 13: Session ID
    ]);

    var newRow = sheet.getLastRow();
    sheet.setRowHeight(newRow, 90);
    sheet.getRange(newRow, 1, 1, 13).setVerticalAlignment("middle").setHorizontalAlignment("center");

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Response securely recorded." }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Visual Survey Webhook is active and secure.");
}
