/**
 * VISUAL PREFERENCE SURVEY - CORE APPLICATION ENGINE
 * Features:
 * - Tournament King of the Hill Pairwise Elimination
 * - 4 Face Categories with Dynamic Universal Aspect-Ratio Framing
 * - Resilient Session Recovery on Page Reload / Accidental Refresh
 * - Google Sheets Realtime Webhook Integration
 * - Professional Academic Copywriting & Multi-Language Localization
 * - Accessible Keyboard Shortcuts & Full-Resolution Lightbox Zoom
 */

// Application State
const state = {
  currentCategoryIndex: 0,
  currentChampionNumber: 1,
  currentChallengerNumber: 2,
  currentRoundNumber: 1,
  
  // Participant Info
  participant: {
    id: '',
    name: '',
    gender: '',
    age: '',
    startTime: null,
    endTime: null
  },

  // Final 4 Winners
  winners: [],

  // Detailed History of comparisons
  history: [],

  // Tracking & Flags
  lastRoundStartTime: null,
  isProcessingDecision: false,
  isSurveyActive: false,
  isSurveyCompleted: false,
  language: 'ar',
  theme: 'dark'
};

// Translations Dictionary
const I18N = {
  ar: {
    appTitle: "استبيان التفضيل البصري",
    btnLang: "English",
    welcomeHeading: "استبيان التفضيل والمفاضلة البصرية",
    welcomeSubtext: "نرحب بمشاركتك الكريمة. يهدف هذا البحث إلى دراسة التفضيلات البصرية عبر 4 مجموعات مختلفة من الصور بنظام المقارنة المباشرة.",
    inst1Title: "مقارنة زوجية",
    inst1Desc: "تُعرض صورتان جنباً إلى جنب في كل جولة",
    inst2Title: "اختيار الأنسب",
    inst2Desc: "اختر الصورة المفضلة بنظرك للمتابعة",
    inst3Title: "النتيجة النهائية",
    inst3Desc: "تحديد الخيار الفائز لكل مجموعة بدقة",
    lblPartId: "اسم المشارك / اللقب (اختياري):",
    placeholderPartId: "أدخل اسمك أو لقبك، أو اتركه فارغاً للبدء مباشرة...",
    lblGender: "الجنس (اختياري):",
    lblAge: "الفئة العمرية (اختياري):",
    optSelect: "-- اختر --",
    optMale: "ذكر",
    optFemale: "أنثى",
    optOther: "أفضل عدم التحديد",
    btnStart: "بدء الاستبيان",
    lblComparison: "المقارنة:",
    catProgress: (c, t) => `المجموعة ${c} من ${t}`,
    catBadgePrefix: "المجموعة: ",
    arenaInstruction: "اختر الصورة الأكثر تفضيلاً بالنسبة لك",
    arenaSubhint: "انقر مباشرة على الصورة أو استخدم مفاتيح الأسهم (⬅️ / ➡️) أو الأرقام (1 / 2)",
    lblChampion: "الخيار (1)",
    lblChallenger: "الخيار (2)",
    lblSelect: "اختيار هذا",
    chooseLeft: ": اختيار اليسار",
    chooseRight: ": اختيار اليمين",
    closeZoom: ": إغلاق المعاينة",
    transTitle: "🎯 انتهت هذه المجموعة",
    transDesc: (catName, winnerNum) => `تم تحديد الصورة رقم (${winnerNum}) كخيار مفضل لمجموعة "${catName}". اضغط أدناه للمتابعة إلى المجموعة التالية.`,
    btnNextCat: "المتابعة إلى المجموعة التالية",
    resHeading: "اكتمل الاستبيان بنجاح! 🏆",
    resSubtext: "شكراً جزيلاً لمشاركتك الكريمة! إليك الصور الفائزة بناءً على اختياراتك في كل مجموعة:",
    rankBadge: "الخيار المفضل النهائي",
    statusSending: "جاري حفظ وإرسال البيانات إلى السيرفر...",
    statusSuccess: "✓ تم تسجيل نتائجك وحفظها بنجاح!",
    statusLocalOnly: "ℹ️ تم حفظ النتائج محلياً. يمكنك تحميل تقرير بالنتائج أدناه.",
    btnCsv: "تحميل تقرير (CSV)",
    btnJson: "تحميل البيانات (JSON)",
    btnNewEval: "مشارك جديد",
    imgTitle: (num) => `صورة #${num}`,
    resumeTitle: "لديك استبيان قيد التقدم",
    resumeDesc: (cat, round) => `يمكنك استئناف جلسة التقييم السابقة من (المجموعة ${cat}، الجولة ${round}) أو البدء من جديد.`,
    btnResume: "استئناف المتابعة",
    btnDiscard: "بدء جديد"
  },
  en: {
    appTitle: "Visual Preference Survey",
    btnLang: "العربية",
    welcomeHeading: "Visual Face Preference Survey",
    welcomeSubtext: "Welcome. This research study evaluates visual preferences across 4 distinct image groups through direct pairwise comparisons.",
    inst1Title: "Pairwise Comparison",
    inst1Desc: "Two images are displayed side-by-side each round",
    inst2Title: "Select Preferred",
    inst2Desc: "Select the image you prefer to advance",
    inst3Title: "Final Champions",
    inst3Desc: "Identify the top selected choice per category",
    lblPartId: "Participant Name (Optional):",
    placeholderPartId: "Enter your name, or leave blank to continue...",
    lblGender: "Gender (Optional):",
    lblAge: "Age Group (Optional):",
    optSelect: "-- Select --",
    optMale: "Male",
    optFemale: "Female",
    optOther: "Prefer not to say",
    btnStart: "Start Survey",
    lblComparison: "Comparison:",
    catProgress: (c, t) => `Set ${c} of ${t}`,
    catBadgePrefix: "Set: ",
    arenaInstruction: "Select the image you prefer",
    arenaSubhint: "Click on the image or use arrow keys (⬅️ / ➡️) or numbers (1 / 2)",
    lblChampion: "Option 1",
    lblChallenger: "Option 2",
    lblSelect: "Select This",
    chooseLeft: ": Select Left",
    chooseRight: ": Select Right",
    closeZoom: ": Close Preview",
    transTitle: "🎯 Set Completed",
    transDesc: (catName, winnerNum) => `Image #${winnerNum} was selected for "${catName}". Click below to proceed to the next set.`,
    btnNextCat: "Continue to Next Set",
    resHeading: "Survey Completed Successfully! 🏆",
    resSubtext: "Thank you for your valuable participation! Here are your top choices across all sets:",
    rankBadge: "Top Choice Winner",
    statusSending: "Submitting responses...",
    statusSuccess: "✓ Your responses were recorded and submitted successfully!",
    statusLocalOnly: "ℹ️ Responses saved locally. You can download the report below.",
    btnCsv: "Download CSV Report",
    btnJson: "Download JSON Data",
    btnNewEval: "New Participant",
    imgTitle: (num) => `Image #${num}`,
    resumeTitle: "Survey in Progress",
    resumeDesc: (cat, round) => `You can resume your previous session from (Set ${cat}, Round ${round}) or start fresh.`,
    btnResume: "Resume Session",
    btnDiscard: "Start Fresh"
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  initTheme();
  checkSavedSession();
});

/**
 * Event Listeners & Keyboard Bindings
 */
function initEventListeners() {
  // Theme toggle
  const btnTheme = document.getElementById('btn-toggle-theme');
  if (btnTheme) btnTheme.addEventListener('click', toggleTheme);
  
  // Language toggle
  const btnLang = document.getElementById('btn-toggle-lang');
  if (btnLang) btnLang.addEventListener('click', toggleLanguage);

  // Keyboard Shortcuts (Arrow keys & 1/2)
  window.addEventListener('keydown', handleKeyNavigation);

  // Close zoom with ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeZoom();
  });

  // Warn before accidental tab closure during active survey
  window.addEventListener('beforeunload', (e) => {
    if (state.isSurveyActive && !state.isSurveyCompleted) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

/**
 * Handle Keyboard Shortcuts
 */
function handleKeyNavigation(e) {
  const arenaScreen = document.getElementById('screen-arena');
  if (!arenaScreen || !arenaScreen.classList.contains('active') || state.isProcessingDecision) return;

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
 * Start Survey with clean user credentials
 */
function startSurvey() {
  const rawName = (document.getElementById('participant-id').value || '').trim();
  const fallbackId = 'P-' + Math.floor(1000 + Math.random() * 9000);

  state.participant.name = rawName || '';
  state.participant.id = rawName ? rawName : fallbackId;
  state.participant.gender = document.getElementById('participant-gender').value;
  state.participant.age = document.getElementById('participant-age').value;
  state.participant.startTime = new Date().toISOString();

  state.currentCategoryIndex = 0;
  state.winners = [];
  state.history = [];
  state.isSurveyActive = true;
  state.isSurveyCompleted = false;

  showScreen('screen-arena');
  document.getElementById('survey-status-bar').classList.add('active');

  startCategory(0);
}

/**
 * Save Active Session to localStorage
 */
function saveActiveSession() {
  if (!state.isSurveyActive || state.isSurveyCompleted) return;
  try {
    const sessionData = {
      currentCategoryIndex: state.currentCategoryIndex,
      currentChampionNumber: state.currentChampionNumber,
      currentChallengerNumber: state.currentChallengerNumber,
      currentRoundNumber: state.currentRoundNumber,
      participant: state.participant,
      winners: state.winners,
      history: state.history,
      language: state.language
    };
    localStorage.setItem('SURVEY_ACTIVE_SESSION', JSON.stringify(sessionData));
  } catch (err) {
    console.warn('Session save error:', err);
  }
}

/**
 * Clear Active Session from localStorage
 */
function clearActiveSession() {
  try {
    localStorage.removeItem('SURVEY_ACTIVE_SESSION');
  } catch (err) {
    console.warn('Session clear error:', err);
  }
}

/**
 * Check if a previous survey session exists to allow resuming
 */
function checkSavedSession() {
  try {
    const raw = localStorage.getItem('SURVEY_ACTIVE_SESSION');
    if (!raw) return;
    const sessionData = JSON.parse(raw);
    if (!sessionData || typeof sessionData.currentCategoryIndex !== 'number') return;

    const banner = document.getElementById('resume-session-banner');
    if (!banner) return;

    const lang = state.language;
    const catNum = sessionData.currentCategoryIndex + 1;
    const roundNum = sessionData.currentRoundNumber || 1;

    document.getElementById('resume-banner-title').textContent = I18N[lang].resumeTitle;
    document.getElementById('resume-banner-desc').textContent = I18N[lang].resumeDesc(catNum, roundNum);
    document.getElementById('btn-resume-text').textContent = I18N[lang].btnResume;
    document.getElementById('btn-discard-text').textContent = I18N[lang].btnDiscard;

    banner.style.display = 'flex';
  } catch (err) {
    console.warn('Check session error:', err);
  }
}

/**
 * Resume Saved Session
 */
function resumeSavedSession() {
  try {
    const raw = localStorage.getItem('SURVEY_ACTIVE_SESSION');
    if (!raw) return;
    const s = JSON.parse(raw);

    state.currentCategoryIndex = s.currentCategoryIndex || 0;
    state.currentChampionNumber = s.currentChampionNumber || 1;
    state.currentChallengerNumber = s.currentChallengerNumber || 2;
    state.currentRoundNumber = s.currentRoundNumber || 1;
    state.participant = s.participant || { id: 'P-1000', name: '' };
    state.winners = s.winners || [];
    state.history = s.history || [];
    state.isSurveyActive = true;
    state.isSurveyCompleted = false;

    if (s.language) {
      state.language = s.language;
      applyLanguageTexts();
    }

    const banner = document.getElementById('resume-session-banner');
    if (banner) banner.style.display = 'none';

    showScreen('screen-arena');
    document.getElementById('survey-status-bar').classList.add('active');

    adaptArenaFraming();
    updateStatusBar();
    loadCurrentRound();
  } catch (err) {
    console.error('Resume session failed:', err);
    discardSavedSession();
  }
}

/**
 * Discard Saved Session
 */
function discardSavedSession() {
  clearActiveSession();
  const banner = document.getElementById('resume-session-banner');
  if (banner) banner.style.display = 'none';
}

/**
 * Start a specific category
 */
function startCategory(catIndex) {
  state.currentCategoryIndex = catIndex;
  state.currentChampionNumber = 1;
  state.currentChallengerNumber = 2;
  state.currentRoundNumber = 1;

  adaptArenaFraming();
  updateStatusBar();
  loadCurrentRound();
  saveActiveSession();
}

/**
 * Dynamically adapt arena image framing aspect-ratio based on picture set
 */
function adaptArenaFraming() {
  const category = SURVEY_CONFIG.categories[state.currentCategoryIndex];
  const arenaContainer = document.getElementById('battle-arena-container');
  if (!arenaContainer || !category) return;

  if (category.aspectRatioType === 'portrait') {
    arenaContainer.classList.remove('arena-landscape');
    arenaContainer.classList.add('arena-portrait');
  } else {
    arenaContainer.classList.remove('arena-portrait');
    arenaContainer.classList.add('arena-landscape');
  }
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

  // Set images with border-safe image loader
  setImageSource(imgA, category, state.currentChampionNumber);
  setImageSource(imgB, category, state.currentChallengerNumber);

  // Smooth animation entry
  const cardA = document.getElementById('card-candidate-a');
  const cardB = document.getElementById('card-candidate-b');
  
  if (cardA && cardB) {
    cardA.style.animation = 'none';
    cardB.style.animation = 'none';
    void cardA.offsetWidth;
    void cardB.offsetWidth;
    cardA.style.animation = 'cardFadeIn 0.2s ease-out';
    cardB.style.animation = 'cardFadeIn 0.2s ease-out';
  }
}

/**
 * Border-safe image loader with graceful fallback
 */
function setImageSource(imgElement, category, imageNumber) {
  const primaryPath = `${category.folder}/${imageNumber}.jpg`;
  
  const testImg = new Image();
  testImg.onload = () => {
    imgElement.src = primaryPath;
  };
  testImg.onerror = () => {
    const pngPath = `${category.folder}/${imageNumber}.png`;
    const testPng = new Image();
    testPng.onload = () => {
      imgElement.src = pngPath;
    };
    testPng.onerror = () => {
      imgElement.src = generateSvgPlaceholder(category, imageNumber);
    };
    testPng.src = pngPath;
  };
  testImg.src = primaryPath;
}

/**
 * Generate clean SVG placeholder if file not found
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
    participantName: state.participant.name,
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
  if (chosenCard) {
    chosenCard.classList.add('card-selected');
  }

  setTimeout(() => {
    if (chosenCard) chosenCard.classList.remove('card-selected');

    // King of the Hill Update:
    state.currentChampionNumber = chosenNumber;

    // Check if category complete
    if (state.currentRoundNumber >= category.totalImages - 1) {
      // Record category champion
      state.winners.push({
        categoryId: category.id,
        categoryTitleAr: category.titleAr,
        categoryTitleEn: category.titleEn,
        badgeColor: category.badgeColor,
        winnerImageNumber: chosenNumber,
        folder: category.folder
      });

      saveActiveSession();
      handleCategoryCompletion();
    } else {
      // Advance to next challenger
      state.currentRoundNumber += 1;
      state.currentChallengerNumber += 1;
      saveActiveSession();
      loadCurrentRound();
    }
  }, 180);
}

/**
 * Handle transition when a category completes
 */
function handleCategoryCompletion() {
  const currentCat = SURVEY_CONFIG.categories[state.currentCategoryIndex];
  const lang = state.language;

  // Check if all categories completed
  if (state.currentCategoryIndex >= SURVEY_CONFIG.categories.length - 1) {
    finishSurvey();
  } else {
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
  state.isSurveyActive = false;
  state.isSurveyCompleted = true;
  
  clearActiveSession();

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
  if (!grid) return;
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
    participantName: state.participant.name || 'Anonymous',
    gender: state.participant.gender || 'N/A',
    age: state.participant.age || 'N/A',
    startTime: state.participant.startTime,
    endTime: state.participant.endTime,
    winners: state.winners.map(w => ({
      category: w.categoryId,
      imageNumber: w.winnerImageNumber
    })),
    winnerArabFemale: state.winners.find(w => w.categoryId === 'arab_female')?.winnerImageNumber || '',
    winnerArabMale: state.winners.find(w => w.categoryId === 'arab_male')?.winnerImageNumber || '',
    winnerChineseMale: state.winners.find(w => w.categoryId === 'chinese_male')?.winnerImageNumber || '',
    winnerChineseFemale: state.winners.find(w => w.categoryId === 'chinese_female')?.winnerImageNumber || '',
    totalDecisions: state.history.length,
    detailedHistory: state.history
  };

  // Local storage backup list
  try {
    const existing = JSON.parse(localStorage.getItem('SURVEY_RESPONSES') || '[]');
    existing.push(payload);
    localStorage.setItem('SURVEY_RESPONSES', JSON.stringify(existing));
  } catch (e) {
    console.warn('LocalStorage save warning:', e);
  }

  const webhookUrl = SURVEY_CONFIG.googleSheetWebhookUrl;

  if (!webhookUrl) {
    statusBox.className = 'submit-status-box status-fallback';
    statusText.textContent = I18N[lang].statusLocalOnly;
    return;
  }

  statusBox.className = 'submit-status-box status-sending';
  statusText.textContent = I18N[lang].statusSending;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
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

  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += "Participant ID,Participant Name,Gender,Age,Start Time,End Time,Arab Female Winner,Arab Male Winner,Chinese Male Winner,Chinese Female Winner\n";

  const row = [
    `"${p.id}"`,
    `"${p.name || ''}"`,
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
  clearActiveSession();
  state.isSurveyActive = false;
  state.isSurveyCompleted = false;

  const partInput = document.getElementById('participant-id');
  if (partInput) partInput.value = '';

  const banner = document.getElementById('resume-session-banner');
  if (banner) banner.style.display = 'none';

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
  const catTitle = lang === 'ar' ? cat.titleAr : cat.titleEn;
  document.getElementById('cat-title').textContent = I18N[lang].catBadgePrefix + catTitle;
  document.getElementById('cat-progress-text').textContent = I18N[lang].catProgress(
    state.currentCategoryIndex + 1,
    SURVEY_CONFIG.categories.length
  );

  // Rounds
  const totalRoundsInCat = cat.totalImages - 1;
  document.getElementById('round-number-text').textContent = state.currentRoundNumber;
  document.getElementById('total-rounds-text').textContent = totalRoundsInCat;

  // Total Progress Percentage
  const totalSurveyComparisons = SURVEY_CONFIG.categories.reduce((acc, c) => acc + (c.totalImages - 1), 0);
  
  let currentTotalProgress = 0;
  for (let i = 0; i < state.currentCategoryIndex; i++) {
    currentTotalProgress += (SURVEY_CONFIG.categories[i].totalImages - 1);
  }
  currentTotalProgress += (state.currentRoundNumber - 1);

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
  const langLabel = document.querySelector('.lang-label');
  if (langLabel) langLabel.textContent = t.btnLang;

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
  document.getElementById('participant-id').placeholder = t.placeholderPartId;
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
  document.getElementById('lbl-select-a').querySelector('span').textContent = t.lblSelect;
  document.getElementById('lbl-select-b').querySelector('span').textContent = t.lblSelect;
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
window.resumeSavedSession = resumeSavedSession;
window.discardSavedSession = discardSavedSession;
