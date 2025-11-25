// ============================================
// HVAC App - 缺失功能補充程式碼
// ============================================
// 此檔案包含所有需要加入 app.js 的新功能
// 請依序複製到 app.js 的對應位置

// ============================================
// 1. 照片壓縮函數 (插入位置：collectFormState 之後)
// ============================================
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

// ============================================
// 2. 照片選擇處理 (插入位置：compressImage 之後)
// ============================================
async function handlePhotoSelection(type, fileList) {
    const file = fileList[0];
    if (!file) return;

    try {
        // 顯示壓縮中
        const card = document.querySelector(`.upload-card[data-upload-target="${type}"]`);
        if (card) {
            const statusText = card.querySelector('.status-text') || document.createElement('p');
            statusText.className = 'status-text text-xs text-slate-500 mt-2';
            statusText.textContent = '壓縮中...';
            if (!card.querySelector('.status-text')) {
                card.appendChild(statusText);
            }
        }

        // 壓縮圖片
        const compressedFile = await compressImage(file);

        // 更新 photoQueue
        state.photoQueue = state.photoQueue.filter(p => p.type !== type);
        state.photoQueue.push({ type, file: compressedFile });

        // 顯示預覽
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

// ============================================
// 3. 照片上傳函數 (插入位置：handlePhotoSelection 之後)
// ============================================
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

// ============================================  
// 4. 表單提交函數 (插入位置：uploadPhoto 之後)
// ============================================
async function handleSubmit() {
    nextBtn.disabled = true;
    nextBtn.textContent = "處理中...";

    try {
        // 收集表單資料
        const payload = {
            ...state.form,
            estimate_min: state.estimate.min,
            estimate_max: state.estimate.max,
            notes: state.form.repair_desc || ""
        };

        // 建立訂單
        const res = await callAppsScript("create_job", payload);

        if (res.status === "success") {
            state.jobId = res.job_id;
            state.folderId = res.folder_id;

            // 上傳照片
            if (state.photoQueue.length > 0) {
                nextBtn.textContent = `上傳照片 (0/${state.photoQueue.length})...`;

                for (let i = 0; i < state.photoQueue.length; i++) {
                    const item = state.photoQueue[i];
                    nextBtn.textContent = `上傳照片 (${i + 1}/${state.photoQueue.length})...`;
                    await uploadPhoto(item.file, item.type, state.folderId);
                }
            }

            // 顯示成功畫面
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

// ============================================
// 5. collectFormState 更新 (替換現有函數)
// ============================================
// 在原有的 collectFormState 函數中，return 物件加入：
/*
brand_model: fd.get("brand_model") || "",
wall_type: fd.get("wall_type") || "rc",
indoor_unit_count: fd.get("indoor_unit_count") || "1",
*/

// ============================================
// 6. 日曆可用性檢查 (插入位置：renderCalendar 函數內)
// ============================================
async function renderCalendarWithAvailability() {
    const { year, month } = state.calendar;
    calMonthLabel.textContent = `${year}-${String(month).padStart(2, '0')}`;

    // 取得當月已占時段
    let occupiedDates = {};
    try {
        const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
        const res = await callAppsScript('check_availability', { date: firstDay }, 'GET');
        if (res.status === 'ok' && res.occupied) {
            occupiedDates = res.occupied; // { "2025-01-15": ["am", "pm"], ... }
        }
    } catch (e) {
        console.warn('無法檢查可用性:', e);
    }

    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    calBody.innerHTML = "";

    // 空白補位
    for (let i = 0; i < firstDayOfWeek; i++) {
        calBody.appendChild(document.createElement("div"));
    }

    // 日期按鈕
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(year, month - 1, d);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 text-slate-700 dark:text-slate-300 font-bold transition-colors";
        btn.textContent = d;

        // 過去日期禁用
        if (dateObj < today) {
            btn.disabled = true;
            btn.className += " opacity-30 cursor-not-allowed";
        }

        // 已被占用的日期標示
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
            renderCalendarWithAvailability();
        });

        calBody.appendChild(btn);
    }
}

// ============================================
// 7. Service Worker 註冊 (插入位置：init 函數最後)
// ============================================
// 在 init() 函數最後加入：
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker 註冊成功:', reg.scope))
      .catch(err => console.log('Service Worker 註冊失敗:', err));
  });
}
*/

// ============================================
// 8. Module Exports (檔案最後)
// ============================================
/*
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    state,
    collectFormState,
    updatePricing,
    runEstimateEngine,
    handlePhotoSelection,
    uploadPhoto,
    handleSubmit,
    compressImage,
    callAppsScript
  };
}
*/
