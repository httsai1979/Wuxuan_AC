const DEFAULT_SCRIPT_ID = "AKfycbyrTsmh5DHR1_pQlS7A0UQVI7cT4m4pp4ijPNbyy5itzjb8EFiuo8qSKN4rA9IfEGp00Q";

// --- Expanded FAQ Data ---
const faqList = [
  { id: "PRE01", q: "為什麼需要知道有沒有 220V 插座？", a: "冷氣是高功率電器，必須使用專用迴路 (220V) 才能安全運作。如果現場只有一般插座 (110V)，師傅需要從電箱重新拉一條專用線，這會產生額外的材料費（電線、無熔絲開關）與工資。若不確定，請選「不確定」，師傅會帶儀器現場檢測。", tags: ["pre"], sample: "無 220V → 需加收配電費約 $3500 起" },
  { id: "PRE02", q: "如何判斷管線長度？會影響價格嗎？", a: "標準安裝通常包含 3~5 米的銅管（約一層樓高或隔一道牆的距離）。如果室外機安裝位置離室內機很遠（例如跨樓層、繞過轉角），就需要加長銅管。銅管每米約 $400-$500，長度越長，材料費越高，且冷房效率可能會些微下降。", tags: ["pre"], sample: "跨樓層通常需加收管線費" },
  { id: "PRE03", q: "什麼是「洗孔」？我家需要嗎？", a: "如果牆壁上沒有預留冷氣管線孔，就需要鑽一個洞讓管線通過，這就是洗孔。洗孔需要專用機具，且需避開鋼筋與管線。如果有預留孔或走窗戶縫隙，則不需要洗孔。", tags: ["pre"], sample: "洗孔費約 $800-$1200/孔" },
  { id: "PRE04", q: "為什麼室外機位置會影響價格？", a: "室外機安裝位置決定了施工難度與危險性。放在陽台地板最便宜；掛在外牆需要鐵架；若外牆無立足點（懸空），師傅需要穿戴高空安全裝備甚至租用吊車，風險極高，因此會有「危險施工加給」。", tags: ["pre"], sample: "無陽台懸掛 → 危險施工費" },
  { id: "PRE05", q: "舊機回收需要費用嗎？", a: "如果您有舊冷氣需要拆除並回收，我們在安裝新機時可以一併處理。通常拆機需要工資（冷媒回收、拆卸），但若由我們回收舊機，部分情況下可折抵拆機費。詳情請詢問師傅。", tags: ["pre"] },
  { id: "DUR01", q: "安裝需要多久時間？", a: "標準安裝一台分離式冷氣約需 2-3 小時。若需洗孔、拉電源線或危險施工，時間會延長。建議您預留半天的時間。", tags: ["during"] },
  { id: "DUR02", q: "為什麼需要安裝排水器？", a: "冷氣運作時會產生冷凝水。若安裝位置附近有排水孔，水可自然流出。若無排水孔（例如在臥室內牆），就需要安裝「排水器」將水抽到遠處排放，否則會漏水。", tags: ["during"], sample: "無排水孔 → 需裝排水器 ($1500起)" },
  { id: "DUR03", q: "什麼是「抽真空」？一定要做嗎？", a: "一定要！新式冷媒 (R32/R410A) 對水分非常敏感。抽真空能將管內的空氣與水分抽出，確保冷媒純度。若未抽真空，冷氣會不冷、耗電，甚至損壞壓縮機。", tags: ["during"] },
  { id: "DUR04", q: "施工時會弄髒家裡嗎？", a: "我們會做好基本防護（鋪設地墊），鑽孔時也會使用集塵袋。但施工難免會有粉塵，建議您先將貴重物品移開或覆蓋。", tags: ["during"] },
  { id: "POST01", q: "安裝後有保固嗎？", a: "有的！我們提供「施工保固 1 年」，包含冷媒管路氣密、排水管暢通、固定架穩固等。機器本身則依原廠保固條款（通常全機 3-7 年，壓縮機 10 年）。", tags: ["post"] },
  { id: "POST02", q: "冷氣多久要保養一次？", a: "建議每年保養一次，最好在夏季使用前（3-4月）。定期清洗濾網（每2週）可維持冷房效果。若發現冷氣有霉味或不冷，建議預約「保養清洗」服務。", tags: ["post"] },
  { id: "POST03", q: "為什麼剛裝好冷氣會有塑膠味？", a: "新機內部的塑膠件或防鏽油在初期運轉時可能會有些許味道，通常使用幾天後就會消失。若有燒焦味則不正常，請立即關機並聯絡我們。", tags: ["post"] },
  { id: "POST04", q: "冷氣不冷怎麼辦？", a: "請先檢查：1. 濾網是否太髒？ 2. 門窗是否關好？ 3. 溫度設定是否正確？ 若都正常但還是不冷，可能是冷媒洩漏或機器故障，請預約「維修檢測」。", tags: ["post"] }
];

const infoCards = [
  { id: "i-220v", title: "為什麼 220V 很重要？", body_html: "<p>冷氣是高耗電家電，啟動電流很大。一般插座 (110V) 電壓不足，硬插會導致跳電甚至電線走火。</p><p><strong>如果沒有 220V：</strong><br>師傅必須從總電箱拉一條專用線到冷氣旁。這涉及到：<br>1. 線材費 (依長度)<br>2. 無熔絲開關 (保護電路)<br>3. 穿線工資<br><strong>費用約 $3500 - $6500 不等。</strong></p>" },
  { id: "i-wall", title: "坪數怎麼看？", body_html: "<p>選對坪數很重要！噸數太小冷氣會一直全速運轉，耗電又易壞。</p><ul><li><strong>一張雙人床 ≈ 1 坪</strong></li><li><strong>標準臥室 (3-5 坪)</strong>: 放一張雙人床 + 衣櫃後還有走道。</li><li><strong>客廳 (6-8 坪)</strong>: 通常比臥室大一倍。</li></ul><p><strong>注意：</strong>若有西曬、頂樓或挑高，請務必選大一級的噸數。</p>" },
  { id: "i-outdoor", title: "室外機位置與費用", body_html: "<p>室外機安裝難度決定了工資高低。</p><ul><li><strong>陽台/地面 (標準)</strong>: 師傅可站立施工，最安全，費用最低。</li><li><strong>外牆+鐵窗 (中等)</strong>: 需爬出窗外，有鐵窗踩踏，需加收危險施工費。</li><li><strong>外牆懸掛 (高危險)</strong>: 完全無立足點，需使用高空繩索或吊車。<strong>這是拿命在拚，費用最高 ($2000-$4000)。</strong></li></ul>" }
];

let settings = {
  tax_rate: 0.00,
  free_radius_km: 8
};

let pricingRules = [];

const state = {
  serviceType: "install",
  currentStep: 0,
  estimate: { min: 0, max: 0 },
  jobId: null,
  photoQueue: [],
  folderId: null,
  calendar: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
  form: {
    serviceType: "install",
    room_size: "",
    has_220v: true,
    outdoor_pos: "balcony",
    relocate_mode: "none",
    origin_address: "",
    name: "",
    phone: "",
    address: "",
    date: "",
    slot: "am",
    repair_desc: ""
  }
};

// DOM Elements
const homeSection = document.getElementById("home-section");
const wizardSection = document.getElementById("wizard-section");
const successSection = document.getElementById("success-section");
const orderStatusSection = document.getElementById("order-status-section");
const wizardTitle = document.getElementById("wizard-title");
const wizardIndicator = document.getElementById("wizard-step-indicator");
const progressBar = document.getElementById("progress-bar");
const wizardForm = document.getElementById("wizard-form");
const steps = Array.from(document.querySelectorAll(".wizard-step"));
const nextBtn = document.querySelector('[data-action="next-step"]');
const prevBtn = document.querySelector('[data-action="prev-step"]');
const footerNav = document.getElementById("footer-nav");
const faqGroup = document.getElementById("faq-group");
const infoModal = document.getElementById("info-modal");
const infoModalTitle = document.getElementById("info-modal-title");
const infoModalBody = document.getElementById("info-modal-body");
const infoModalClose = document.getElementById("info-modal-close");
const themeToggle = document.getElementById("theme-toggle");

// Connection Banner
const connectionBanner = document.getElementById("connection-banner");
const apiUrlInput = document.getElementById("api-url-input");
const btnSaveUrl = document.getElementById("btn-save-url");

// Calendar
const calPrev = document.getElementById("cal-prev");
const calNext = document.getElementById("cal-next");
const calMonthLabel = document.getElementById("cal-month-label");
const calBody = document.getElementById("calendar-body");

// Order Status
const btnCheckOrder = document.getElementById("btn-check-order");
const btnCloseOrder = document.querySelector('[data-action="close-order-status"]');
const btnDoQuery = document.getElementById("btn-do-query");
const queryPhone = document.getElementById("query-phone");
const queryJobId = document.getElementById("query-job-id");
const queryResult = document.getElementById("query-result");

init();

async function init() {
  initTheme();
  showHome();
  populateFAQ();

  // Setup Connection Config
  const savedUrl = localStorage.getItem("custom_script_url");
  if (savedUrl) {
    apiUrlInput.value = savedUrl;
  } else {
    apiUrlInput.value = DEFAULT_SCRIPT_ID;
  }

  btnSaveUrl.addEventListener("click", () => {
    let val = apiUrlInput.value.trim();
    if (val.includes("/s/")) {
      const match = val.match(/\/s\/([^\/]+)\/exec/);
      if (match) val = match[1];
    }
    localStorage.setItem("custom_script_url", val);
    location.reload();
  });

  // Attempt to fetch settings
  try {
    await fetchSettings();
    connectionBanner.classList.add("hidden");
  } catch (e) {
    console.error("Connection failed", e);
    connectionBanner.classList.remove("hidden");
  }

  document.querySelectorAll('[data-action="install"], [data-action="relocate"], [data-action="repair"], [data-action="clean"]').forEach(btn => {
    btn.addEventListener("click", (e) => showWizard(e.currentTarget.dataset.action));
  });

  document.querySelectorAll('[data-action="back-home"]').forEach(btn => btn.addEventListener("click", showHome));

  nextBtn.addEventListener("click", handleNext);
  prevBtn.addEventListener("click", handlePrev);
  wizardForm.addEventListener("input", handleFormInput);
  themeToggle.addEventListener("click", toggleTheme);

  // Info Modal
  document.querySelectorAll('[data-info]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openInfoCard(e.currentTarget.dataset.info);
    });
  });
  infoModalClose.addEventListener("click", () => infoModal.classList.add("hidden"));

  // Photo Upload
  document.querySelectorAll('.upload-card input[type="file"]').forEach(input => {
    input.addEventListener("change", (e) => handlePhotoSelection(e.target.closest('.upload-card').dataset.uploadTarget, e.target.files));
  });

  // Calendar
  calPrev.addEventListener("click", () => changeMonth(-1));
  calNext.addEventListener("click", () => changeMonth(1));

  // Order Status
  btnCheckOrder.addEventListener("click", () => {
    orderStatusSection.classList.remove("hidden");
    homeSection.classList.add("hidden");
    connectionBanner.classList.add("hidden");
  });
  btnCloseOrder.addEventListener("click", () => {
    orderStatusSection.classList.add("hidden");
    homeSection.classList.remove("hidden");
    if (pricingRules.length === 0) connectionBanner.classList.remove("hidden");
  });
  btnDoQuery.addEventListener("click", handleOrderQuery);

  // FAQ Filter
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-filter]').forEach(b => {
        b.classList.remove('bg-slate-900', 'dark:bg-white', 'text-white', 'dark:text-slate-900', 'shadow-md');
        b.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-500');
      });
      e.target.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-500');
      e.target.classList.add('bg-slate-900', 'dark:bg-white', 'text-white', 'dark:text-slate-900', 'shadow-md');
      filterFAQByCategory(e.target.dataset.filter);
    });
  });
}

function initTheme() {
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleTheme() {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }
}

function getScriptUrl() {
  const saved = localStorage.getItem("custom_script_url");
  return saved ? saved : DEFAULT_SCRIPT_ID;
}

async function fetchSettings() {
  try {
    const data = await callAppsScript("get_settings", {}, "GET");
    if (data && data.pricing_rules) {
      pricingRules = data.pricing_rules;
      settings = { ...settings, ...data.settings };
    }
  } catch (e) {
    throw e;
  }
}

function populateFAQ() {
  if (!faqGroup) return;
  faqGroup.innerHTML = faqList.map(item => `
    <details class="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300" data-tags="${item.tags.join(' ')}">
      <summary class="flex justify-between items-center font-bold p-5 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <span class="text-slate-800 dark:text-slate-200 text-lg">${item.q}</span>
        <span class="material-symbols-outlined transition-transform duration-300 group-open:rotate-180 text-slate-400">expand_more</span>
      </summary>
      <div class="px-5 pb-5 text-base text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
        ${item.a}
        ${item.sample ? `<div class="mt-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-sm text-brand-700 dark:text-brand-300 font-bold flex items-center gap-2"><span class="material-symbols-outlined text-lg">lightbulb</span> ${item.sample}</div>` : ''}
      </div>
    </details>
  `).join("");
}

function filterFAQByCategory(category) {
  faqGroup.querySelectorAll("details").forEach((el) => {
    if (category === 'all') {
      el.classList.remove("hidden");
    } else {
      const tags = el.dataset.tags;
      el.classList.toggle("hidden", !tags.includes(category));
    }
  });
}

function openInfoCard(infoId) {
  const card = infoCards.find(c => c.id === infoId);
  if (!card) return;
  infoModalTitle.textContent = card.title;
  infoModalBody.innerHTML = card.body_html;
  infoModal.classList.remove("hidden");
}

function showWizard(action) {
  homeSection.classList.add("hidden");
  connectionBanner.classList.add("hidden");
  wizardSection.classList.remove("hidden");
  footerNav.classList.remove("hidden");
  state.serviceType = action;
  state.currentStep = 0;
  updateStepUI();
  window.scrollTo(0, 0);
}

function showHome() {
  wizardSection.classList.add("hidden");
  footerNav.classList.add("hidden");
  homeSection.classList.remove("hidden");
  if (pricingRules.length === 0) connectionBanner.classList.remove("hidden");
}

// --- Navigation Logic ---

function getNextStep(current, type) {
  // 0: Basic -> 1: Conditions -> 2: Relocate -> 3: Photos -> 4: Calendar -> 5: Review

  if (current === 0) {
    // Repair/Clean skip Conditions (1) and Relocate (2)
    if (type === "repair" || type === "clean") return 3;
    return 1;
  }

  if (current === 1) {
    // Install skips Relocate (2)
    if (type === "install") return 3;
    return 2;
  }

  if (current === 2) {
    return 3;
  }

  if (current === 3) return 4;
  if (current === 4) return 5;

  return 5;
}

function getPrevStep(current, type) {
  if (current === 5) return 4;
  if (current === 4) return 3;

  if (current === 3) {
    if (type === "install") return 1;
    if (type === "repair" || type === "clean") return 0;
    return 2;
  }

  if (current === 2) return 1;

  if (current === 1) return 0;

  return 0;
}

function handleNext() {
  if (!validateStep(state.currentStep)) return;

  if (state.currentStep === 5) {
    handleSubmit();
    return;
  }

  state.currentStep = getNextStep(state.currentStep, state.serviceType);
  updateStepUI();

  if (state.currentStep === 4) { // Calendar
    renderCalendar();
  }
  if (state.currentStep === 5) { // Review
    renderReviewStep();
  }
  window.scrollTo(0, 0);
}

function handlePrev() {
  if (state.currentStep > 0) {
    state.currentStep = getPrevStep(state.currentStep, state.serviceType);
    updateStepUI();
  } else {
    showHome();
  }
}

function updateStepUI() {
  // Hide all steps first
  steps.forEach(step => step.classList.add("hidden"));

  // Show current step
  const currentStepEl = document.querySelector(`.wizard-step[data-step="${state.currentStep}"]`);
  if (currentStepEl) {
    currentStepEl.classList.remove("hidden");
  }

  // Progress Bar
  const progress = ((state.currentStep + 1) / 6) * 100;
  progressBar.style.width = `${progress}%`;
  wizardIndicator.textContent = state.currentStep + 1;

  // Button Text
  if (state.currentStep === 5) {
    nextBtn.textContent = "確認預約";
    nextBtn.classList.replace("bg-brand-600", "bg-emerald-500");
    nextBtn.classList.replace("shadow-brand-600/30", "shadow-emerald-500/30");
  } else {
    nextBtn.textContent = "下一步";
    nextBtn.classList.replace("bg-emerald-500", "bg-brand-600");
    nextBtn.classList.replace("shadow-emerald-500/30", "shadow-brand-600/30");
  }

  // Dynamic Fields Logic
  const relocateFields = document.getElementById("relocate-fields");
  const roomSizeField = document.getElementById("room-size-field");
  const repairDescField = document.getElementById("repair-desc-field");

  // Step 0: Basic Info
  if (state.currentStep === 0) {
    if (state.serviceType === "repair" || state.serviceType === "clean") {
      roomSizeField.classList.add("hidden");
      repairDescField.classList.remove("hidden");
    } else {
      roomSizeField.classList.remove("hidden");
      repairDescField.classList.add("hidden");
    }
  }

  // Step 2: Relocate (Populate if needed)
  if (state.currentStep === 2 && relocateFields.innerHTML === "") {
    relocateFields.innerHTML = `
      <div class="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/50">
        <h3 class="font-bold text-indigo-700 dark:text-indigo-300 mb-4 text-lg">拆機地點 (來源)</h3>
        <label class="block mb-4">
          <span class="text-sm font-bold text-slate-700 dark:text-slate-300">舊機地址</span>
          <input type="text" name="origin_address" class="input-touch w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 outline-none mt-1" placeholder="請輸入舊機所在地址..." />
        </label>
        
        <span class="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">服務模式</span>
        <div class="grid grid-cols-1 gap-3">
            <label class="chip cursor-pointer">
                <input type="radio" name="relocate_mode" value="dismantle_and_reinstall" class="hidden" checked>
                <span class="chip-label block w-full text-center py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 transition-all">完整移機 (拆+運+裝)</span>
            </label>
            <label class="chip cursor-pointer">
                <input type="radio" name="relocate_mode" value="dismantle" class="hidden">
                <span class="chip-label block w-full text-center py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 transition-all">僅拆機回收</span>
            </label>
        </div>
      </div>
    `;
  }
}

function validateStep(step) {
  const form = wizardForm;
  if (step === 0) {
    if (!form.phone.value) return alert("請輸入手機號碼");
    if (state.serviceType !== "repair" && state.serviceType !== "clean" && !form.room_size.value) return alert("請選擇坪數");
  }
  if (step === 4) {
    if (!form.name.value) return alert("請輸入姓名");
    if (!form.address.value) return alert("請輸入地址");
    if (!form.date.value) return alert("請選擇日期");
  }
  return true;
}

function handleFormInput() {
  state.form = collectFormState();
  const est = runEstimateEngine(state.form);
  state.estimate = est;
}

function collectFormState() {
  const fd = new FormData(wizardForm);
  const outdoorPos = fd.get("outdoor_pos");

  return {
    ...state.form,
    serviceType: state.serviceType,
    room_size: fd.get("room_size"),
    phone: fd.get("phone"),
    has_220v: fd.get("has_220v_opt") === "yes",
    outdoor_pos: outdoorPos,
    high_altitude: outdoorPos === "dangerous",
    name: fd.get("name"),
    address: fd.get("address"),
    date: fd.get("date"),
    slot: fd.get("slot"),
    origin_address: fd.get("origin_address") || "",
    relocate_mode: fd.get("relocate_mode") || "none",
    repair_desc: fd.get("repair_desc") || ""
  };
}

function runEstimateEngine(form) {
  let min = 0, max = 0;
  if (form.serviceType === "install") { min = 3500; max = 4500; }
  else if (form.serviceType === "relocate") { min = 3500; max = 4500; }
  else if (form.serviceType === "repair") { min = 500; max = 800; }
  else if (form.serviceType === "clean") { min = 2000; max = 2500; }

  if (form.high_altitude) { min += 2000; max += 4000; }
  if (!form.has_220v && form.serviceType === "install") { min += 3500; max += 6500; }
  if (form.serviceType === "relocate") { min += 1500; max += 2500; }

  return { min, max };
}

function renderReviewStep() {
  const map = { "install": "新機安裝", "relocate": "冷氣移機", "repair": "維修檢測", "clean": "保養清洗" };
  document.getElementById("review-service").textContent = map[state.serviceType] || state.serviceType;
  document.getElementById("review-date-slot").textContent = `${state.form.date} (${state.form.slot === 'am' ? '早上' : (state.form.slot === 'pm' ? '下午' : '晚上')})`;
  document.getElementById("review-price").textContent = `$${state.estimate.min.toLocaleString()} - $${state.estimate.max.toLocaleString()}`;
}

async function handleSubmit() {
  nextBtn.disabled = true;
  nextBtn.textContent = "處理中...";

  try {
    const payload = {
      ...state.form,
      estimate_min: state.estimate.min,
      estimate_max: state.estimate.max,
      notes: state.form.repair_desc || ""
    };

    const res = await callAppsScript("create_job", payload);
    if (res.status === "success") {
      state.jobId = res.job_id;
      state.folderId = res.folder_id;

      if (state.photoQueue.length > 0) {
        nextBtn.textContent = "上傳照片...";
        for (const item of state.photoQueue) {
          await uploadPhoto(item.file, item.type, state.folderId);
        }
      }

      showSuccess(res);
    } else {
      throw new Error(res.message);
    }
  } catch (e) {
    alert("預約失敗: " + e.message);
    nextBtn.disabled = false;
    nextBtn.textContent = "確認預約";
  }
}

async function uploadPhoto(file, type, folderId) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      await callAppsScript("upload_photo", {
        folder_id: folderId,
        image_type: type,
        image_base64: base64
      });
      resolve();
    };
    reader.readAsDataURL(file);
  });
}

function showSuccess(res) {
  wizardSection.classList.add("hidden");
  footerNav.classList.add("hidden");
  successSection.classList.remove("hidden");
  document.getElementById("success-job-id").textContent = res.job_id;
  if (res.pdf_url) {
    document.getElementById("success-pdf").href = res.pdf_url;
  } else {
    document.getElementById("success-pdf").classList.add("hidden");
  }
}

function handlePhotoSelection(type, fileList) {
  const file = fileList[0];
  if (!file) return;

  state.photoQueue = state.photoQueue.filter(p => p.type !== type);
  state.photoQueue.push({ type, file });

  const card = document.querySelector(`.upload-card[data-upload-target="${type}"]`);
  const preview = card.querySelector(".preview-area");
  preview.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
  card.querySelector("span").classList.add("hidden");
  card.querySelector("p").classList.add("hidden");
}

// Calendar Logic
function renderCalendar() {
  const { year, month } = state.calendar;
  calMonthLabel.textContent = `${year}-${String(month).padStart(2, '0')}`;
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  calBody.innerHTML = "";
  for (let i = 0; i < firstDay; i++) calBody.appendChild(document.createElement("div"));

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const btn = document.createElement("button");
    btn.className = "p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 text-slate-700 dark:text-slate-300 font-bold transition-colors";
    btn.textContent = d;
    if (state.form.date === dateStr) btn.classList.add("bg-brand-500", "text-white", "hover:bg-brand-600");

    btn.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent form submit
      state.form.date = dateStr;
      wizardForm.date.value = dateStr;
      renderCalendar();
    });
    calBody.appendChild(btn);
  }
}

function changeMonth(delta) {
  let { year, month } = state.calendar;
  month += delta;
  if (month > 12) { month = 1; year++; }
  if (month < 1) { month = 12; year--; }
  state.calendar.year = year;
  state.calendar.month = month;
  renderCalendar();
}

async function handleOrderQuery() {
  const phone = queryPhone.value;
  const jobId = queryJobId.value;
  btnDoQuery.textContent = "查詢中...";
  try {
    const res = await callAppsScript("get_order_status", { phone, job_id: jobId }, "GET");
    if (res.status === "found") {
      queryResult.classList.remove("hidden");
      queryResult.innerHTML = `
        <div class="mt-4 p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
          <div class="flex items-center gap-2 mb-3">
            <span class="material-symbols-outlined text-emerald-500">check_circle</span>
            <p class="font-bold text-emerald-700 dark:text-emerald-400 text-lg">查詢成功</p>
          </div>
          <div class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p><span class="font-bold">狀態:</span> ${res.order_status}</p>
            <p><span class="font-bold">日期:</span> ${res.date} (${res.slot})</p>
            <p><span class="font-bold">服務:</span> ${res.service}</p>
          </div>
          <div class="mt-4 space-y-2">
            ${res.pdf_url ? `<a href="${res.pdf_url}" target="_blank" class="block w-full py-2 text-center rounded-lg bg-white border border-slate-200 text-brand-600 font-bold shadow-sm">下載訂單 PDF</a>` : ''}
            ${res.warranty_url ? `<a href="${res.warranty_url}" target="_blank" class="block w-full py-2 text-center rounded-lg bg-emerald-500 text-white font-bold shadow-sm">下載保固書 PDF</a>` : ''}
          </div>
        </div>
      `;
    } else {
      alert("查無訂單，請確認輸入資料是否正確");
    }
  } catch (e) {
    alert("查詢失敗，請檢查網路連線");
  } finally {
    btnDoQuery.textContent = "查詢進度";
  }
}

async function callAppsScript(action, payload = {}, method = "POST") {
  let scriptUrl = getScriptUrl();
  if (!scriptUrl.startsWith("http")) {
    scriptUrl = `https://script.google.com/macros/s/${scriptUrl}/exec`;
  }
  const url = new URL(scriptUrl);
  url.searchParams.append("action", action);
  const options = { method };
  if (method === "GET") {
    Object.keys(payload).forEach(key => url.searchParams.append(key, payload[key]));
  } else {
    options.body = JSON.stringify(payload);
    options.headers = { "Content-Type": "text/plain;charset=utf-8" };
  }
  const res = await fetch(url.toString(), options);
  if (!res.ok) throw new Error("API Failed");
  return await res.json();
}
