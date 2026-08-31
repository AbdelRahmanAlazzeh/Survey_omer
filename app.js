/**
 * VISUAL PREFERENCE SURVEY - CORE APPLICATION ENGINE
 * Features:
 * - Tournament King of the Hill Pairwise Elimination
 * - 4 Separate Face Categories
 * - Fallback High-Quality SVG Placeholder Generator
 * - Google Sheets Realtime Webhook Integration (>300 participants support)
 * - CSV / JSON Export
 * - Full Arabic & English Localization
 * - Keyboard Shortcuts & Image Zoom
 */

// Application State
const state = {
  currentCategoryIndex: 0,
  currentChampionNumber: 1,
  currentChallengerNumber: 2,
  currentRoundNumber: 1, // 1 to 34 per category
  
  // Participant Info
  participant: {
    id: '',
    gender: '',
    age: '',
    startTime: null,
    endTime: null
  },

  // Final 4 Winners
  winners: [],

  // Detailed History of all 136 comparisons
  history: [],

  // Tracking
  lastRoundStartTime: null,
  isProcessingDecision: false,
  language: 'ar', // 'ar' or 'en'
  theme: 'dark'
};

// Translations Dictionary
const I18N = {
  ar: {
    appTitle: "استبيان المفاضلة البصرية",
    btnLang: "English 🌐",
    welcomeHeading: "مرحباً بك في استبيان المفاضلة والاختيار البصري",
    welcomeSubtext: "يهدف هذا الاستبيان إلى دراسة التفضيل البصري للوجوه عبر 4 فئات مختلفة بنظام التصفية الزوجية.",
    inst1Title: "مقارنة زوجية",
    inst1Desc: "ستظهر لك صورتان جنباً إلى جنب في كل جولة، اختر الصورة الأفضل بالنسبة لك.",
    inst2Title: "بقاء الفائز",
    inst2Desc: "الصورة التي تختارها تبقى لمنافسة الصورة التالية، وتُستبعد الصورة الأخرى.",
    inst3Title: "النتيجة النهائية",
    inst3Desc: "في نهاية الاستبيان سنصل إلى 4 صور فائزة تمثل اختياراتك عبر الفئات الأربعة.",
    lblPartId: "كود المقيّم / الاسم (Participant ID):",
    lblGender: "الجنس (اختياري):",
    lblAge: "الفئة العمرية (اختياري):",
    optSelect: "-- اختر --",
    optMale: "ذكر",
    optFemale: "أنثى",
    optOther: "أفضل عدم التحديد",
    btnStart: "بدء الاستبيان",
    lblComparison: "المقارنة:",
    catProgress: (c, t) => `الفئة ${c} من ${t}`,
    arenaInstruction: "انقر على الصورة المفضلة بالنسبة لك",
    arenaSubhint: "يمكنك استخدام الأسهم في لوحة المفاتيح أو النقر المباشر",
    lblChampion: "الصورة الحالية",
    lblChallenger: "المنافس الجديد",
    lblSelect: "اختيار",
    keyHintLeft: "اضغط ⬅️ أو 1",
    keyHintRight: "اضغط ➡️ أو 2",
    chooseLeft: ": اختيار اليسار",
    chooseRight: ": اختيار اليمين",
    closeZoom: ": إغلاق المعاينة",
    transTitle: "🎉 رائع! انتهت هذه الفئة",
    transDesc: (catName, winnerNum) => `تم تحديد الصورة رقم (${winnerNum}) كفائزة في فئة "${catName}". اضغط أدناه للانتقال للفئة التالية.`,
    btnNextCat: "متابعة إلى الفئة التالية",
    resHeading: "اكتمل الاستبيان بنجاح! 🏆",
    resSubtext: "شكراً جزيلاً لمشاركتك! إليك الصور الأربعة الفائزة بناءً على قراراتك:",
    rankBadge: "الخيار النهائي الفائز",
    statusSending: "جاري حفظ وإرسال البيانات إلى السيرفر...",
    statusSuccess: "✓ تم تسجيل نتائجك وحفظها بنجاح في قاعدة البيانات!",
    statusLocalOnly: "ℹ️ تم حفظ النتائج محلياً. يمكنك تحميل الملف أدناه كنسخة احتياطية.",
    btnCsv: "تحميل تقرير (CSV)",
    btnJson: "تحميل البيانات (JSON)",
    btnNewEval: "مقيّم جديد",
    imgTitle: (num) => `صورة رقم #${num}`
  },
  en: {
    appTitle: "Visual Preference Survey",
    btnLang: "العربية 🌐",
    welcomeHeading: "Welcome to the Visual Preference Survey",
    welcomeSubtext: "This survey investigates visual preference across 4 distinct categories using pairwise King-of-the-Hill tournament elimination.",
    inst1Title: "Pairwise Comparison",
    inst1Desc: "Two images will be displayed side-by-side. Choose the one you prefer.",
    inst2Title: "King of the Hill",
    inst2Desc: "The chosen image stays to battle the next challenger until all 35 images are evaluated.",
    inst3Title: "Final 4 Champions",
    inst3Desc: "At the end, exactly 1 champion per category will be crowned (4 final winners).",
    lblPartId: "Participant ID / Name:",
    lblGender: "Gender (Optional):",
    lblAge: "Age Group (Optional):",
    optSelect: "-- Select --",
    optMale: "Male",
    optFemale: "Female",
    optOther: "Prefer not to say",
    btnStart: "Start Survey",
    lblComparison: "Comparison:",
    catProgress: (c, t) => `Category ${c} of ${t}`,
    arenaInstruction: "Click on your preferred image",
    arenaSubhint: "You can use keyboard arrow keys or click directly",
    lblChampion: "Current Champion",
    lblChallenger: "New Challenger",
    lblSelect: "Select",
    keyHintLeft: "Press ⬅️ or 1",
    keyHintRight: "Press ➡️ or 2",
    chooseLeft: ": Select Left",
    chooseRight: ": Select Right",
    closeZoom: ": Close Preview",
    transTitle: "🎉 Great! Category Complete",
    transDesc: (catName, winnerNum) => `Image #${winnerNum} crowned champion for "${catName}". Click below to continue.`,
    btnNextCat: "Continue to Next Category",
    resHeading: "Survey Completed Successfully! 🏆",
    resSubtext: "Thank you for participating! Here are your 4 winning face selections:",
    rankBadge: "Final Winner Champion",
    statusSending: "Submitting survey responses...",
    statusSuccess: "✓ Responses recorded and submitted successfully!",
    statusLocalOnly: "ℹ️ Responses saved locally. You can download the report below.",
    btnCsv: "Download CSV Report",
    btnJson: "Download JSON Data",
    btnNewEval: "New Participant",
    imgTitle: (num) => `Image #${num}`
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  initTheme();
  generateDefaultParticipantId();
});

/**
 * Event Listeners & Keyboard Bindings
 */
function initEventListeners() {
  // Theme toggle
  document.getElementById('btn-toggle-theme').addEventListener('click', toggleTheme);
  
  // Language toggle
  document.getElementById('btn-toggle-lang').addEventListener('click', toggleLanguage);

  // Keyboard Shortcuts (Arrow keys & 1/2)
  window.addEventListener('keydown', handleKeyNavigation);

  // Close zoom with ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeZoom();
  });
}

/**
 * Handle Keyboard Shortcuts
 */
function handleKeyNavigation(e) {
  const arenaScreen = document.getElementById('screen-arena');
  if (!arenaScreen.classList.contains('active') || state.isProcessingDecision) return;

  // Don't capture inputs if typing inside an input box
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  if (e.key === 'ArrowLeft' || e.key === '1' || e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    selectWinner('left');
  } else if (e.key === 'ArrowRight' || e.key === '2' || e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    selectWinner('right');
  }
}

/**
 * Generate a unique fallback participant ID (e.g. PART-9821)
 */
function generateDefaultParticipantId() {
  const partInput = document.getElementById('participant-id');
  if (partInput && !partInput.value) {
    const randomCode = 'PART-' + Math.floor(1000 + Math.random() * 9000);
    partInput.value = randomCode;
  }
}

/**
 * Start Survey
 */
function startSurvey() {
  const partId = document.getElementById('participant-id').value.trim();
  if (!partId) return;

  state.participant.id = partId;
  state.participant.gender = document.getElementById('participant-gender').value;
  state.participant.age = document.getElementById('participant-age').value;
  state.participant.startTime = new Date().toISOString();

  state.currentCategoryIndex = 0;
  state.winners = [];
  state.history = [];

  showScreen('screen-arena');
  document.getElementById('survey-status-bar').classList.add('active');

  startCategory(0);
}

/**
 * Start a specific category
 */
function startCategory(catIndex) {
  state.currentCategoryIndex = catIndex;
  state.currentChampionNumber = 1;
  state.currentChallengerNumber = 2;
  state.currentRoundNumber = 1;

  updateStatusBar();
  loadCurrentRound();
}

/**
 * Load and display the two competing images in the arena
 */
function loadCurrentRound() {
  state.isProcessingDecision = false;
  state.lastRoundStartTime = performance.now();

  const category = SURVEY_CONFIG.categories[state.currentCategoryIndex];
  const lang = state.language;

  // Update Status Bar
  updateStatusBar();

  // Elements
  const imgA = document.getElementById('img-candidate-a');
  const imgB = document.getElementById('img-candidate-b');
  const titleA = document.getElementById('title-candidate-a');
  const titleB = document.getElementById('title-candidate-b');
  const badgeA = document.getElementById('lbl-champion');
  const badgeB = document.getElementById('lbl-challenger');

  titleA.textContent = I18N[lang].imgTitle(state.currentChampionNumber);
  titleB.textContent = I18N[lang].imgTitle(state.currentChallengerNumber);

  // Set images with smart fallback handler
  setImageSource(imgA, category, state.currentChampionNumber);
  setImageSource(imgB, category, state.currentChallengerNumber);

  // Animate cards entry
  const cardA = document.getElementById('card-candidate-a');
  const cardB = document.getElementById('card-candidate-b');
  
  cardA.style.animation = 'none';
  cardB.style.animation = 'none';
  // Trigger reflow
  void cardA.offsetWidth;
  void cardB.offsetWidth;

  cardA.style.animation = 'fadeIn 0.25s ease';
  cardB.style.animation = 'fadeIn 0.25s ease';
}

/**
 * Smart image source loader with graceful SVG fallback
 */
function setImageSource(imgElement, category, imageNumber) {
  const primaryPath = `${category.folder}/${imageNumber}.jpg`;
  
  // Create an image test to check if the file exists on the server/repo
  const testImg = new Image();
  testImg.onload = () => {
    imgElement.src = primaryPath;
  };
  testImg.onerror = () => {
    // Try PNG fallback
    const pngPath = `${category.folder}/${imageNumber}.png`;
    const testPng = new Image();
    testPng.onload = () => {
      imgElement.src = pngPath;
    };
    testPng.onerror = () => {
      // If neither exists yet, show high quality SVG generated placeholder
      imgElement.src = generateSvgPlaceholder(category, imageNumber);
    };
    testPng.src = pngPath;
  };
  testImg.src = primaryPath;
}

/**
 * Generate a crisp, beautiful SVG face placeholder with exact number and category badge
 */
function generateSvgPlaceholder(category, imageNumber) {
  const title = state.language === 'ar' ? category.titleAr : category.titleEn;
  const color = category.badgeColor || '#6366f1';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#grad)"/>
    <circle cx="300" cy="230" r="95" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="4"/>
    <circle cx="300" cy="210" r="45" fill="${color}" fill-opacity="0.4"/>
    <path d="M220 330 Q300 270 380 330" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
    <rect x="180" y="380" width="240" height="42" rx="21" fill="${color}"/>
    <text x="300" y="407" fill="#ffffff" font-size="20" font-weight="bold" font-family="sans-serif" text-anchor="middle">
      # ${imageNumber}
    </text>
    <text x="300" y="460" fill="#94a3b8" font-size="16" font-family="sans-serif" text-anchor="middle">
      ${title}
    </text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/**
 * Handle user choice: 'left' (Champion) or 'right' (Challenger)
 */
function selectWinner(choice) {
  if (state.isProcessingDecision) return;
  state.isProcessingDecision = true;

  const reactionTime = Math.round(performance.now() - state.lastRoundStartTime);
  const category = SURVEY_CONFIG.categories[state.currentCategoryIndex];
  
  const championNumber = state.currentChampionNumber;
  const challengerNumber = state.currentChallengerNumber;
  const chosenNumber = (choice === 'left') ? championNumber : challengerNumber;
  const eliminatedNumber = (choice === 'left') ? challengerNumber : championNumber;

  // Log round decision
  state.history.push({
    participantId: state.participant.id,
    categoryId: category.id,
    categoryTitle: category.titleEn,
    roundNumber: state.currentRoundNumber,
    leftImage: championNumber,
    rightImage: challengerNumber,
    winnerChosen: chosenNumber,
    eliminatedImage: eliminatedNumber,
    reactionTimeMs: reactionTime,
    timestamp: new Date().toISOString()
  });

  // Card highlight pulse animation
  const chosenCard = choice === 'left' ? document.getElementById('card-candidate-a') : document.getElementById('card-candidate-b');
  chosenCard.style.transform = 'scale(1.04)';
  chosenCard.style.borderColor = '#10b981';

  setTimeout(() => {
    chosenCard.style.transform = '';
    chosenCard.style.borderColor = '';

    // King of the Hill Update:
    // The winner becomes/remains the current champion
    state.currentChampionNumber = chosenNumber;

    // Check if category complete (all 35 images compared, i.e., 34 comparisons done)
    if (state.currentRoundNumber >= category.totalImages - 1) {
      // Category finished! Record ultimate winner
      state.winners.push({
        categoryId: category.id,
        categoryTitleAr: category.titleAr,
        categoryTitleEn: category.titleEn,
        badgeColor: category.badgeColor,
        winnerImageNumber: chosenNumber,
        folder: category.folder
      });

      handleCategoryCompletion();
    } else {
      // Advance to next challenger
      state.currentRoundNumber += 1;
      state.currentChallengerNumber += 1;
      loadCurrentRound();
    }
  }, 220);
}

/**
 * Handle transition when a category completes
 */
function handleCategoryCompletion() {
  const currentCat = SURVEY_CONFIG.categories[state.currentCategoryIndex];
  const lang = state.language;

  // Check if all 4 categories are completed
  if (state.currentCategoryIndex >= SURVEY_CONFIG.categories.length - 1) {
    // All 4 categories done! Show final results
    finishSurvey();
  } else {
    // Show Interstitial modal before next category
    const modal = document.getElementById('interstitial-modal');
    const title = document.getElementById('trans-title');
    const desc = document.getElementById('trans-desc');
    const catName = lang === 'ar' ? currentCat.titleAr : currentCat.titleEn;

    title.textContent = I18N[lang].transTitle;
    desc.textContent = I18N[lang].transDesc(catName, state.currentChampionNumber);

    modal.classList.add('active');
  }
}

/**
 * Proceed to next category from modal
 */
function proceedToNextCategory() {
  document.getElementById('interstitial-modal').classList.remove('active');
  startCategory(state.currentCategoryIndex + 1);
}

/**
 * Finish Survey & Render Results
 */
function finishSurvey() {
  state.participant.endTime = new Date().toISOString();
  
  // Hide status bar
  document.getElementById('survey-status-bar').classList.remove('active');
  
  // Show Results Screen
  showScreen('screen-results');

  // Render 4 Winners
  renderWinnersGrid();

  // Submit Data to Google Sheets Webhook
  submitSurveyData();
}

/**
 * Render the 4 Winner cards
 */
function renderWinnersGrid() {
  const grid = document.getElementById('winners-grid');
  grid.innerHTML = '';
  const lang = state.language;

  state.winners.forEach((winner, idx) => {
    const card = document.createElement('div');
    card.className = 'winner-card';

    const catTitle = lang === 'ar' ? winner.categoryTitleAr : winner.categoryTitleEn;
    const imgName = I18N[lang].imgTitle(winner.winnerImageNumber);

    card.innerHTML = `
      <div class="winner-category-tag" style="background: ${winner.badgeColor || '#6366f1'};">
        ${catTitle}
      </div>
      <div class="winner-image-wrap">
        <img id="winner-img-${idx}" src="" alt="${catTitle}">
      </div>
      <div class="winner-card-body">
        <div class="winner-image-name">${imgName}</div>
        <div class="winner-badge-rank">
          <span>👑</span>
          <span>${I18N[lang].rankBadge}</span>
        </div>
      </div>
    `;

    grid.appendChild(card);

    // Set image source
    const imgEl = document.getElementById(`winner-img-${idx}`);
    setImageSource(imgEl, winner, winner.winnerImageNumber);
  });
}

/**
 * Submit survey data to Google Sheets / Webhook
 */
async function submitSurveyData() {
  const statusBox = document.getElementById('submission-status');
  const statusText = document.getElementById('status-text');
  const lang = state.language;

  const payload = {
    participantId: state.participant.id,
    gender: state.participant.gender || 'N/A',
    age: state.participant.age || 'N/A',
    startTime: state.participant.startTime,
    endTime: state.participant.endTime,
    winners: state.winners.map(w => ({
      category: w.categoryId,
      imageNumber: w.winnerImageNumber
    })),
    // Summary format for Google Sheets columns
    winnerArabFemale: state.winners.find(w => w.categoryId === 'arab_female')?.winnerImageNumber || '',
    winnerArabMale: state.winners.find(w => w.categoryId === 'arab_male')?.winnerImageNumber || '',
    winnerChineseMale: state.winners.find(w => w.categoryId === 'chinese_male')?.winnerImageNumber || '',
    winnerChineseFemale: state.winners.find(w => w.categoryId === 'chinese_female')?.winnerImageNumber || '',
    totalDecisions: state.history.length,
    detailedHistory: state.history
  };

  // Local storage save
  try {
    const existing = JSON.parse(localStorage.getItem('SURVEY_RESPONSES') || '[]');
    existing.push(payload);
    localStorage.setItem('SURVEY_RESPONSES', JSON.stringify(existing));
  } catch (e) {
    console.warn('LocalStorage save warning:', e);
  }

  const webhookUrl = SURVEY_CONFIG.googleSheetWebhookUrl;

  if (!webhookUrl) {
    // If webhook not configured yet, notify gracefully
    statusBox.className = 'submit-status-box status-fallback';
    statusText.textContent = I18N[lang].statusLocalOnly;
    return;
  }

  statusBox.className = 'submit-status-box status-sending';
  statusText.textContent = I18N[lang].statusSending;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Standard for Google Apps Script Web Apps
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    statusBox.className = 'submit-status-box status-success';
    statusText.textContent = I18N[lang].statusSuccess;
  } catch (err) {
    console.error('Submission error:', err);
    statusBox.className = 'submit-status-box status-fallback';
    statusText.textContent = I18N[lang].statusLocalOnly;
  }
}

/**
 * Export Responses to CSV file
 */
function exportDataAsCSV() {
  const p = state.participant;
  const w = state.winners;

  let csvContent = "\uFEFF"; // UTF-8 BOM for Excel Arabic support
  csvContent += "Participant ID,Gender,Age,Start Time,End Time,Arab Female Winner,Arab Male Winner,Chinese Male Winner,Chinese Female Winner\n";

  const row = [
    `"${p.id}"`,
    `"${p.gender || ''}"`,
    `"${p.age || ''}"`,
    `"${p.startTime || ''}"`,
    `"${p.endTime || ''}"`,
    `"${w.find(x => x.categoryId === 'arab_female')?.winnerImageNumber || ''}"`,
    `"${w.find(x => x.categoryId === 'arab_male')?.winnerImageNumber || ''}"`,
    `"${w.find(x => x.categoryId === 'chinese_male')?.winnerImageNumber || ''}"`,
    `"${w.find(x => x.categoryId === 'chinese_female')?.winnerImageNumber || ''}"`
  ].join(",");

  csvContent += row + "\n\n";

  // Append detailed comparison logs
  csvContent += "Decision Log\n";
  csvContent += "Category,Round,Left Image,Right Image,Winner Chosen,Eliminated Image,Reaction Time (ms),Timestamp\n";

  state.history.forEach(h => {
    csvContent += [
      `"${h.categoryId}"`,
      h.roundNumber,
      h.leftImage,
      h.rightImage,
      h.winnerChosen,
      h.eliminatedImage,
      h.reactionTimeMs,
      `"${h.timestamp}"`
    ].join(",") + "\n";
  });

  downloadFile(csvContent, `survey_results_${p.id}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export Responses to JSON file
 */
function exportDataAsJSON() {
  const data = {
    participant: state.participant,
    winners: state.winners,
    history: state.history
  };

  const jsonStr = JSON.stringify(data, null, 2);
  downloadFile(jsonStr, `survey_data_${state.participant.id}.json`, 'application/json');
}

/**
 * Helper to trigger file download
 */
function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reset application for the next participant
 */
function resetForNewParticipant() {
  generateDefaultParticipantId();
  showScreen('screen-welcome');
  document.getElementById('survey-status-bar').classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Update the Top Progress & Status Bar
 */
function updateStatusBar() {
  const cat = SURVEY_CONFIG.categories[state.currentCategoryIndex];
  const lang = state.language;

  // Title
  document.getElementById('cat-title').textContent = lang === 'ar' ? cat.titleAr : cat.titleEn;
  document.getElementById('cat-progress-text').textContent = I18N[lang].catProgress(
    state.currentCategoryIndex + 1,
    SURVEY_CONFIG.categories.length
  );

  // Rounds
  const totalRoundsInCat = cat.totalImages - 1; // 34
  document.getElementById('round-number-text').textContent = state.currentRoundNumber;
  document.getElementById('total-rounds-text').textContent = totalRoundsInCat;

  // Total Progress Percentage
  const totalSurveyComparisons = SURVEY_CONFIG.categories.length * totalRoundsInCat; // 136
  const currentTotalProgress = (state.currentCategoryIndex * totalRoundsInCat) + (state.currentRoundNumber - 1);
  const percentage = Math.min(100, Math.round((currentTotalProgress / totalSurveyComparisons) * 100));

  document.getElementById('progress-fill').style.width = `${percentage}%`;
}

/**
 * Switch Active Screen View
 */
function showScreen(screenId) {
  document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
}

/**
 * Toggle Language (Arabic / English)
 */
function toggleLanguage() {
  state.language = state.language === 'ar' ? 'en' : 'ar';
  const lang = state.language;

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

  applyLanguageTexts();
}

/**
 * Apply all translations to DOM
 */
function applyLanguageTexts() {
  const lang = state.language;
  const t = I18N[lang];

  document.getElementById('app-title-text').textContent = t.appTitle;
  document.getElementById('btn-toggle-lang').textContent = t.btnLang;

  // Welcome Screen
  document.getElementById('welcome-heading').textContent = t.welcomeHeading;
  document.getElementById('welcome-subtext').textContent = t.welcomeSubtext;
  document.getElementById('inst-1-title').textContent = t.inst1Title;
  document.getElementById('inst-1-desc').textContent = t.inst1Desc;
  document.getElementById('inst-2-title').textContent = t.inst2Title;
  document.getElementById('inst-2-desc').textContent = t.inst2Desc;
  document.getElementById('inst-3-title').textContent = t.inst3Title;
  document.getElementById('inst-3-desc').textContent = t.inst3Desc;
  document.getElementById('lbl-part-id').textContent = t.lblPartId;
  document.getElementById('lbl-gender').textContent = t.lblGender;
  document.getElementById('lbl-age').textContent = t.lblAge;
  document.getElementById('opt-select').textContent = t.optSelect;
  document.getElementById('opt-male').textContent = t.optMale;
  document.getElementById('opt-female').textContent = t.optFemale;
  document.getElementById('opt-other').textContent = t.optOther;
  document.getElementById('btn-start-survey').querySelector('span').textContent = t.btnStart;

  // Status Bar
  document.getElementById('lbl-comparison').textContent = t.lblComparison;
  updateStatusBar();

  // Arena Screen
  document.getElementById('arena-instruction').textContent = t.arenaInstruction;
  document.getElementById('arena-subhint').textContent = t.arenaSubhint;
  document.getElementById('lbl-champion').textContent = t.lblChampion;
  document.getElementById('lbl-challenger').textContent = t.lblChallenger;
  document.getElementById('lbl-select-a').textContent = t.lblSelect;
  document.getElementById('lbl-select-b').textContent = t.lblSelect;
  document.getElementById('txt-choose-left').textContent = t.chooseLeft;
  document.getElementById('txt-choose-right').textContent = t.chooseRight;
  document.getElementById('txt-close-zoom').textContent = t.closeZoom;

  // Interstitial Modal
  document.getElementById('btn-next-cat-text').textContent = t.btnNextCat;

  // Results Screen
  document.getElementById('res-heading').textContent = t.resHeading;
  document.getElementById('res-subtext').textContent = t.resSubtext;
  document.getElementById('btn-csv-text').textContent = t.btnCsv;
  document.getElementById('btn-json-text').textContent = t.btnJson;
  document.getElementById('btn-new-eval').textContent = t.btnNewEval;

  // Re-render current labels if in arena
  if (document.getElementById('screen-arena').classList.contains('active')) {
    document.getElementById('title-candidate-a').textContent = t.imgTitle(state.currentChampionNumber);
    document.getElementById('title-candidate-b').textContent = t.imgTitle(state.currentChallengerNumber);
  }

  // Re-render winners grid if in results
  if (document.getElementById('screen-results').classList.contains('active')) {
    renderWinnersGrid();
  }
}

/**
 * Toggle Light / Dark Theme
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  document.getElementById('btn-toggle-theme').textContent = newTheme === 'dark' ? '🌙' : '☀️';
  state.theme = newTheme;
}

function initTheme() {
  document.documentElement.setAttribute('data-theme', 'dark');
}

/**
 * Lightbox / Zoom functions
 */
function zoomImage(imgElementId) {
  const src = document.getElementById(imgElementId).src;
  const modal = document.getElementById('lightbox-modal');
  const lightImg = document.getElementById('lightbox-img');
  lightImg.src = src;
  modal.classList.add('active');
}

function closeZoom() {
  document.getElementById('lightbox-modal').classList.remove('active');
}

// Global functions attached to window for inline onclick handlers
window.startSurvey = startSurvey;
window.selectWinner = selectWinner;
window.proceedToNextCategory = proceedToNextCategory;
window.zoomImage = zoomImage;
window.closeZoom = closeZoom;
window.exportDataAsCSV = exportDataAsCSV;
window.exportDataAsJSON = exportDataAsJSON;
window.resetForNewParticipant = resetForNewParticipant;
