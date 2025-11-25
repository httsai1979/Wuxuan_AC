const DEFAULT_SCRIPT_ID = "AKfycbyf1SqN5D8sXk-mtoIs4QZZwwsmZuKDOKMQikaPE8TeQJzoOtRncpNS065Zkosf2hlirg";

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
    brand_model: "",
    wall_type: "rc",
    has_220v: true,
    outdoor_pos: "balcony",
    relocate_mode: "none",
    origin_address: "",
    name: "",
    phone: "",
    address: "",
    date: "",
    slot: "am",
    repair_desc: "",
    zone: "A",
    floor: "1",
    has_elevator: "yes",
    indoor_unit_count: "1",
    pipe_length: "4",
    is_coastal: "no",
    tax_included: false
  }
};

// DOM Elements
const appRoot = document.getElementById("app-root");
const homeSection = document.getElementById("home-section");
const wizardSection = document.getElementById("wizard-section");
const successSection = document.getElementById("success-section");
const orderStatusSection = document.getElementById("order-status-section");
const connectionBanner = document.getElementById("connection-banner");
const wizardForm = document.getElementById("wizard-form");
const wizardSteps = document.querySelectorAll(".wizard-step");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const footerNav = document.getElementById("footer-nav");
const footerPrice = document.getElementById("footer-price");
const calMonthLabel = document.getElementById("cal-month-label");
const calBody = document.getElementById("cal-body");
const reviewBreakdown = document.getElementById("review-breakdown");
const queryPhone = document.getElementById("query-phone");
const queryJobId = document.getElementById("query-job-id");
const btnDoQuery = document.getElementById("btn-do-query");
const queryResult = document.getElementById("query-result");
const faqGroup = document.getElementById("faq-group");
const infoCardOverlay = document.getElementById("info-card-overlay");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", init);

function init() {
  initTheme();
  fetchSettings();
  populateFAQ();

  // Event Listeners
  document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const action = btn.dataset.action;
      if (action === "install" || action === "relocate" || action === "repair" || action === "clean") {
        showWizard(action);
      } else if (action === "close-order-status") {
        orderStatusSection.classList.add("hidden");
        homeSection.classList.remove("hidden");
      }
    });
  });

  document.getElementById("btn-check-order").addEventListener("click", () => {
    homeSection.classList.add("hidden");
    wizardSection.classList.add("hidden");
    successSection.classList.add("hidden");
    orderStatusSection.classList.remove("hidden");
  });

  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  document.getElementById("btn-save-url").addEventListener("click", () => {
    const url = document.getElementById("api-url-input").value.trim();
    if (url) {
      // Extract ID from URL
      const match = url.match(/\/s\/([a-zA-Z0-9-_]+)\/exec/);
      if (match) {
        localStorage.setItem("custom_script_url", match[1]);
        alert("連線設定已儲存！");
        location.reload();
      } else {
        alert("網址格式不正確，請確認是 Apps Script 發布網址");
      }
    }
  });

  prevBtn.addEventListener("click", handlePrev);
  nextBtn.addEventListener("click", handleNext);
  wizardForm.addEventListener("input", handleFormInput);

  document.getElementById("cal-prev").addEventListener("click", () => changeMonth(-1));
  document.getElementById("cal-next").addEventListener("click", () => changeMonth(1));

  btnDoQuery.addEventListener("click", handleOrderQuery);

  // Photo Upload Listeners
  document.querySelectorAll(".upload-card input[type='file']").forEach(input => {
    input.addEventListener("change", (e) => {
      handlePhotoSelection(e.target.closest(".upload-card").dataset.uploadTarget, e.target.files);
    });
  });

  // FAQ Filter
  document.querySelectorAll(".faq-filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".faq-filter-btn").forEach(b => b.classList.remove("bg-brand-600", "text-white"));
      e.target.classList.add("bg-brand-600", "text-white");
      filterFAQByCategory(e.target.dataset.filter);
    });
  });

  // Info Cards
  document.querySelectorAll(".info-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openInfoCard(btn.dataset.info);
    });
  });

  if (infoCardOverlay) {
    infoCardOverlay.addEventListener("click", (e) => {
      if (e.target === infoCardOverlay) infoCardOverlay.classList.add("hidden");
    });
  }

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('✅ Service Worker 註冊成功:', reg.scope))
        .catch(err => console.log('❌ Service Worker 註冊失敗:', err));
    });
  }
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
    if (data.pricing_rules) pricingRules = data.pricing_rules;
    if (data.info_cards) window.infoCardsData = data.info_cards; // Store for info cards
  } catch (e) {
    console.warn("Using default settings due to error:", e);
  }
}

function populateFAQ() {
  if (!faqGroup) return;
  faqGroup.innerHTML = faqList.map(item => `
    <details class="group bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" data-tags="${item.tags.join(",")}">
      <summary class="flex justify-between items-center p-5 cursor-pointer select-none">
        <span class="font-bold text-slate-800 dark:text-slate-200">${item.q}</span>
        <span class="material-symbols-outlined text-slate-400 transition-transform group-open:rotate-180">expand_more</span>
      </summary>
      <div class="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        ${item.a}
        ${item.sample ? `<div class="mt-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-700 dark:text-brand-300 text-xs font-bold">${item.sample}</div>` : ''}
      </div>
    </details>
  `).join("");
}

function filterFAQByCategory(category) {
  if (!faqGroup) return;
  const details = faqGroup.querySelectorAll("details");
  details.forEach(el => {
    if (category === "all" || el.dataset.tags.includes(category)) {
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
  });
}

function openInfoCard(id) {
  const data = window.infoCardsData ? window.infoCardsData[id] : null;
  if (!data) return;

  const content = infoCardOverlay.querySelector(".info-content");
  content.innerHTML = `
    <h3 class="text-xl font-bold mb-4">${data.title}</h3>
    <div class="prose dark:prose-invert text-sm">
      ${data.content.replace(/\n/g, "<br>")}
    </div>
    ${data.image ? `<img src="${data.image}" class="mt-4 rounded-lg w-full object-cover h-48">` : ''}
  `;
  infoCardOverlay.classList.remove("hidden");
}

// --- Navigation & UI ---

function showHome() {
  wizardSection.classList.add("hidden");
  footerNav.classList.add("hidden");
  homeSection.classList.remove("hidden");
  if (pricingRules.length === 0) connectionBanner.classList.remove("hidden");
}

function showWizard(type) {
  state.serviceType = type;
  state.currentStep = 0;
  state.form = { ...state.form, serviceType: type }; // Reset form for new type

  homeSection.classList.add("hidden");
  wizardSection.classList.remove("hidden");
  footerNav.classList.remove("hidden");

  // Reset UI
  wizardForm.reset();
  state.photoQueue = [];
  document.querySelectorAll(".preview-area").forEach(el => el.style.backgroundImage = "");
  document.querySelectorAll(".upload-card span, .upload-card p").forEach(el => el.classList.remove("hidden"));

  updateStepUI();
  updatePricing();
}

function updateStepUI() {
  wizardSteps.forEach((step, index) => {
    if (index === state.currentStep) {
      step.classList.remove("hidden");
      setTimeout(() => step.classList.remove("opacity-0", "translate-y-4"), 10);
    } else {
      step.classList.add("hidden", "opacity-0", "translate-y-4");
    }
  });

  // Progress Bar
  const progress = ((state.currentStep + 1) / wizardSteps.length) * 100;
  document.getElementById("progress-bar").style.width = `${progress}%`;

  // Buttons
  prevBtn.disabled = state.currentStep === 0;
  if (state.currentStep === wizardSteps.length - 1) {
    nextBtn.textContent = "確認預約";
    renderReviewStep();
  } else {
    nextBtn.textContent = "下一步";
  }

  // Special handling for calendar step
  if (state.currentStep === 3) { // Assuming step 3 is calendar
    renderCalendar();
  }
}

function handleNext() {
  if (!validateStep(state.currentStep)) return;

  if (state.currentStep === wizardSteps.length - 1) {
    handleSubmit();
  } else {
    state.currentStep = getNextStep(state.currentStep, state.serviceType);
    updateStepUI();
  }
}

function handlePrev() {
  if (state.currentStep === 0) {
    showHome();
  } else {
    state.currentStep = getPrevStep(state.currentStep, state.serviceType);
    updateStepUI();
  }
}

function getNextStep(current, type) {
  // Logic to skip steps based on service type
  // Step 0: Basic Info (All)
  // Step 1: Environment (Install/Relocate)
  // Step 2: Photos (All)
  // Step 3: Date (All)
  // Step 4: Review (All)

  if (current === 0) {
    if (type === "repair" || type === "clean") return 2; // Skip Env
  }
  return current + 1;
}

function getPrevStep(current, type) {
  if (current === 2) {
    if (type === "repair" || type === "clean") return 0; // Skip Env back
  }
  return current - 1;
}

function validateStep(step) {
  const currentStepEl = wizardSteps[step];
  const inputs = currentStepEl.querySelectorAll("input[required], select[required], textarea[required]");
  let valid = true;
  inputs.forEach(input => {
    if (!input.value) {
      valid = false;
      input.classList.add("border-red-500");
      input.addEventListener("input", () => input.classList.remove("border-red-500"), { once: true });
    }
  });

  if (!valid) {
    alert("請填寫所有必填欄位");
    return false;
  }
  return true;
}

function handleFormInput(e) {
  const { name, value, type, checked } = e.target;
  state.form[name] = type === "checkbox" ? checked : value;
  updatePricing();
}

function collectFormState() {
  const fd = new FormData(wizardForm);
  const outdoorPos = fd.get("outdoor_pos");

  return {
    ...state.form,
    serviceType: state.serviceType,
    room_size: fd.get("room_size"),
    brand_model: fd.get("brand_model") || "",
    wall_type: fd.get("wall_type") || "rc",
    zone: fd.get("zone") || "A",
    floor: fd.get("floor") || "1",
    has_elevator: fd.get("has_elevator") || "yes",
    indoor_unit_count: fd.get("indoor_unit_count") || "1",
    pipe_length: fd.get("pipe_length") || "4",
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
    repair_desc: fd.get("repair_desc") || "",
    is_coastal: fd.get("is_coastal") || "no",
    tax_included: fd.get("tax_included") === "on"
  };
}

// --- Pricing Engine ---

function updatePricing() {
  const form = collectFormState();
  const est = runEstimateEngine(form);
  state.estimate = est;

  if (footerPrice) {
    footerPrice.textContent = `$${est.min.toLocaleString()} - $${est.max.toLocaleString()}`;
  }
}

function runEstimateEngine(form) {
  let min = 0, max = 0;
  let details = [];

  // Base Price
  if (form.serviceType === "install") { min = 3500; max = 4500; details.push({ name: "基本安裝費", price: "$3500-4500" }); }
  else if (form.serviceType === "relocate") { min = 3500; max = 4500; details.push({ name: "移機基本費", price: "$3500-4500" }); }
  else if (form.serviceType === "repair") { min = 500; max = 800; details.push({ name: "檢測費", price: "$500-800" }); }
  else if (form.serviceType === "clean") { min = 2000; max = 2500; details.push({ name: "清洗費", price: "$2000-2500" }); }

  // Zone
  if (form.zone === "B") { min += 300; max += 400; details.push({ name: "偏遠地區加給 (B區)", price: "+$300-400" }); }
  else if (form.zone === "C") { min += 500; max += 700; details.push({ name: "偏遠地區加給 (C區)", price: "+$500-700" }); }

  // Floor
  const floor = parseInt(form.floor) || 1;
  if (form.has_elevator === "no" && floor > 2) {
    const fee = (floor - 2) * 100;
    min += fee; max += fee;
    details.push({ name: `樓層搬運費 (${floor}F)`, price: `+$${fee}` });
  }

  // Pipe Length
  const pipe = parseInt(form.pipe_length) || 0;
  if (pipe > 5) { // Assuming 5m included
    const extra = pipe - 5;
    const cost = extra * 450;
    min += cost; max += cost;
    details.push({ name: `超長管線 (${extra}m)`, price: `+$${cost}` });
  }

  // High Altitude
  if (form.high_altitude) {
    min += 2000; max += 4000;
    details.push({ name: "危險施工 (懸掛)", badge: "DANGER", price: "+$2000-4000" });
  }

  // Tax
  if (form.tax_included) {
    min = Math.round(min * 1.05);
    max = Math.round(max * 1.05);
  }

  return { min, max, details };
}

function renderReviewStep() {
  const map = { "install": "新機安裝", "relocate": "冷氣移機", "repair": "維修檢測", "clean": "保養清洗" };
  document.getElementById("review-service").textContent = map[state.serviceType] || state.serviceType;
  document.getElementById("review-date-slot").textContent = `${state.form.date} (${state.form.slot === 'am' ? '早上' : (state.form.slot === 'pm' ? '下午' : '晚上')})`;
  document.getElementById("review-price").textContent = `$${state.estimate.min.toLocaleString()} - $${state.estimate.max.toLocaleString()}`;

  // Render Breakdown
  if (reviewBreakdown && state.estimate.details) {
    reviewBreakdown.innerHTML = state.estimate.details.map(item => `
      <div class="flex justify-between items-center text-xs">
        <div class="flex items-center gap-2">
          ${item.badge ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">${item.badge}</span>` : ''}
          <span class="text-slate-600 dark:text-slate-300">${item.name}</span>
        </div>
        <span class="font-bold text-slate-900 dark:text-white">${item.price}</span>
      </div>
    `).join("");

    if (state.form.tax_included) {
      reviewBreakdown.innerHTML += `
        <div class="flex justify-between items-center text-xs mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
          <span class="text-slate-500">營業稅 (5%)</span>
          <span class="font-bold text-slate-900 dark:text-white">內含</span>
        </div>
      `;
    }
  }
}

// --- Photo Handling ---

async function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              reject(new Error('壓縮失敗'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('圖片載入失敗'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('檔案讀取失敗'));
    reader.readAsDataURL(file);
  });
}

async function handlePhotoSelection(type, fileList) {
  const file = fileList[0];
  if (!file) return;

  try {
    const card = document.querySelector(`.upload-card[data-upload-target="${type}"]`);
    if (card) {
      let statusText = card.querySelector('.status-text');
      if (!statusText) {
        statusText = document.createElement('p');
        statusText.className = 'status-text text-xs text-slate-500 mt-2';
        card.appendChild(statusText);
      }
      statusText.textContent = '壓縮中...';
    }

    const compressedFile = await compressImage(file);

    state.photoQueue = state.photoQueue.filter(p => p.type !== type);
    state.photoQueue.push({ type, file: compressedFile });

    if (card) {
      const preview = card.querySelector(".preview-area");
      if (preview) {
        preview.style.backgroundImage = `url(${URL.createObjectURL(compressedFile)})`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center';
      }

      const statusText = card.querySelector('.status-text');
      if (statusText) {
        const originalSize = (file.size / 1024).toFixed(1);
        const compressedSize = (compressedFile.size / 1024).toFixed(1);
        statusText.textContent = `✓ 已壓縮 ${originalSize}KB → ${compressedSize}KB`;
        statusText.className = 'status-text text-xs text-emerald-600 mt-2 font-bold';
      }
    }
  } catch (error) {
    console.error('照片處理失敗:', error);
    alert('照片處理失敗: ' + error.message);
  }
}

async function uploadPhoto(file, type, folderId) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const base64Data = e.target.result;
        const payload = {
          folder_id: folderId,
          image_type: type,
          image_base64: base64Data
        };

        const res = await callAppsScript('upload_photo', payload, 'POST');

        if (res.status === 'success') {
          resolve(res);
        } else {
          reject(new Error('上傳失敗'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('檔案讀取失敗'));
    reader.readAsDataURL(file);
  });
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
        nextBtn.textContent = `上傳照片 (0/${state.photoQueue.length})...`;

        for (let i = 0; i < state.photoQueue.length; i++) {
          const item = state.photoQueue[i];
          nextBtn.textContent = `上傳照片 (${i + 1}/${state.photoQueue.length})...`;
          await uploadPhoto(item.file, item.type, state.folderId);
        }
      }

      showSuccess(res);
    } else {
      throw new Error(res.message || '預約失敗');
    }
  } catch (e) {
    console.error('提交失敗:', e);
    alert("預約失敗: " + e.message);
    nextBtn.disabled = false;
    nextBtn.textContent = "確認預約";
  }
}

function showSuccess(res) {
  wizardSection.classList.add("hidden");
  footerNav.classList.add("hidden");
  successSection.classList.remove("hidden");
  document.getElementById("success-job-id").textContent = res.job_id;
  if (res.pdf_url) {
    document.getElementById("success-pdf").href = res.pdf_url;
    document.getElementById("success-pdf").classList.remove("hidden");
  } else {
    document.getElementById("success-pdf").classList.add("hidden");
  }
}

// --- Calendar ---

async function renderCalendar() {
  const { year, month } = state.calendar;
  calMonthLabel.textContent = `${year}-${String(month).padStart(2, '0')}`;

  // Check Availability
  let occupiedDates = {};
  try {
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const res = await callAppsScript('check_availability', { date: firstDay }, 'GET');
    if (res.status === 'ok' && res.occupied) {
      occupiedDates = res.occupied;
    }
  } catch (e) {
    console.warn('無法檢查可用性:', e);
  }

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  calBody.innerHTML = "";

  for (let i = 0; i < firstDayOfWeek; i++) {
    calBody.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, d);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 text-slate-700 dark:text-slate-300 font-bold transition-colors";
    btn.textContent = d;

    if (dateObj < today) {
      btn.disabled = true;
      btn.className += " opacity-30 cursor-not-allowed";
    }

    if (occupiedDates[dateStr] && occupiedDates[dateStr].length >= 3) {
      btn.className += " bg-red-100 dark:bg-red-900/20 text-red-600";
      btn.title = "此日期已滿";
    } else if (occupiedDates[dateStr] && occupiedDates[dateStr].length > 0) {
      btn.className += " bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600";
      btn.title = `部分時段已占用：${occupiedDates[dateStr].join(', ')}`;
    }

    if (state.form.date === dateStr) {
      btn.className += " bg-brand-500 text-white hover:bg-brand-600";
    }

    btn.addEventListener("click", () => {
      state.form.date = dateStr;
      if (wizardForm.date) wizardForm.date.value = dateStr;
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

// ============================================
// Module Exports (for testing)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    state,
    collectFormState,
    updatePricing,
    runEstimateEngine,
    compressImage,
    handlePhotoSelection,
    uploadPhoto,
    handleSubmit,
    callAppsScript,
    getNextStep,
    getPrevStep,
    validateStep
  };
}
