const APPS_SCRIPT_URL = "https://script.google.com/macros/s/xxxx/exec";

const settings = {
  tax_rate: 0.05,
  loyalty_discount: 0.03,
  free_radius_km: 8,
  travel_fee_per_km_min: 15,
  travel_fee_per_km_max: 25,
  travel_fee_min: 200,
  travel_fee_cap: 1500,
  peak_months: [7, 8, 9],
  post_typhoon_coef_min: 0.1,
  post_typhoon_coef_max: 0.2,
  offhour_start: "18:00",
  coastal_distance_km: 1.5,
  travel_fee_rules: {
    zone_map: {
      A: ["花蓮市", "吉安鄉"],
      B: ["新城鄉", "壽豐鄉"],
      C: ["鳳林鎮", "光復鄉"],
      D: ["豐濱鄉", "玉里鎮", "富里鄉", "卓溪鄉"]
    },
    km_ranges: [
      { max: 10, fee: 0 },
      { max: 30, fee_per_km: 8 },
      { max: 80, fee_per_km: 10 }
    ]
  },
  drive: {
    root_id: "HVAC_DRIVE_ROOT_FOLDER_ID",
    folders: {
      jobs: "Jobs",
      templates: "Templates",
      exports: "Exports",
      logs: "Logs"
    }
  },
  sla: {
    initial_response_hours: 48,
    visit_days: 3,
    emergency_note: "地震/颱風後視實際狀況彈性調整"
  }
};

const faqList = [
  {
    id: "F01",
    q: "沒有 220V 會怎樣？",
    a: "若無 220V，壓縮機可能跳電，需評估配電盤與拉線距離 (約 3,000–6,000)。",
    tags: ["install"],
    sample: "無 220V 新機 → +3,000 起"
  },
  {
    id: "F02",
    q: "為什麼無電梯要加價？",
    a: "搬運需額外人力與時間，3F 以上依樓層酌收 500–1,500。",
    tags: ["relocate"],
    sample: "4F 無電梯 → +1,000"
  },
  {
    id: "F03",
    q: "頂樓/鐵皮需要升級噸數嗎？",
    a: "負荷多 15–25%，建議升一級避免不夠冷，電費差異有限。",
    tags: ["install", "local"],
    sample: "鐵皮 6–8 坪 → 建議 1.0–1.2RT"
  }
];

const infoCards = [
  {
    id: "i-220v",
    title: "為什麼需要 220V 獨立回路？",
    body_html:
      "<p>冷氣啟動瞬間會拉高電流，若與其他電器共用插座或老舊線路，容易跳電、讓電線長期過熱甚至引發火災，也會讓壓縮機啟動不穩定、縮短壽命。</p><p>建議先檢查配電盤是否有預留冷氣迴路；若沒有，會由合格電工增設，費用透明列在報價單與變更單。</p>",
    faqs: ["如何確認家中有沒有獨立回路？", "如果不做獨立回路，會遇到哪些風險？"]
  },
  {
    id: "i-drain",
    title: "排水與加壓排水器",
    body_html:
      "<p>冷凝水必須維持適當坡度與管徑才能順利排出。當室內機位置較低或管路需走天花板時，會建議加壓排水器，避免回流水、天花板滴水或後續發霉。</p>",
    faqs: ["怎麼判斷需要加壓排水器？", "排水路徑是否會影響裝潢？"]
  },
  {
    id: "i-wall",
    title: "牆體材質與打孔",
    body_html:
      "<p>RC、磚牆、輕隔間的厚度與補強方式不同，打孔時會先布置粉塵隔離，完工後再做防水與封孔。厚牆或石材需要鑽石刀具，施工時間較長。</p>",
    faqs: ["打孔會不會傷到鋼筋？", "粉塵噪音需要特別準備嗎？"]
  },
  {
    id: "i-outdoor",
    title: "室外機位置與固定",
    body_html:
      "<p>陽台維修最方便，但需確保通風；外牆需加強固定並設置防墜；屋頂則須考慮防颱與抗風。不同位置會調整固定方式與防鏽材料。</p>",
    faqs: ["外牆固定如何防止掉落？", "屋頂需要申請額外許可嗎？"]
  },
  {
    id: "i-coast",
    title: "沿海防蝕為何必要？",
    body_html:
      "<p>花蓮沿海鹽害強烈，室外機與支架若未防鏽，容易在兩三年內生鏽鬆脫。建議使用不鏽鋼支架、化學錨栓與防蝕塗層，費用會清楚列為 COAST 項目。</p>",
    faqs: ["距離海多近需要做防蝕？", "防蝕處理可自行取消嗎？"]
  },
  {
    id: "i-changeorder",
    title: "變更單機制",
    body_html:
      "<p>若現場與預約資訊不同（如管線超長、需加壓排水器），會先提出變更單，列出新增項目、金額與原因，雙方電子簽名後才施工，保障權益。</p>",
    faqs: ["變更單如何通知屋主？", "簽名後多久內會更新總價？"]
  },
  {
    id: "i-warranty",
    title: "保固與償件範圍",
    body_html:
      "<p>施工瑕疵（如配管接頭滲漏、固定不牢）提供保固；天災、外力、非獨立回路、排水遭破壞等不在保固內。償件上限為本次工程金額，需有照片與紀錄。</p>",
    faqs: ["保固期多長？", "天災造成損害能否協助修復？"]
  }
];

const pricingRules = [
  {
    id: "BASE_INSTALL",
    label: "基礎安裝(含3m)",
    min: 2500,
    max: 3500,
    unit: "once",
    badge: "BASE",
    reason: "含銅管/保溫/配線/支架與測試",
    apply: (form) => ["install", "relocate"].includes(form.serviceType)
  },
  {
    id: "ADD_220V",
    label: "新增 220V 插座",
    min: 3000,
    max: 6000,
    unit: "once",
    badge: "POWER",
    reason: "配電盤餘裕、拉線距離、明管/暗埋修補",
    apply: (form) => form.has_220v === false
  },
  {
    id: "HOLE_STD",
    label: "牆體打孔",
    min: 800,
    max: 1200,
    unit: "per_hole",
    badge: "WALL",
    reason: "牆厚/材質差異與粉塵隔離",
    apply: (form) => form.holes > 0,
    quantity: (form) => form.holes || 0
  },
  {
    id: "PIPE_EXTRA",
    label: "冷媒管線超長（每米）",
    min: 250,
    max: 350,
    unit: "per_meter",
    badge: "PIPE",
    reason: "只計超出 4m 的部分，含銅管/保溫/收邊",
    apply: (form) => form.pipe_len_total_m > 4,
    quantity: (form) => Math.max(0, form.pipe_len_total_m - 4)
  },
  {
    id: "DRAIN_NEW",
    label: "排水新拉",
    min: 1000,
    max: 2000,
    unit: "once",
    badge: "DRAIN",
    reason: "依坡度、距離與穿孔施工",
    apply: (form) => form.drain_new === true
  },
  {
    id: "NO_ELEVATOR",
    label: "無電梯搬運",
    min: 500,
    max: 1500,
    unit: "once",
    badge: "LABOR",
    reason: "樓層/機型重量/動線需額外人力",
    apply: (form) => form.has_elevator === false && form.floor >= 3
  },
  {
    id: "HIGH_WORK",
    label: "高空/屋頂作業",
    min: 1000,
    max: 5000,
    unit: "once",
    badge: "HIGH",
    reason: "外牆或屋頂需繩索點、雙人協作、防墜",
    apply: (form) => ["wall", "roof"].includes(form.outdoor_pos)
  },
  {
    id: "DISMANTLE",
    label: "舊機拆除",
    min: 1000,
    max: 2000,
    unit: "once",
    badge: "RELOCATE",
    reason: "冷媒回收/拆卸/封口與清運",
    apply: (form) => ["dismantle", "dismantle_and_reinstall"].includes(form.relocate_mode)
  },
  {
    id: "RECYCLE",
    label: "舊機回收",
    min: 300,
    max: 600,
    unit: "once",
    badge: "RECYCLE",
    reason: "報廢登記與運送",
    apply: (form) => ["recycle", "dismantle_and_reinstall"].includes(form.relocate_mode)
  },
  {
    id: "HLN_ZONE_B",
    label: "區域出車費（Zone B）",
    min: 300,
    max: 400,
    unit: "once",
    badge: "TRAVEL",
    reason: "新城/壽豐屬近郊，含油資與車程",
    apply: (form) => form.zone === "B"
  },
  {
    id: "HLN_ZONE_C",
    label: "區域出車費（Zone C）",
    min: 500,
    max: 700,
    unit: "once",
    badge: "TRAVEL",
    reason: "鳳林/光復距離較長，需預留車程",
    apply: (form) => form.zone === "C"
  },
  {
    id: "HLN_ZONE_D",
    label: "區域出車費（Zone D）",
    min: 800,
    max: 1200,
    unit: "once",
    badge: "TRAVEL",
    reason: "豐濱/玉里/富里/卓溪為遠區，含過路與補給",
    apply: (form) => form.zone === "D"
  },
  {
    id: "HLN_COAST",
    label: "沿海防蝕建議包",
    min: 600,
    max: 900,
    unit: "once",
    badge: "COAST",
    reason: "不鏽鋼支架、化學錨栓與防蝕塗層",
    apply: (form) => form.coastal_flag === true || form.distance_km <= settings.coastal_distance_km || ["wall", "roof"].includes(form.outdoor_pos)
  },
  {
    id: "HLN_PEAK",
    label: "旺季工作加價",
    min: 300,
    max: 500,
    unit: "once",
    badge: "PEAK",
    reason: "7–9 月工班滿檔，需加班處理",
    apply: (form) => isPeakMonth(form.date)
  },
  {
    id: "HLN_NIGHT",
    label: "夜間時段加價",
    min: 400,
    max: 600,
    unit: "once",
    badge: "OFFHOUR",
    reason: "18:00 後需雙人值班與噪音管控",
    apply: (form) => form.slot === "night"
  }
];

const state = {
  serviceType: "install",
  currentStep: 0,
  estimate: { min: 0, max: 0, items: [], factors: [], tonnage: "" },
  jobId: null,
  manageUrl: "",
  phone: "",
  uploads: { indoor: [], outdoor: [], panel: [] },
  busySlots: [],
  form: {
    serviceType: "install",
    room_size: "",
    house_flags: [],
    has_220v: true,
    holes: 1,
    pipe_len_total_m: 3,
    drain_new: false,
    floor: 2,
    has_elevator: true,
    outdoor_pos: "balcony",
    relocate_mode: "none",
    distance_km: 5,
    zone: "A",
    coastal_flag: false,
    post_typhoon: false,
    name: "",
    phone: "",
    address: "",
    date: "",
    slot: "am",
    notes: ""
  }
};

const homeSection = document.getElementById("home-section");
const wizardSection = document.getElementById("wizard-section");
const successSection = document.getElementById("success-section");
const wizardTitle = document.getElementById("wizard-title");
const wizardIndicator = document.getElementById("wizard-step-indicator");
const wizardForm = document.getElementById("wizard-form");
const steps = Array.from(document.querySelectorAll(".wizard-step"));
const nextBtn = document.querySelector('[data-action="next-step"]');
const prevBtn = document.querySelector('[data-action="prev-step"]');
const backHomeButtons = document.querySelectorAll('[data-action="back-home"]');
const cards = document.querySelectorAll('#home-section [data-action]');
const estRangeEl = document.getElementById("est-range");
const estItemsEl = document.getElementById("est-items");
const submitBtn = document.getElementById("btn-submit");
const includeTaxEl = document.getElementById("ctrl-include-tax");
const discountEl = document.getElementById("ctrl-apply-discount");
const compareHas220 = document.getElementById("ctrl-has-220v");
const compareElevator = document.getElementById("ctrl-has-elevator");
const comparePipe = document.getElementById("ctrl-pipe-len");
const comparePipeDisplay = document.getElementById("ctrl-pipe-len-display");
const slotStatus = document.getElementById("slot-status");
const offlineBanner = document.getElementById("offline-banner");
const faqSearch = document.getElementById("faq-search");
const faqGroup = document.getElementById("faq-group");
const successJobId = document.getElementById("success-job-id");
const successPhone = document.getElementById("success-phone");
const successManage = document.getElementById("success-manage");
const successIcs = document.getElementById("success-ics");
const uploadCards = document.querySelectorAll(".upload-card");
const infoButtons = document.querySelectorAll('[data-info]');
const infoModal = document.getElementById("info-modal");
const infoModalTitle = document.getElementById("info-modal-title");
const infoModalBody = document.getElementById("info-modal-body");
const infoModalFaqs = document.getElementById("info-modal-faqs");
const infoModalClose = document.getElementById("info-modal-close");

init();

function init() {
  populateFAQ();
  cards.forEach((card) => card.addEventListener("click", handleCardClick));
  nextBtn.addEventListener("click", handleNext);
  prevBtn.addEventListener("click", handlePrev);
  submitBtn.addEventListener("click", handleSubmit);
  backHomeButtons.forEach((btn) => btn.addEventListener("click", showHome));
  wizardForm.addEventListener("input", handleFormInput);
  faqSearch.addEventListener("input", filterFAQ);
  compareHas220.addEventListener("change", () => syncWizardField("has_220v", compareHas220.checked));
  compareElevator.addEventListener("change", () => syncWizardField("has_elevator", compareElevator.checked));
  comparePipe.addEventListener("input", () => {
    comparePipeDisplay.textContent = `${comparePipe.value}m`;
    syncWizardField("pipe_len_total_m", Number(comparePipe.value));
  });
  includeTaxEl.addEventListener("change", updateEstimatePanel);
  discountEl.addEventListener("change", updateEstimatePanel);
  window.addEventListener("online", () => toggleOffline(false));
  window.addEventListener("offline", () => toggleOffline(true));
  setupDateInput();
  registerServiceWorker();
  renderUploads();
  updateEstimate();
  toggleOffline(!navigator.onLine);
  uploadCards.forEach((card) => {
    const input = card.querySelector('input[type="file"]');
    input.addEventListener("change", (event) => handlePhotoUpload(card.dataset.upload, event.target.files));
  });
  infoButtons.forEach((btn) => {
    btn.addEventListener("click", () => openInfoCard(btn.dataset.info));
  });
  if (infoModalClose) {
    infoModalClose.addEventListener("click", closeInfoModal);
  }
  if (infoModal) {
    infoModal.addEventListener("click", (event) => {
      if (event.target === infoModal) closeInfoModal();
    });
  }
}

function populateFAQ() {
  faqGroup.innerHTML = faqList
    .map(
      (item) => `
      <article class="rounded-2xl border border-slate-800 bg-slate-900/80 p-4" data-faq-id="${item.id}">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-semibold">${item.q}</h4>
            <p class="text-sm text-slate-400">${item.a}</p>
          </div>
          <span class="text-xs text-slate-500">${item.sample}</span>
        </div>
        <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
          ${item.tags.map((tag) => `<span class="px-2 py-1 rounded-full bg-slate-800/80">${tag.toUpperCase()}</span>`).join("")}
        </div>
        <div class="mt-3 flex flex-wrap gap-2 text-xs">
          <button class="px-3 py-1 rounded-full border border-cyan-400 text-cyan-300" data-faq="wizard" data-faq-target="${item.id}">我遇到這狀況</button>
          <button class="px-3 py-1 rounded-full border border-slate-700 text-slate-300" data-faq="sample">看圖示例</button>
        </div>
      </article>`
    )
    .join("");

  faqGroup.querySelectorAll('[data-faq="wizard"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      showWizard("install");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function openInfoCard(infoId) {
  if (!infoId) return;
  const card = infoCards.find((entry) => entry.id === infoId);
  if (!card || !infoModal) return;
  infoModalTitle.textContent = card.title;
  infoModalBody.innerHTML = card.body_html;
  infoModalFaqs.innerHTML = card.faqs
    .map((faq) => `<li>${faq}</li>`)
    .join("");
  infoModal.classList.remove("hidden");
}

function closeInfoModal() {
  if (!infoModal) return;
  infoModal.classList.add("hidden");
}

function filterFAQ(event) {
  const term = event.target.value.toLowerCase();
  faqGroup.querySelectorAll("article").forEach((card) => {
    const text = card.textContent.toLowerCase();
    card.classList.toggle("hidden", term && !text.includes(term));
  });
}

function handleCardClick(event) {
  const action = event.currentTarget.dataset.action;
  if (action === "faq") {
    document.getElementById("faq-section").scrollIntoView({ behavior: "smooth" });
    return;
  }
  state.serviceType = action;
  showWizard(action);
}

function showWizard(action) {
  homeSection.classList.add("hidden");
  successSection.classList.add("hidden");
  wizardSection.classList.remove("hidden");
  state.currentStep = 0;
  updateStepUI();
  document.getElementById("wizard-form").scrollIntoView({ behavior: "smooth" });
  if (action === "relocate") {
    wizardTitle.textContent = "移機／拆機條件";
  } else {
    wizardTitle.textContent = "空間概況";
  }
}

function showHome() {
  wizardSection.classList.add("hidden");
  successSection.classList.add("hidden");
  homeSection.classList.remove("hidden");
}

function showSuccess() {
  wizardSection.classList.add("hidden");
  homeSection.classList.add("hidden");
  successSection.classList.remove("hidden");
  successJobId.textContent = state.jobId;
  successPhone.href = `tel:${state.phone || ""}`;
  successPhone.textContent = state.phone || "電話";
  successManage.href = state.manageUrl || "#";
  successIcs.href = state.manageUrl || "#";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleNext() {
  if (!validateStep(state.currentStep)) return;
  if (state.currentStep < steps.length - 1) {
    state.currentStep += 1;
    updateStepUI();
  }
}

function handlePrev() {
  if (state.currentStep > 0) {
    state.currentStep -= 1;
    updateStepUI();
  } else {
    showHome();
  }
}

function updateStepUI() {
  steps.forEach((stepEl, index) => {
    stepEl.classList.toggle("hidden", index !== state.currentStep);
  });
  prevBtn.disabled = state.currentStep === 0;
  nextBtn.textContent = state.currentStep === steps.length - 1 ? "檢視確認" : "下一步";
  wizardIndicator.textContent = state.currentStep + 1;
  const titles = ["空間概況", "施工條件", "移機／距離", "聯絡與時段"];
  wizardTitle.textContent = titles[state.currentStep] || "預約";
}

function handleFormInput() {
  state.form = collectFormState();
  compareHas220.checked = state.form.has_220v;
  compareElevator.checked = state.form.has_elevator;
  comparePipe.value = state.form.pipe_len_total_m;
  comparePipeDisplay.textContent = `${state.form.pipe_len_total_m}m`;
  updateEstimate();
}

function syncWizardField(name, value) {
  const target = wizardForm.elements[name];
  if (!target) return;
  if (target.type === "checkbox") {
    target.checked = Boolean(value);
  } else {
    target.value = typeof value === "boolean" ? String(value) : value;
  }
  if (name === "has_220v" || name === "has_elevator") {
    target.value = value ? "true" : "false";
  }
  state.form = collectFormState();
  updateEstimate();
}

function collectFormState() {
  const formData = new FormData(wizardForm);
  const flags = Array.from(wizardForm.querySelectorAll('input[name="house_flags"]:checked')).map((el) => el.value);
  return {
    ...state.form,
    serviceType: state.serviceType,
    room_size: formData.get("room_size") || "",
    house_flags: flags,
    has_220v: formData.get("has_220v") === "true",
    holes: Number(formData.get("holes")) || 0,
    pipe_len_total_m: Number(formData.get("pipe_len_total_m")) || 0,
    drain_new: formData.get("drain_new") === "true",
    floor: Number(formData.get("floor")) || 1,
    has_elevator: formData.get("has_elevator") === "true",
    outdoor_pos: formData.get("outdoor_pos") || "balcony",
    relocate_mode: formData.get("relocate_mode") || "none",
    distance_km: Number(formData.get("distance_km")) || 0,
    zone: formData.get("zone") || "A",
    coastal_flag: formData.get("coastal_flag") === "true" || formData.get("coastal_flag") === "on",
    post_typhoon: formData.get("post_typhoon") === "on" || formData.get("post_typhoon") === "true",
    name: formData.get("name") || "",
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
    date: formData.get("date") || "",
    slot: formData.get("slot") || "am",
    notes: formData.get("notes") || ""
  };
}

function validateStep(stepIndex) {
  let valid = true;
  const requiredMap = {
    0: ["room_size"],
    2: ["zone"],
    3: ["name", "phone", "date", "slot"]
  };
  Object.keys(requiredMap).forEach((key) => {
    if (Number(key) !== stepIndex) return;
    requiredMap[key].forEach((field) => {
      const input = wizardForm.elements[field];
      const errorEl = wizardForm.querySelector(`[data-error-for="${field}"]`);
      if (!input) return;
      const value = input.type === "checkbox" ? input.checked : input.value.trim();
      if (!value) {
        valid = false;
        if (errorEl) {
          errorEl.textContent = "此欄位為必填";
          errorEl.classList.remove("hidden");
        }
      } else if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
      }
    });
  });
  if (stepIndex === 3) {
    const dateInput = wizardForm.elements["date"];
    if (dateInput.value && dateInput.value < dateInput.min) {
      const errorEl = wizardForm.querySelector('[data-error-for="date"]');
      errorEl.textContent = "日期不可早於今日";
      errorEl.classList.remove("hidden");
      valid = false;
    }
  }
  return valid;
}

function updateEstimate() {
  state.form = collectFormState();
  const estimate = runEstimateEngine(state.form);
  state.estimate = estimate;
  updateEstimatePanel();
  requestRemoteEstimate(state.form, estimate);
}

function updateEstimatePanel() {
  let min = state.estimate.min;
  let max = state.estimate.max;
  if (includeTaxEl.checked) {
    min *= 1 + settings.tax_rate;
    max *= 1 + settings.tax_rate;
  }
  if (discountEl.checked) {
    min *= 1 - settings.loyalty_discount;
    max *= 1 - settings.loyalty_discount;
  }
  const roundedMin = roundToHundred(min);
  const roundedMax = roundToHundred(max);
  estRangeEl.textContent = `NT$ ${roundedMin.toLocaleString()} – ${roundedMax.toLocaleString()}`;
  const itemsHTML = state.estimate.items
    .map(
      (item) => `
      <div>
        <div class="flex items-center justify-between text-slate-200 gap-2">
          <span class="flex items-center gap-2">${item.label}${
            item.badge
              ? `<span class="text-[0.65rem] tracking-wide rounded-full border border-slate-700 px-2 py-0.5 text-slate-400">${item.badge}</span>`
              : ""
          }</span>
          <span>+${item.display}</span>
        </div>
        <p class="text-slate-500">${item.reason}</p>
      </div>`
    )
    .join("");
  const factorHTML = state.estimate.factors
    .map(
      (factor) => `
      <div>
        <div class="flex items-center justify-between text-emerald-300">
          <span>${factor.label}</span>
          <span>× ${factor.display}</span>
        </div>
        <p class="text-slate-500">${factor.reason}</p>
      </div>`
    )
    .join("");
  const tonnageHTML = state.estimate.tonnage
    ? `<div class="text-xs text-slate-400">噸數建議：${state.estimate.tonnage}</div>`
    : "";
  estItemsEl.innerHTML = itemsHTML + factorHTML + tonnageHTML;
}

function runEstimateEngine(form) {
  const items = [];
  let minTotal = 0;
  let maxTotal = 0;

  pricingRules.forEach((rule) => {
    if (!rule.apply(form)) return;
    const quantity = rule.quantity ? rule.quantity(form) : 1;
    if (quantity <= 0) return;
    const addMin = rule.min * quantity;
    const addMax = rule.max * quantity;
    minTotal += addMin;
    maxTotal += addMax;
    items.push({
      id: rule.id,
      label: rule.label,
      display: `${Math.round(addMin).toLocaleString()}–${Math.round(addMax).toLocaleString()}`,
      reason: rule.reason,
      badge: rule.badge || ""
    });
  });

  // 距離費
  const shouldApplyDistance = (!form.zone || form.zone === "A") && form.distance_km > settings.free_radius_km;
  if (shouldApplyDistance) {
    const extraKm = Math.max(0, form.distance_km - settings.free_radius_km);
    const travelMin = clamp(extraKm * settings.travel_fee_per_km_min, settings.travel_fee_min, settings.travel_fee_cap);
    const travelMax = clamp(extraKm * settings.travel_fee_per_km_max, settings.travel_fee_min, settings.travel_fee_cap);
    minTotal += travelMin;
    maxTotal += travelMax;
    items.push({
      id: "TRAVEL",
      label: "距離費",
      display: `${Math.round(travelMin).toLocaleString()}–${Math.round(travelMax).toLocaleString()}`,
      reason: `超出 ${settings.free_radius_km}km，每公里 15–25 元`
    });
  }

  const factors = [];
  let minFactor = 1;
  let maxFactor = 1;
  if (form.post_typhoon) {
    minFactor *= 1 + settings.post_typhoon_coef_min;
    maxFactor *= 1 + settings.post_typhoon_coef_max;
    factors.push({
      label: "颱風後插單",
      display: `${(1 + settings.post_typhoon_coef_min).toFixed(2)}–${(1 + settings.post_typhoon_coef_max).toFixed(2)}`,
      reason: "災後一週工單加總"
    });
  }

  minTotal *= minFactor;
  maxTotal *= maxFactor;

  const tonnage = getTonnageSuggestion(form);

  return {
    min: roundToHundred(minTotal),
    max: roundToHundred(maxTotal),
    items,
    factors,
    tonnage
  };
}

function getTonnageSuggestion(form) {
  if (!form.room_size) return "";
  const mapping = {
    "3-5": "0.6–0.8RT",
    "6-8": "0.8–1.0RT",
    "9-12": "1.0–1.5RT",
    "13-18": "1.5–2.0RT",
    "19-25": "2.0RT 以上"
  };
  let loadText = mapping[form.room_size] || "";
  if (form.house_flags.includes("top_floor")) loadText += "（頂樓 +20%）";
  if (form.house_flags.includes("iron")) loadText += " 鐵皮 +25%";
  if (form.house_flags.includes("west_facing")) loadText += " 西曬 +15%";
  return loadText;
}

function isPeakMonth(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  const month = date.getMonth() + 1;
  return settings.peak_months.includes(month);
}

function roundToHundred(value) {
  if (!value) return 0;
  return Math.round(value / 100) * 100;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setupDateInput() {
  const dateInput = wizardForm.elements["date"];
  const today = new Date();
  const iso = today.toISOString().split("T")[0];
  dateInput.min = iso;
  dateInput.addEventListener("change", async (event) => {
    const selectedDate = event.target.value;
    if (!selectedDate) return;
    await fetchBusySlots(selectedDate);
  });
}

async function fetchBusySlots(date) {
  const payload = { date };
  const data = await callAppsScript("get_busy_slots", payload, () => ({ slots: ["pm"] }));
  state.busySlots = data?.slots || [];
  const slotSelect = wizardForm.elements["slot"];
  Array.from(slotSelect.options).forEach((option) => {
    const disabled = state.busySlots.includes(option.value);
    option.disabled = disabled;
    option.textContent = formatSlotText(option.value, disabled);
  });
  slotStatus.textContent = state.busySlots.length ? `以下時段已滿：${state.busySlots.join(", ")}` : "可預約時段充足";
}

function formatSlotText(value, disabled) {
  const mapping = { am: "09:00–12:00", pm: "13:00–17:00", night: "18:00–20:00" };
  return disabled ? `${mapping[value]}（滿）` : mapping[value];
}

async function handleSubmit() {
  if (wizardSection.classList.contains("hidden")) {
    showWizard(state.serviceType || "install");
    return;
  }
  if (!validateStep(state.currentStep)) {
    return;
  }
  const payload = buildJobPayload();
  submitBtn.disabled = true;
  submitBtn.textContent = "送出中...";
  const job = await callAppsScript("create_job", payload, () => ({
    job_id: generateMockJobId(),
    cancel_token: "mock",
    manage_url: "https://calendar.google.com/mock"
  }));
  if (job) {
    state.jobId = job.job_id;
    state.manageUrl = job.manage_url;
    state.phone = payload.phone;
    await callAppsScript("create_calendar_event", { job_id: job.job_id, date: payload.date, slot: payload.slot }, () => ({ status: "ok" }));
    await loadJobUploads();
    showSuccess();
  }
  submitBtn.disabled = false;
  submitBtn.textContent = "提交預約";
}

function buildJobPayload() {
  const form = collectFormState();
  const estimate = state.estimate;
  const includeTax = includeTaxEl.checked;
  const applyDiscount = discountEl.checked;
  let min = estimate.min;
  let max = estimate.max;
  if (includeTax) {
    min = roundToHundred(min * (1 + settings.tax_rate));
    max = roundToHundred(max * (1 + settings.tax_rate));
  }
  if (applyDiscount) {
    min = roundToHundred(min * (1 - settings.loyalty_discount));
    max = roundToHundred(max * (1 - settings.loyalty_discount));
  }
  return {
    ...form,
    serviceType: state.serviceType,
    estimate_min: min,
    estimate_max: max,
    estimate_items: JSON.stringify(estimate.items),
    notes: form.notes || ""
  };
}

function generateMockJobId() {
  const now = new Date();
  return `MX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function handlePhotoUpload(type, fileList) {
  if (!state.jobId) {
    alert("請先完成預約");
    return;
  }
  const files = Array.from(fileList || []);
  for (const file of files) {
    const base64 = await compressImage(file);
    const payload = { job_id: state.jobId, photo_type: type, file: base64 };
    const res = await callAppsScript("upload_photo", payload, () => ({ url: URL.createObjectURL(file) }));
    if (!state.uploads[type]) state.uploads[type] = [];
    state.uploads[type].push(res.url);
  }
  renderUploads();
}

async function loadJobUploads() {
  if (!state.jobId) return;
  const data = await callAppsScript("get_job_uploads", { job_id: state.jobId }, () => ({ uploads: state.uploads }));
  if (data?.uploads) {
    state.uploads = { ...state.uploads, ...data.uploads };
  }
  renderUploads();
}

async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const maxWidth = 1280;
  const ratio = Math.min(1, maxWidth / bitmap.width);
  canvas.width = bitmap.width * ratio;
  canvas.height = bitmap.height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

function renderUploads() {
  uploadCards.forEach((card) => {
    const type = card.dataset.upload;
    const listEl = card.querySelector(".upload-list");
    const items = state.uploads[type] || [];
    listEl.innerHTML = items.length
      ? items
          .map((url, index) => `<a href="${url}" target="_blank" class="inline-flex px-2 py-1 rounded-full bg-slate-800 border border-slate-700 mr-1">${type} #${index + 1}</a>`)
          .join("")
      : '<span class="text-slate-500">尚未上傳</span>';
  });
}

async function callAppsScript(endpoint, payload = {}, mock) {
  try {
    const body = new URLSearchParams({ endpoint, ...payload });
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body
    });
    if (!response.ok) throw new Error("API failed");
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`API ${endpoint} fallback`, error.message);
    return typeof mock === "function" ? mock(payload) : null;
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch((err) => console.error("SW failed", err));
}

function toggleOffline(isOffline) {
  offlineBanner.classList.toggle("hidden", !isOffline);
}

function requestRemoteEstimate(form, localEstimate) {
  callAppsScript(
    "quote_estimate",
    {
      payload: JSON.stringify(form)
    },
    () => localEstimate
  ).then((data) => {
    if (!data || !data.min || !data.max) return;
    state.estimate = {
      ...state.estimate,
      min: data.min,
      max: data.max,
      items: data.items || state.estimate.items,
      factors: data.factors || state.estimate.factors
    };
    updateEstimatePanel();
  });
}
