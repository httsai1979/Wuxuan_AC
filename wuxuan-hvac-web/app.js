const APPS_SCRIPT_URL = "1kk2_8TPQns8z92GPwKtFbjUaRYlR6yLFehh4MwwHJe-X_EJ9koz5VBMA"; // User to replace this

let settings = {
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
  coastal_distance_km: 1.5,
  drive: {
    root_id: "171-ySiq0WKfPe59-dq0zwl00i7ptZZ55", // User to replace this
    folders: {
      jobs: "Jobs",
      templates: "Templates",
      exports: "Exports",
      logs: "Logs"
    }
  }
};

let pricingRules = []; // Will be loaded from backend

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

const state = {
  serviceType: "install",
  currentStep: 0,
  estimate: { min: 0, max: 0, items: [], factors: [], tonnage: "" },
  jobId: null,
  manageUrl: "",
  phone: "",
  uploads: { indoor: [], outdoor: [], panel: [] },
  photoQueue: [], // New: Store files to upload
  folderId: null,
  busySlots: [],
  form: {
    serviceType: "install",
    room_size: "",
    brand: "",
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
const tonnageInfo = document.getElementById("tonnage-info");
const tonnageText = document.getElementById("tonnage-text");
const uploadStatusArea = document.getElementById("upload-status-area");
const uploadStatusList = document.getElementById("upload-status-list");

init();

async function init() {
  await fetchSettings();
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

  // New Photo Upload Logic
  uploadCards.forEach((card) => {
    const input = card.querySelector('input[type="file"]');
    input.addEventListener("change", (event) => handlePhotoSelection(card.dataset.uploadTarget, event.target.files));
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
  updateEstimate();
  toggleOffline(!navigator.onLine);
}

async function fetchSettings() {
  if (APPS_SCRIPT_URL.includes("YOUR_APPS_SCRIPT")) {
    console.warn("Apps Script URL not set.");
    return;
  }

  try {
    console.log("Fetching settings from:", APPS_SCRIPT_URL);
    const data = await callAppsScript("get_settings", {}, "GET");
    if (data && data.pricing_rules) {
      pricingRules = data.pricing_rules;
      if (data.settings) {
        settings = { ...settings, ...data.settings };
      }
      console.log("Settings loaded:", pricingRules.length, "rules");
    } else {
      console.warn("Settings data empty or invalid:", data);
    }
  } catch (e) {
    console.error("Failed to load settings", e);
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
  const titles = ["空間概況", "施工條件", "移機／距離", "現場照片", "聯絡與時段"];
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
    brand: formData.get("brand") || "",
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
    4: ["name", "phone", "date", "slot"]
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
  if (stepIndex === 4) {
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

  // Update Tonnage Info
  if (state.estimate.tonnage) {
    tonnageText.textContent = `建議噸數：${state.estimate.tonnage}`;
    tonnageInfo.classList.remove("hidden");
  } else {
    tonnageInfo.classList.add("hidden");
  }
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
          <span class="flex items-center gap-2">${item.label}${item.badge
          ? `<span class="text-[0.65rem] tracking-wide rounded-full border border-slate-700 px-2 py-0.5 text-slate-400">${item.badge}</span>`
          : ""
        }</span>
          <span>${item.display}</span>
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

  // Helper to check conditions
  const checkCondition = (rule, form) => {
    const type = rule.condition_type;
    const val = rule.condition_value;

    if (type === "always") return true;
    if (type === "service_type") return [val].flat().includes(form.serviceType) || (val.includes(",") && val.split(",").includes(form.serviceType));
    if (type === "no_220v") return form.has_220v === false;
    if (type === "holes") return form.holes > 0;
    if (type === "pipe_extra") return form.pipe_len_total_m > 4;
    if (type === "drain_new") return form.drain_new === true;
    if (type === "no_elevator") return form.has_elevator === false && form.floor >= 3;
    if (type === "high_work") return ["wall", "roof"].includes(form.outdoor_pos);
    if (type === "dismantle") return ["dismantle", "dismantle_and_reinstall"].includes(form.relocate_mode);
    if (type === "recycle") return ["recycle", "dismantle_and_reinstall"].includes(form.relocate_mode);
    if (type === "zone") return form.zone === val;
    if (type === "coast") return form.coastal_flag === true || form.distance_km <= settings.coastal_distance_km || ["wall", "roof"].includes(form.outdoor_pos);
    if (type === "peak") return isPeakMonth(form.date);
    if (type === "night") return form.slot === "night";

    return false;
  };

  const getQuantity = (rule, form) => {
    if (rule.condition_type === "holes") return form.holes || 0;
    if (rule.condition_type === "pipe_extra") return Math.max(0, form.pipe_len_total_m - 4);
    return 1;
  };

  pricingRules.forEach((rule) => {
    if (!checkCondition(rule, form)) return;
    const quantity = getQuantity(rule, form);
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
    "3-5": { kw: "2.2–2.8kW", rt: "0.8–1.0RT" },
    "6-8": { kw: "3.6–4.1kW", rt: "1.2–1.5RT" },
    "9-12": { kw: "5.0–6.0kW", rt: "1.8–2.2RT" },
    "13-18": { kw: "7.1–8.5kW", rt: "2.5–3.0RT" },
    "19-25": { kw: "10.0kW+", rt: "3.5RT+" }
  };

  let base = mapping[form.room_size];
  if (!base) return "";

  let suggestion = `${base.kw} (${base.rt})`;
  const flags = [];

  if (form.house_flags.includes("top_floor")) flags.push("頂樓");
  if (form.house_flags.includes("iron")) flags.push("鐵皮");
  if (form.house_flags.includes("west_facing")) flags.push("西曬");

  if (flags.length > 0) {
    suggestion += ` ⚠️ 考量 ${flags.join("/")}，建議加大一級`;
  }

  return suggestion;
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
  console.log("Fetching busy slots for:", date);
  const data = await callAppsScript("get_busy_slots", { date }, "GET", () => ({ slots: ["pm"] }));
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

function handlePhotoSelection(type, fileList) {
  const files = Array.from(fileList);
  if (files.length === 0) return;

  // Store in queue
  state.photoQueue = state.photoQueue.filter(item => item.type !== type); // Replace existing for same type
  files.forEach(file => {
    state.photoQueue.push({ type, file });
  });

  // Preview
  const card = document.querySelector(`.upload-card[data-upload-target="${type}"]`);
  const previewArea = card.querySelector(".preview-area");
  previewArea.innerHTML = "";

  files.forEach(file => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.className = "w-16 h-16 object-cover rounded-lg border border-slate-700";
    previewArea.appendChild(img);
  });
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

  try {
    const job = await callAppsScript("create_job", payload, "POST", () => ({
      job_id: generateMockJobId(),
      folder_id: "mock_folder_id",
      manage_url: "#"
    }));

    if (job) {
      state.jobId = job.job_id;
      state.folderId = job.folder_id;
      state.manageUrl = job.folder_url;
      state.phone = payload.phone;

      // Upload Photos
      if (state.photoQueue.length > 0) {
        submitBtn.textContent = "上傳照片中...";
        uploadStatusArea.classList.remove("hidden");

        for (const item of state.photoQueue) {
          try {
            const base64 = await compressImage(item.file);
            const uploadPayload = {
              folder_id: state.folderId,
              image_type: item.type,
              image_base64: base64
            };
            await callAppsScript("upload_photo", uploadPayload, "POST");

            const li = document.createElement("li");
            li.textContent = `✅ ${item.type} 上傳成功`;
            li.className = "text-emerald-400";
            uploadStatusList.appendChild(li);
          } catch (err) {
            console.error("Photo upload failed", err);
            const li = document.createElement("li");
            li.textContent = `❌ ${item.type} 上傳失敗`;
            li.className = "text-rose-400";
            uploadStatusList.appendChild(li);
          }
        }
      }

      showSuccess();
    }
  } catch (err) {
    alert("預約失敗，請稍後再試。\n" + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "提交預約";
  }
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

async function callAppsScript(action, payload = {}, method = "POST", mock) {
  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.append("action", action);

    const options = {
      method: method,
    };

    if (method === "GET") {
      Object.keys(payload).forEach(key => url.searchParams.append(key, payload[key]));
    } else {
      options.body = JSON.stringify(payload);
      options.headers = { "Content-Type": "text/plain;charset=utf-8" };
    }

    const response = await fetch(url.toString(), options);
    if (!response.ok) throw new Error("API failed");
    const data = await response.json();
    if (data.status === "error") throw new Error(data.message);
    return data;
  } catch (error) {
    console.warn(`API ${action} fallback:`, error.message);
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
