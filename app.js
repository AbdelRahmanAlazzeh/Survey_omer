/**
 * VISUAL PREFERENCE SURVEY - CORE APPLICATION ENGINE
 * Features:
 * - King of the Hill Pairwise Elimination with Full Section Gallery Explorer
 * - Direct Champion Election from Full Set Gallery
 * - 4 Face Categories with Dynamic Universal Aspect-Ratio Framing
 * - Resilient Session Recovery on Page Reload / Accidental Refresh
 * - Same-User Re-take Survey Support with Deduplicated Data Versioning
 * - Mandatory Full Name & Age Validation
 * - Google Sheets Realtime Webhook Integration & CSV/JSON Export
 */

// Application State
const state = {
  currentCategoryIndex: 0,
  currentChampionNumber: 1,
  currentChallengerNumber: 2,
  currentRoundNumber: 1,
  currentScreen: 'screen-welcome',
  
  // Participant Info
  participant: {
    id: '',
    name: '',
    gender: '',
    age: '',
    attempt: 1,
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
    lblPartId: "الاسم الكامل (مطلوب) * :",
    placeholderPartId: "أدخل اسمك الكامل...",
    lblGender: "الجنس (اختياري):",
    lblAge: "العمر (مطلوب) * :",
    placeholderAge: "مثال: 25",
    optSelect: "-- اختر --",
    optMale: "ذكر",
    optFemale: "أنثى",
    optOther: "أفضل عدم التحديد",
    btnStart: "بدء الاستبيان",
    lblComparison: "المقارنة:",
    catProgress: (c, t) => `المجموعة ${c} من ${t}`,
    catBadgePrefix: "المجموعة: ",
    arenaInstruction: "اختر الصورة الأكثر تفضيلاً بالنسبة لك",
    arenaSubhint: "انقر مباشرة على الصورة لاختيارها، أو اضغط الرقم (1 / 2) أو الأسهم (➡️ لليمين / ⬅️ لليسار)",
    lblChampion: "الخيار (1)",
    lblChallenger: "الخيار (2)",
    lblSelect: "اختيار هذا",
    hintKeyA: `<span>مفتاح</span> <span class="kbd">1</span> أو <span class="kbd">➡️</span>`,
    hintKeyB: `<span>مفتاح</span> <span class="kbd">2</span> أو <span class="kbd">⬅️</span>`,
    chooseLeft: ": اختيار الصورة باليمين (1)",
    chooseRight: ": اختيار الصورة باليسار (2)",
    arrowA: "➡️",
    arrowB: "⬅️",
    lblExploreGallery: "معرض جميع الصور",
    galleryTitle: "معرض كافة صور المجموعة",
    gallerySubtitle: "يمكنك استعراض كل الصور دفعة واحدة واختيار أي صورة مباشرة كخيار مفضل لك.",
    btnElectImage: "انتخاب كصورة مفضلة",
    lblCurrentChamp: "👑 الخيار الحالي",
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
    btnRetake: "إعادة الاستبيان لنفس المشارك",
    btnNewEval: "مشارك جديد",
    btnCsv: "تحميل تقرير (CSV)",
    btnJson: "تحميل البيانات (JSON)",
    imgTitle: (num) => `صورة #${num}`,
    resumeTitle: "لديك استبيان قيد التقدم",
    resumeDesc: (cat, round) => `يمكنك استئناف جلسة التقييم السابقة من (المجموعة ${cat}، الجولة ${round}) أو البدء من جديد.`,
    btnResume: "استئناف المتابعة",
    btnDiscard: "بدء جديد",
    attemptLabel: (num) => `المحاولة رقم: ${num}`,
    participantSummary: (name, age, attempt) => `المشارك: ${name} | العمر: ${age} سنة ${attempt > 1 ? `| المحاولة (${attempt})` : ''}`
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
    lblPartId: "Full Name (Required) * :",
    placeholderPartId: "Enter your full name...",
    lblGender: "Gender (Optional):",
    lblAge: "Age (Required) * :",
    placeholderAge: "e.g. 25",
    optSelect: "-- Select --",
    optMale: "Male",
    optFemale: "Female",
    optOther: "Prefer not to say",
    btnStart: "Start Survey",
    lblComparison: "Comparison:",
    catProgress: (c, t) => `Set ${c} of ${t}`,
    catBadgePrefix: "Set: ",
    arenaInstruction: "Select your preferred image",
    arenaSubhint: "Click directly on the image, or use keys (1 / 2) or arrow keys (⬅️ for Left / ➡️ for Right)",
    lblChampion: "Option 1",
    lblChallenger: "Option 2",
    lblSelect: "Select This",
    hintKeyA: `<span>Key</span> <span class="kbd">1</span> or <span class="kbd">⬅️</span>`,
    hintKeyB: `<span>Key</span> <span class="kbd">2</span> or <span class="kbd">➡️</span>`,
    chooseLeft: ": Choose Left (Option 1)",
    chooseRight: ": Choose Right (Option 2)",
    arrowA: "⬅️",
    arrowB: "➡️",
    lblExploreGallery: "Explore All Images",
    galleryTitle: "Full Set Image Gallery",
    gallerySubtitle: "Explore all images in this set at once or directly elect any image as your preferred option.",
    btnElectImage: "Elect as Preferred",
    lblCurrentChamp: "👑 Current Option",
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
    btnRetake: "Retake Survey (Same Participant)",
    btnNewEval: "New Participant",
    btnCsv: "Download CSV Report",
    btnJson: "Download JSON Data",
    imgTitle: (num) => `Image #${num}`,
    resumeTitle: "Survey in Progress",
    resumeDesc: (cat, round) => `You can resume your previous session from (Set ${cat}, Round ${round}) or start fresh.`,
    btnResume: "Resume Session",
    btnDiscard: "Start Fresh",
    attemptLabel: (num) => `Attempt #${num}`,
    participantSummary: (name, age, attempt) => `Participant: ${name} | Age: ${age} ${attempt > 1 ? `| Attempt #${attempt}` : ''}`
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  initEventListeners();
  initFormDraftListeners();
  restoreOrInitSession();
});

/**
 * Event Listeners & Keyboard Bindings
 */
function initEventListeners() {
  const btnTheme = document.getElementById('btn-toggle-theme');
  if (btnTheme) btnTheme.addEventListener('click', toggleTheme);
  
  const btnLang = document.getElementById('btn-toggle-lang');
  if (btnLang) btnLang.addEventListener('click', toggleLanguage);

  window.addEventListener('keydown', handleKeyNavigation);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeZoom();
      closeCategoryGallery();
    }
  });

  window.addEventListener('beforeunload', () => {
    saveActiveSession();
  });
}

/**
 * Sync form input fields with local state in real-time
 */
function initFormDraftListeners() {
  const nameInput = document.getElementById('participant-id');
  const ageInput = document.getElementById('participant-age');
  const genderInput = document.getElementById('participant-gender');

  const syncDraft = () => {
    if (!state.isSurveyActive && !state.isSurveyCompleted) {
      state.participant.name = nameInput ? nameInput.value.trim() : '';
      state.participant.age = ageInput ? ageInput.value.trim() : '';
      state.participant.gender = genderInput ? genderInput.value : '';
      saveActiveSession();
    }
  };

  if (nameInput) nameInput.addEventListener('input', syncDraft);
  if (ageInput) ageInput.addEventListener('input', syncDraft);
  if (genderInput) genderInput.addEventListener('change', syncDraft);
}

/**
 * Handle Keyboard Shortcuts
 */
function handleKeyNavigation(e) {
  const arenaScreen = document.getElementById('screen-arena');
  const galleryScreen = document.getElementById('screen-gallery');
  const zoomModal = document.getElementById('lightbox-modal');
  const interstitialModal = document.getElementById('interstitial-modal');
  
  if (!arenaScreen || !arenaScreen.classList.contains('active') || state.isProcessingDecision) return;
  if (galleryScreen && galleryScreen.classList.contains('active')) return;
  if (zoomModal && zoomModal.classList.contains('active')) return;
  if (interstitialModal && interstitialModal.classList.contains('active')) return;

  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  const isRtl = (document.documentElement.dir === 'rtl' || state.language === 'ar');

  if (e.key === '1') {
    e.preventDefault();
    selectOption('a');
  } else if (e.key === '2') {
    e.preventDefault();
    selectOption('b');
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    // Physical Right side card:
    // In RTL layout (Arabic), Card A (Option 1) is visually on the right.
    // In LTR layout (English), Card B (Option 2) is visually on the right.
    selectOption(isRtl ? 'a' : 'b');
  } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    // Physical Left side card:
    // In RTL layout (Arabic), Card B (Option 2) is visually on the left.
    // In LTR layout (English), Card A (Option 1) is visually on the left.
    selectOption(isRtl ? 'b' : 'a');
  }
}

/**
 * Start Survey with mandatory Full Name & Age validation
 */
function startSurvey() {
  const nameInput = document.getElementById('participant-id');
  const ageInput = document.getElementById('participant-age');
  const genderInput = document.getElementById('participant-gender');

  const fullName = (nameInput.value || '').trim();
  const ageVal = parseInt(ageInput.value, 10);

  if (!fullName || fullName.length < 2) {
    nameInput.focus();
    alert(state.language === 'ar' ? 'يرجى إدخال الاسم الكامل للمتابعة.' : 'Please enter your full name to proceed.');
    return;
  }

  if (isNaN(ageVal) || ageVal < 10 || ageVal > 115) {
    ageInput.focus();
    alert(state.language === 'ar' ? 'يرجى إدخال العمر بشكل صحيح بالأرقام.' : 'Please enter a valid age.');
    return;
  }

  const cleanId = fullName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/gi, '_') + '_' + ageVal;

  state.participant.name = fullName;
  state.participant.id = cleanId;
  state.participant.sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  state.participant.age = ageVal;
  state.participant.gender = genderInput ? genderInput.value : '';
  state.participant.attempt = state.participant.attempt || 1;
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
 * Retake Survey for the Same Participant
 */
function retakeSurveyForSameParticipant() {
  state.participant.attempt = (state.participant.attempt || 1) + 1;
  state.participant.startTime = new Date().toISOString();
  state.participant.endTime = null;

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
 * Save Active Session to localStorage continuously
 */
function saveActiveSession() {
  try {
    const isModalOpen = !!(document.getElementById('interstitial-modal')?.classList.contains('active'));
    const sessionData = {
      currentCategoryIndex: state.currentCategoryIndex,
      currentChampionNumber: state.currentChampionNumber,
      currentChallengerNumber: state.currentChallengerNumber,
      currentRoundNumber: state.currentRoundNumber,
      currentScreen: state.currentScreen || 'screen-welcome',
      participant: state.participant,
      winners: state.winners,
      history: state.history,
      isSurveyActive: state.isSurveyActive,
      isSurveyCompleted: state.isSurveyCompleted,
      language: state.language,
      theme: state.theme,
      isTransitionModalOpen: isModalOpen
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
 * Automatically Restore session on page load / reload seamlessly
 */
function restoreOrInitSession() {
  try {
    const raw = localStorage.getItem('SURVEY_ACTIVE_SESSION');
    if (!raw) {
      showScreen('screen-welcome');
      return;
    }
    const s = JSON.parse(raw);
    if (!s) {
      showScreen('screen-welcome');
      return;
    }

    state.currentCategoryIndex = typeof s.currentCategoryIndex === 'number' ? s.currentCategoryIndex : 0;
    state.currentChampionNumber = s.currentChampionNumber || 1;
    state.currentChallengerNumber = s.currentChallengerNumber || 2;
    state.currentRoundNumber = s.currentRoundNumber || 1;
    state.participant = s.participant || { id: '', name: '', gender: '', age: '', attempt: 1 };
    state.winners = Array.isArray(s.winners) ? s.winners : [];
    state.history = Array.isArray(s.history) ? s.history : [];
    state.isSurveyActive = !!s.isSurveyActive;
    state.isSurveyCompleted = !!s.isSurveyCompleted;

    // Restore Form inputs if user was on welcome screen
    const nameInput = document.getElementById('participant-id');
    const ageInput = document.getElementById('participant-age');
    const genderInput = document.getElementById('participant-gender');
    if (nameInput && state.participant.name) nameInput.value = state.participant.name;
    if (ageInput && state.participant.age) ageInput.value = state.participant.age;
    if (genderInput && state.participant.gender) genderInput.value = state.participant.gender;

    const screenToRestore = s.currentScreen || (state.isSurveyActive ? 'screen-arena' : (state.isSurveyCompleted ? 'screen-results' : 'screen-welcome'));

    if (state.isSurveyActive && !state.isSurveyCompleted) {
      // User was in an active survey - restore directly without redirecting to welcome screen
      document.getElementById('survey-status-bar').classList.add('active');

      if (screenToRestore === 'screen-gallery') {
        updateStatusBar();
        openCategoryGallery();
      } else {
        showScreen('screen-arena');
        adaptArenaFraming();
        updateStatusBar();
        loadCurrentRound();

        if (s.isTransitionModalOpen) {
          handleCategoryCompletion();
        }
      }
    } else if (state.isSurveyCompleted) {
      // User was on the completed results screen
      document.getElementById('survey-status-bar').classList.remove('active');
      showScreen('screen-results');

      const pTag = document.getElementById('participant-summary-tag');
      if (pTag) {
        pTag.textContent = I18N[state.language].participantSummary(
          state.participant.name,
          state.participant.age,
          state.participant.attempt || 1
        );
      }
      renderWinnersGrid();

      const statusBox = document.getElementById('submission-status');
      const statusText = document.getElementById('status-text');
      if (statusBox && statusText) {
        statusBox.className = 'submit-status-box status-success';
        statusText.textContent = I18N[state.language].statusSuccess;
      }
    } else {
      showScreen('screen-welcome');
    }
  } catch (err) {
    console.warn('Session restore error:', err);
    showScreen('screen-welcome');
  }
}

/**
 * Resume Saved Session (Fallback handler if invoked)
 */
function resumeSavedSession() {
  restoreOrInitSession();
}

/**
 * Discard Saved Session
 */
function discardSavedSession() {
  resetForNewParticipant();
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

  updateStatusBar();

  const imgA = document.getElementById('img-candidate-a');
  const imgB = document.getElementById('img-candidate-b');

  setImageSource(imgA, category, state.currentChampionNumber);
  setImageSource(imgB, category, state.currentChallengerNumber);

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
 * Select candidate by Option key: 'a' (Option 1) or 'b' (Option 2)
 */
function selectOption(choiceKey) {
  if (state.isProcessingDecision) return;
  state.isProcessingDecision = true;

  const reactionTime = Math.round(performance.now() - state.lastRoundStartTime);
  const category = SURVEY_CONFIG.categories[state.currentCategoryIndex];
  
  const championNumber = state.currentChampionNumber;
  const challengerNumber = state.currentChallengerNumber;
  const isOptionA = (choiceKey === 'a');
  const chosenNumber = isOptionA ? championNumber : challengerNumber;
  const eliminatedNumber = isOptionA ? challengerNumber : championNumber;

  // Log round decision
  state.history.push({
    participantId: state.participant.id,
    participantName: state.participant.name,
    participantAge: state.participant.age,
    attemptNumber: state.participant.attempt || 1,
    categoryId: category.id,
    categoryTitle: category.titleEn,
    roundNumber: state.currentRoundNumber,
    optionAImage: championNumber,
    optionBImage: challengerNumber,
    leftImage: championNumber,
    rightImage: challengerNumber,
    winnerChosen: chosenNumber,
    eliminatedImage: eliminatedNumber,
    selectionMethod: 'pairwise_choice',
    reactionTimeMs: reactionTime,
    timestamp: new Date().toISOString()
  });

  const chosenCard = isOptionA ? document.getElementById('card-candidate-a') : document.getElementById('card-candidate-b');
  if (chosenCard) {
    chosenCard.classList.add('card-selected');
  }

  setTimeout(() => {
    if (chosenCard) chosenCard.classList.remove('card-selected');

    state.currentChampionNumber = chosenNumber;

    if (state.currentRoundNumber >= category.totalImages - 1) {
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
      state.currentRoundNumber += 1;
      state.currentChallengerNumber += 1;
      saveActiveSession();
      loadCurrentRound();
    }
  }, 180);
}

/**
 * Handle user choice by physical side or option key (for compatibility)
 */
function selectWinner(sideOrKey) {
  if (sideOrKey === 'a' || sideOrKey === 'b') {
    selectOption(sideOrKey);
    return;
  }
  const isRtl = (document.documentElement.dir === 'rtl' || state.language === 'ar');
  if (sideOrKey === 'left') {
    // Physical Left: In RTL (Arabic) that's Card B, in LTR (English) that's Card A
    selectOption(isRtl ? 'b' : 'a');
  } else if (sideOrKey === 'right') {
    // Physical Right: In RTL (Arabic) that's Card A, in LTR (English) that's Card B
    selectOption(isRtl ? 'a' : 'b');
  }
}

/**
 * ==========================================================================
 * FULL CATEGORY GALLERY EXPLORER & DIRECT ELECTION FEATURE
 * ==========================================================================
 */
function openCategoryGallery() {
  const grid = document.getElementById('gallery-grid');
  const category = SURVEY_CONFIG.categories[state.currentCategoryIndex];
  const lang = state.language;
  const t = I18N[lang];

  const catName = lang === 'ar' ? category.titleAr : category.titleEn;
  const countText = lang === 'ar' ? `[${category.totalImages} صورة]` : `[${category.totalImages} images]`;

  document.getElementById('gallery-title').textContent = `🖼️ ${t.galleryTitle}: ${catName} ${countText}`;
  document.getElementById('gallery-subtitle').textContent = t.gallerySubtitle;

  grid.innerHTML = '';

  const isLandscape = category.aspectRatioType === 'landscape';

  for (let i = 1; i <= category.totalImages; i++) {
    const isCurrentChamp = (i === state.currentChampionNumber);
    const card = document.createElement('div');
    card.className = `inpage-gallery-card ${isCurrentChamp ? 'current-champion' : ''} ${isLandscape ? 'item-landscape' : 'item-portrait'}`;

    card.innerHTML = `
      <div class="gallery-thumb-wrap">
        <img id="gallery-img-${i}" class="gallery-thumb" src="" alt="${category.id} #${i}" loading="lazy">
        <span class="gallery-num-badge">#${i}</span>
        ${isCurrentChamp ? `<span class="gallery-champ-badge">${t.lblCurrentChamp}</span>` : ''}
        <button type="button" class="gallery-zoom-btn" onclick="event.stopPropagation(); zoomImage('gallery-img-${i}')" title="تكبير للمعاينة">🔍</button>
      </div>
      <div class="gallery-card-actions">
        <button type="button" class="btn-elect-image ${isCurrentChamp ? 'btn-is-champ' : ''}" onclick="electGalleryImage(${i})">
          ${isCurrentChamp ? t.lblCurrentChamp : ('🏆 ' + t.btnElectImage)}
        </button>
      </div>
    `;

    grid.appendChild(card);

    const imgEl = document.getElementById(`gallery-img-${i}`);
    setImageSource(imgEl, category, i);
  }

  showScreen('screen-gallery');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeCategoryGallery() {
  showScreen('screen-arena');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Directly Elect an image from the full gallery as the current category champion
 */
function electGalleryImage(imageNumber) {
  const category = SURVEY_CONFIG.categories[state.currentCategoryIndex];

  state.currentChampionNumber = imageNumber;

  state.history.push({
    participantId: state.participant.id,
    participantName: state.participant.name,
    participantAge: state.participant.age,
    attemptNumber: state.participant.attempt || 1,
    categoryId: category.id,
    categoryTitle: category.titleEn,
    roundNumber: state.currentRoundNumber,
    leftImage: imageNumber,
    rightImage: state.currentChallengerNumber,
    winnerChosen: imageNumber,
    eliminatedImage: 'N/A',
    selectionMethod: 'direct_gallery_election',
    reactionTimeMs: 0,
    timestamp: new Date().toISOString()
  });

  closeCategoryGallery();
  saveActiveSession();
  loadCurrentRound();
}

/**
 * Handle transition when a category completes
 */
function handleCategoryCompletion() {
  const currentCat = SURVEY_CONFIG.categories[state.currentCategoryIndex];
  const lang = state.language;

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
    saveActiveSession();
  }
}

/**
 * Proceed to next category from modal
 */
function proceedToNextCategory() {
  document.getElementById('interstitial-modal').classList.remove('active');
  startCategory(state.currentCategoryIndex + 1);
  saveActiveSession();
}

/**
 * Finish Survey & Render Results
 */
function finishSurvey() {
  state.participant.endTime = new Date().toISOString();
  state.isSurveyActive = false;
  state.isSurveyCompleted = true;
  state.currentScreen = 'screen-results';

  document.getElementById('survey-status-bar').classList.remove('active');
  
  showScreen('screen-results');
  saveActiveSession();

  const pTag = document.getElementById('participant-summary-tag');
  if (pTag) {
    pTag.textContent = I18N[state.language].participantSummary(
      state.participant.name,
      state.participant.age,
      state.participant.attempt || 1
    );
  }

  renderWinnersGrid();
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

  const currentAttempt = state.participant.attempt || 1;
  const botCheckVal = document.getElementById('contact-website-check')?.value || '';

  const payload = {
    sessionId: state.participant.sessionId || ('sess_' + Date.now()),
    botCheck: botCheckVal,
    participantId: state.participant.id,
    participantName: state.participant.name,
    participantAge: state.participant.age,
    gender: state.participant.gender || 'N/A',
    attemptNumber: currentAttempt,
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

  const webhookUrl = SURVEY_CONFIG.googleSheetWebhookUrl;

  if (!webhookUrl) {
    statusBox.className = 'submit-status-box status-fallback';
    statusText.textContent = I18N[lang].statusLocalOnly;
    return;
  }

  statusBox.className = 'submit-status-box status-sending';
  statusText.textContent = I18N[lang].statusSending;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    statusBox.className = 'submit-status-box status-success';
    statusText.textContent = I18N[lang].statusSuccess;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Submission error:', err);
    statusBox.className = 'submit-status-box status-fallback';
    statusText.textContent = I18N[lang].statusLocalOnly;
  }
}

/**
 * Sanitize cell values for CSV export (Prevents CSV Formula Injection)
 */
function safeCsvField(val) {
  if (val === null || val === undefined) return '""';
  let s = String(val).replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s;
  }
  return `"${s}"`;
}

/**
 * Export Single Participant to CSV
 */
function exportDataAsCSV() {
  const p = state.participant;
  const w = state.winners;

  let csvContent = "\uFEFF";
  csvContent += "Participant ID,Full Name,Age,Gender,Attempt #,Start Time,End Time,Arab Female Winner,Arab Male Winner,Chinese Male Winner,Chinese Female Winner\n";

  const row = [
    safeCsvField(p.id),
    safeCsvField(p.name),
    safeCsvField(p.age),
    safeCsvField(p.gender),
    safeCsvField(p.attempt || 1),
    safeCsvField(p.startTime),
    safeCsvField(p.endTime),
    safeCsvField(w.find(x => x.categoryId === 'arab_female')?.winnerImageNumber || ''),
    safeCsvField(w.find(x => x.categoryId === 'arab_male')?.winnerImageNumber || ''),
    safeCsvField(w.find(x => x.categoryId === 'chinese_male')?.winnerImageNumber || ''),
    safeCsvField(w.find(x => x.categoryId === 'chinese_female')?.winnerImageNumber || '')
  ].join(",");

  csvContent += row + "\n\n";

  csvContent += "Decision Log\n";
  csvContent += "Category,Round,Left Image,Right Image,Winner Chosen,Selection Method,Reaction Time (ms),Timestamp\n";

  state.history.forEach(h => {
    csvContent += [
      `"${h.categoryId}"`,
      h.roundNumber,
      h.leftImage,
      h.rightImage,
      h.winnerChosen,
      `"${h.selectionMethod || 'pairwise'}"`,
      h.reactionTimeMs,
      `"${h.timestamp}"`
    ].join(",") + "\n";
  });

  downloadFile(csvContent, `survey_results_${p.id}_attempt_${p.attempt || 1}.csv`, 'text/csv;charset=utf-8;');
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
  downloadFile(jsonStr, `survey_data_${state.participant.id}_attempt_${state.participant.attempt || 1}.json`, 'application/json');
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
 * Reset application for a fresh new participant
 */
function resetForNewParticipant() {
  clearActiveSession();
  state.isSurveyActive = false;
  state.isSurveyCompleted = false;
  state.currentCategoryIndex = 0;
  state.currentChampionNumber = 1;
  state.currentChallengerNumber = 2;
  state.currentRoundNumber = 1;
  state.winners = [];
  state.history = [];

  state.participant = {
    id: '',
    name: '',
    gender: '',
    age: '',
    attempt: 1,
    startTime: null,
    endTime: null
  };

  const nameInput = document.getElementById('participant-id');
  if (nameInput) nameInput.value = '';

  const ageInput = document.getElementById('participant-age');
  if (ageInput) ageInput.value = '';

  const genderInput = document.getElementById('participant-gender');
  if (genderInput) genderInput.value = '';

  const banner = document.getElementById('resume-session-banner');
  if (banner) banner.style.display = 'none';

  document.getElementById('survey-status-bar').classList.remove('active');
  showScreen('screen-welcome');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Update the Top Progress & Status Bar
 */
function updateStatusBar() {
  const cat = SURVEY_CONFIG.categories[state.currentCategoryIndex];
  const lang = state.language;

  if (!cat) return;

  const catTitle = lang === 'ar' ? cat.titleAr : cat.titleEn;
  const catTitleEl = document.getElementById('cat-title');
  if (catTitleEl) catTitleEl.textContent = I18N[lang].catBadgePrefix + catTitle;
  
  const catProgressEl = document.getElementById('cat-progress-text');
  if (catProgressEl) {
    catProgressEl.textContent = I18N[lang].catProgress(
      state.currentCategoryIndex + 1,
      SURVEY_CONFIG.categories.length
    );
  }

  const totalRoundsInCat = cat.totalImages - 1;
  const roundNumberEl = document.getElementById('round-number-text');
  const totalRoundsEl = document.getElementById('total-rounds-text');
  if (roundNumberEl) roundNumberEl.textContent = state.currentRoundNumber;
  if (totalRoundsEl) totalRoundsEl.textContent = totalRoundsInCat;

  const totalSurveyComparisons = SURVEY_CONFIG.categories.reduce((acc, c) => acc + (c.totalImages - 1), 0);
  
  let currentTotalProgress = 0;
  for (let i = 0; i < state.currentCategoryIndex; i++) {
    currentTotalProgress += (SURVEY_CONFIG.categories[i].totalImages - 1);
  }
  currentTotalProgress += (state.currentRoundNumber - 1);

  const percentage = Math.min(100, Math.round((currentTotalProgress / totalSurveyComparisons) * 100));
  const progressFillEl = document.getElementById('progress-fill');
  if (progressFillEl) progressFillEl.style.width = `${percentage}%`;
}

/**
 * Switch Active Screen View
 */
function showScreen(screenId) {
  document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
  state.currentScreen = screenId;
  saveActiveSession();
}

/**
 * Toggle Language (Arabic / English)
 */
function toggleLanguage() {
  state.language = state.language === 'ar' ? 'en' : 'ar';
  const lang = state.language;
  localStorage.setItem('SURVEY_LANGUAGE', lang);

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

  applyLanguageTexts();
  saveActiveSession();
}

/**
 * Initialize Language from LocalStorage
 */
function initLanguage() {
  const savedLang = localStorage.getItem('SURVEY_LANGUAGE') || 'ar';
  state.language = savedLang;

  document.documentElement.lang = savedLang;
  document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  document.body.dir = savedLang === 'ar' ? 'rtl' : 'ltr';

  applyLanguageTexts();
}

/**
 * Apply all translations to DOM
 */
function applyLanguageTexts() {
  const lang = state.language;
  const t = I18N[lang];

  const appTitle = document.getElementById('app-title-text');
  if (appTitle) appTitle.textContent = t.appTitle;
  
  const langLabel = document.querySelector('.lang-label');
  if (langLabel) langLabel.textContent = t.btnLang;

  // Welcome Screen
  const welcomeHeading = document.getElementById('welcome-heading');
  if (welcomeHeading) welcomeHeading.textContent = t.welcomeHeading;
  
  const welcomeSubtext = document.getElementById('welcome-subtext');
  if (welcomeSubtext) welcomeSubtext.textContent = t.welcomeSubtext;

  const inst1Title = document.getElementById('inst-1-title');
  if (inst1Title) inst1Title.textContent = t.inst1Title;

  const inst1Desc = document.getElementById('inst-1-desc');
  if (inst1Desc) inst1Desc.textContent = t.inst1Desc;

  const inst2Title = document.getElementById('inst-2-title');
  if (inst2Title) inst2Title.textContent = t.inst2Title;

  const inst2Desc = document.getElementById('inst-2-desc');
  if (inst2Desc) inst2Desc.textContent = t.inst2Desc;

  const inst3Title = document.getElementById('inst-3-title');
  if (inst3Title) inst3Title.textContent = t.inst3Title;

  const inst3Desc = document.getElementById('inst-3-desc');
  if (inst3Desc) inst3Desc.textContent = t.inst3Desc;

  const lblPartId = document.getElementById('lbl-part-id');
  if (lblPartId) lblPartId.textContent = t.lblPartId;

  const partId = document.getElementById('participant-id');
  if (partId) partId.placeholder = t.placeholderPartId;

  const lblAge = document.getElementById('lbl-age');
  if (lblAge) lblAge.textContent = t.lblAge;

  const partAge = document.getElementById('participant-age');
  if (partAge) partAge.placeholder = t.placeholderAge;

  const lblGender = document.getElementById('lbl-gender');
  if (lblGender) lblGender.textContent = t.lblGender;

  const optSelect = document.getElementById('opt-select');
  if (optSelect) optSelect.textContent = t.optSelect;

  const optMale = document.getElementById('opt-male');
  if (optMale) optMale.textContent = t.optMale;

  const optFemale = document.getElementById('opt-female');
  if (optFemale) optFemale.textContent = t.optFemale;

  const optOther = document.getElementById('opt-other');
  if (optOther) optOther.textContent = t.optOther;

  const btnStart = document.getElementById('btn-start-survey');
  if (btnStart && btnStart.querySelector('span')) btnStart.querySelector('span').textContent = t.btnStart;

  // Status Bar
  const lblComp = document.getElementById('lbl-comparison');
  if (lblComp) lblComp.textContent = t.lblComparison;
  updateStatusBar();

  // Arena Screen
  const arenaInst = document.getElementById('arena-instruction');
  if (arenaInst) arenaInst.textContent = t.arenaInstruction;

  const arenaSub = document.getElementById('arena-subhint');
  if (arenaSub) arenaSub.textContent = t.arenaSubhint;

  const lblChamp = document.getElementById('lbl-champion');
  if (lblChamp) lblChamp.textContent = t.lblChampion;

  const lblChal = document.getElementById('lbl-challenger');
  if (lblChal) lblChal.textContent = t.lblChallenger;

  const lblSelA = document.getElementById('lbl-select-a');
  if (lblSelA && lblSelA.querySelector('span')) lblSelA.querySelector('span').textContent = t.lblSelect;

  const lblSelB = document.getElementById('lbl-select-b');
  if (lblSelB && lblSelB.querySelector('span')) lblSelB.querySelector('span').textContent = t.lblSelect;

  const hintKeyA = document.getElementById('hint-key-a');
  if (hintKeyA) hintKeyA.innerHTML = t.hintKeyA;

  const hintKeyB = document.getElementById('hint-key-b');
  if (hintKeyB) hintKeyB.innerHTML = t.hintKeyB;

  const hintArrowA = document.getElementById('hint-arrow-a');
  if (hintArrowA) hintArrowA.textContent = t.arrowA;

  const hintArrowB = document.getElementById('hint-arrow-b');
  if (hintArrowB) hintArrowB.textContent = t.arrowB;

  const lblExpGal = document.getElementById('lbl-explore-gallery');
  if (lblExpGal) lblExpGal.textContent = t.lblExploreGallery;

  const txtLeft = document.getElementById('txt-choose-left');
  if (txtLeft) txtLeft.textContent = t.chooseLeft;

  const txtRight = document.getElementById('txt-choose-right');
  if (txtRight) txtRight.textContent = t.chooseRight;

  const txtClose = document.getElementById('txt-close-zoom');
  if (txtClose) txtClose.textContent = t.closeZoom;

  // Gallery Modal
  const galTitle = document.getElementById('gallery-title');
  if (galTitle) galTitle.textContent = t.galleryTitle;

  const galSub = document.getElementById('gallery-subtitle');
  if (galSub) galSub.textContent = t.gallerySubtitle;

  // Interstitial Modal
  const btnNext = document.getElementById('btn-next-cat-text');
  if (btnNext) btnNext.textContent = t.btnNextCat;

  // Results Screen
  const resHeading = document.getElementById('res-heading');
  if (resHeading) resHeading.textContent = t.resHeading;

  const resSub = document.getElementById('res-subtext');
  if (resSub) resSub.textContent = t.resSubtext;

  const btnRetake = document.getElementById('btn-retake-text');
  if (btnRetake) btnRetake.textContent = t.btnRetake;

  const btnNew = document.getElementById('btn-new-eval-text');
  if (btnNew) btnNew.textContent = t.btnNewEval;

  const btnCsv = document.getElementById('btn-csv-text');
  if (btnCsv) btnCsv.textContent = t.btnCsv;

  const btnJson = document.getElementById('btn-json-text');
  if (btnJson) btnJson.textContent = t.btnJson;

  if (document.getElementById('screen-results') && document.getElementById('screen-results').classList.contains('active')) {
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
  const btnTheme = document.getElementById('btn-toggle-theme');
  if (btnTheme) btnTheme.textContent = newTheme === 'dark' ? '🌙' : '☀️';
  state.theme = newTheme;
  localStorage.setItem('SURVEY_THEME', newTheme);
}

/**
 * Initialize Theme from LocalStorage
 */
function initTheme() {
  const savedTheme = localStorage.getItem('SURVEY_THEME') || 'dark';
  state.theme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  const btnTheme = document.getElementById('btn-toggle-theme');
  if (btnTheme) btnTheme.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
}

/**
 * Lightbox / Zoom functions
 */
function zoomImage(imgElementId) {
  const imgEl = document.getElementById(imgElementId);
  if (!imgEl) return;
  const src = imgEl.src;
  const modal = document.getElementById('lightbox-modal');
  const lightImg = document.getElementById('lightbox-img');
  lightImg.src = src;
  modal.classList.add('active');
}

function closeZoom() {
  document.getElementById('lightbox-modal').classList.remove('active');
}

// Global exports
window.startSurvey = startSurvey;
window.selectOption = selectOption;
window.selectWinner = selectWinner;
window.proceedToNextCategory = proceedToNextCategory;
window.zoomImage = zoomImage;
window.closeZoom = closeZoom;
window.exportDataAsCSV = exportDataAsCSV;
window.exportDataAsJSON = exportDataAsJSON;
window.resetForNewParticipant = resetForNewParticipant;
window.retakeSurveyForSameParticipant = retakeSurveyForSameParticipant;
window.resumeSavedSession = resumeSavedSession;
window.discardSavedSession = discardSavedSession;
window.openCategoryGallery = openCategoryGallery;
window.closeCategoryGallery = closeCategoryGallery;
window.electGalleryImage = electGalleryImage;
