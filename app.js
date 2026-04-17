// ===================
// 环境切换开关
// ===================
//const DEV_MODE = false;   // 开发中：自动填答开启；部署前改成 false

// ========= 多语言配置 & 分页 =========

let TEXT = {};           // 存各语言的数据，比如 TEXT.zh, TEXT.en
let currentLang = 'zh';  // 当前语言
let lastRadarValues = null;

const QUESTIONS_PER_PAGE = 8;
let currentPage = 1;

// 从 /data/texts.xx.json 加载语言内容
async function loadLang(lang) {
    if (TEXT[lang]) {
        return TEXT[lang];
    }
    const response = await fetch(`data/texts.${lang}.json`);
    if (!response.ok) {
        throw new Error(`加载语言文件失败: ${lang}`);
    }
    const data = await response.json();
    TEXT[lang] = data;
    return data;
}

// 应用 UI 文本（标题、副标题、按钮文字等）
function applyUiTexts(langData) {
    if (!langData || !langData.ui) return;
    const ui = langData.ui;

    const titleEl = document.getElementById('title');
    const subEl = document.getElementById('subtitle');
    const calcBtn = document.getElementById('calcBtn');

    if (titleEl && ui.title) titleEl.textContent = ui.title;
    if (subEl && ui.subtitle) subEl.textContent = ui.subtitle;
    if (calcBtn && ui.calc) calcBtn.textContent = ui.calc;

    const nameLabelEl = document.getElementById('userNameLabel');
    const nameInputEl = document.getElementById('userName');

    if (nameLabelEl && ui.nicknameLabel) {
        nameLabelEl.textContent = ui.nicknameLabel;
    }
    if (nameInputEl && ui.nicknamePlaceholder) {
        nameInputEl.placeholder = ui.nicknamePlaceholder;
    }

    // 分页按钮文字在 showPage 里顺便处理

    // ⬇️ 这里加：填 usage <details>
    if (langData.usage) {
        const u = langData.usage;
        const summaryEl = document.getElementById('usageSummary');
        const p1 = document.getElementById('usageP1');
        const p2 = document.getElementById('usageP2');
        const p3 = document.getElementById('usageP3');
        const p4 = document.getElementById('usageP4');

        if (summaryEl && u.summary) summaryEl.textContent = u.summary;
        if (p1 && u.p1) p1.textContent = u.p1;
        if (p2 && u.p2) p2.textContent = u.p2;
        if (p3 && u.p3) p3.textContent = u.p3;
        if (p4 && u.p4) p4.textContent = u.p4;
    }
}

// 切换语言
async function applyLanguage(lang) {
    if (!['zh', 'en'].includes(lang)) return;
    currentLang = lang;

    const data = await loadLang(lang);

    applyUiTexts(data);
    renderQuestionsUsing(data);

    // DEV 自动填入答案
    //if (DEV_MODE && typeof myAnswers !== 'undefined') {
    if (isDevMode() && typeof myAnswers !== 'undefined') {
        autoFillCustom(myAnswers);
    }

    // 语言切换后保持当前页
    showPage(currentPage);
}

// 放在 drawRadar 定义之后（或之前也行，只要 drawRadar 已声明）
const mq = window.matchMedia('(prefers-color-scheme: dark)');
mq.addEventListener?.('change', () => {
    if (lastRadarValues) {
        const { closedSub, balanceSub, highLinearSub, innerChaosSub, energyBlurSub } = lastRadarValues;
        drawRadar(closedSub, balanceSub, highLinearSub, innerChaosSub, energyBlurSub);
    }
});

// ========= 量表配置 =========

// 需要【反向计分】的题号：raw 选择 1~5 -> 实际得分 5~1
const reversedQuestions = [1, 2, 4, 7, 8, 13, 14, 16, 17, 18, 20, 23, 24, 30, 32];

// 两个主维度: 封闭程度 & 做功阻力
const closednessTotalQs = [1, 2, 3, 4, 5, 6, 7, 8, 17, 18, 19, 20, 21, 22, 23, 24]; // 1~8, 17~24
const resistanceTotalQs = [9, 10, 11, 12, 13, 14, 15, 16, 25, 26, 27, 28, 29, 30, 31, 32]; // 9~16, 25~32

// 五个子维度
const dimClosed = [1, 2, 3, 4, 17, 18, 19, 20];                  // 封闭性
const dimBalance = [5, 6, 21, 22];                               // 平衡态
const dimHighLinear = [7, 8, 23, 24];                            // 高线性
const dimInnerChaos = [9, 10, 11, 12, 25, 26, 27, 28];           // 内心失序
const dimEnergyBlur = [13, 14, 15, 16, 29, 30, 31, 32];          // 能量失焦

// 你自己的答案（开发测试用）：值是“你当时选的是第几个选项（1~5）”
const myAnswers = {
    1: 2,
    2: 4,
    3: 2,
    4: 4,
    5: 4,
    6: 4,
    7: 3,
    8: 2,
    9: 2,
    10: 4,
    11: 3,
    12: 4,
    13: 4,
    14: 4,
    15: 2,
    16: 2,
    17: 2,
    18: 2,
    19: 4,
    20: 3,
    21: 4,
    22: 4,
    23: 4,
    24: 2,
    25: 2,
    26: 3,
    27: 3,
    28: 4,
    29: 2,
    30: 4,
    31: 4,
    32: 4
};

// ========= 工具函数 =========

function isDevMode() {
    const p = new URLSearchParams(location.search);
    return p.get('dev') === '1';
}

// 根据 JSON 渲染题目
function renderQuestionsUsing(langData) {
    const { questions, options } = langData;
    const container = document.getElementById('questionsContainer');
    if (!container) return;

    container.innerHTML = '';

    const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

    questions.forEach((q, index) => {
        const pageIndex = Math.floor(index / QUESTIONS_PER_PAGE) + 1;

        const optionsHtml = options.map((label, i) => `
      <label>
        <input type="radio" name="q${q.id}" value="${i + 1}">
        ${label}
      </label>
    `).join('');

        container.insertAdjacentHTML('beforeend', `
      <div class="question" data-q="${q.id}" data-page="${pageIndex}">
        <div class="q-title">${q.id}. ${q.text}</div>
        <div class="options">
          ${optionsHtml}
        </div>
      </div>
    `);
    });

    const total = totalPages || 1;
    if (currentPage > total) currentPage = total;
    showPage(currentPage, total);
}

// 把原始选项（1~5）转换成最后得分
function getScore(questionNumber, rawValue) {
    const v = parseInt(rawValue, 10); // 1~5
    if (Number.isNaN(v)) return 0;

    if (reversedQuestions.includes(questionNumber)) {
        return 6 - v; // 1->5, 2->4, ...
    }
    return v;
}

// 根据题号数组求和（没做的题自动当 0）
function sumByQuestions(scoresMap, questionArray) {
    return questionArray.reduce((acc, q) => {
        const val = scoresMap[q];
        return acc + (typeof val === 'number' ? val : 0);
    }, 0);
}

// 自动填入指定答案：ans 是 { 题号: 选项序号 } 形式
function autoFillCustom(ans = {}) {
    Object.keys(ans).forEach(qNum => {
        const value = ans[qNum];           // 1~5
        const selector = `input[name="q${qNum}"][value="${value}"]`;
        const el = document.querySelector(selector);
        if (el) el.checked = true;
    });
}

// 格式化函数：最多保留三位小数，去掉尾部 0
function fmt(num) {
    let s = num.toFixed(3);
    s = s.replace(/\.?0+$/, "");
    return s;
}

function getShareText(key) {
    const langData = TEXT[currentLang];
    if (langData && langData.ui && langData.ui[key]) {
        return langData.ui[key];
    }
    // 兜底（万一 JSON 漏了某个 key）
    const fallback = {
        shareGenerating: currentLang === 'en' ? 'Generating image...' : '正在生成图片...',
        shareCopyOk: currentLang === 'en' ? 'Image copied to clipboard ✅' : '已复制图片到剪贴板 ✅',
        shareCopyUnsupported: currentLang === 'en'
            ? 'Your browser does not support copying images. Please use Download instead.'
            : '浏览器不支持直接复制图片，请使用下载功能',
        shareCopyFail: currentLang === 'en' ? 'Copy failed. Please try again.' : '复制失败，请重试',
        shareDownloadOk: currentLang === 'en' ? 'Image download started 📥' : '已开始下载图片 📥',
        shareDownloadFail: currentLang === 'en' ? 'Download failed. Please try again.' : '下载失败，请重试',
        shareShareOpened: currentLang === 'en' ? 'Share sheet opened ✅' : '已打开分享面板 ✅',
        shareShareFail: currentLang === 'en' ? 'Share failed. Please try again.' : '分享失败，请重试',
        shareTitle: currentLang === 'en' ? 'Entropy Report' : '熵值测试报告',
        shareText: currentLang === 'en' ? 'My entropy test report' : '我的熵值测试报告'

    };
    return fallback[key] || '';
}

function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}


// 分页功能
function showPage(n, totalPagesOverride) {
    const qs = document.querySelectorAll('.question');
    const totalPages = totalPagesOverride || Math.ceil(qs.length / QUESTIONS_PER_PAGE) || 1;

    if (n < 1) n = 1;
    if (n > totalPages) n = totalPages;
    currentPage = n;

    qs.forEach(div => {
        const page = parseInt(div.dataset.page, 10);
        div.style.display = (page === n) ? 'block' : 'none';
    });

    const indicator = document.getElementById('pageIndicator');
    const langData = TEXT[currentLang];
    if (indicator && langData && langData.ui) {
        const tpl = langData.ui.pageIndicator || '第 {cur} 页 / 共 {total} 页';
        indicator.textContent = tpl
            .replace('{cur}', String(n))
            .replace('{total}', String(totalPages));
    }

    // 更新按钮文本
    const prevBtn = document.querySelector('.pager button[onclick="prevPage()"]');
    const nextBtn = document.querySelector('.pager button[onclick="nextPage()"]');
    const calcBtn = document.getElementById('calcBtn');
    if (langData && langData.ui) {
        if (prevBtn && langData.ui.prev) prevBtn.textContent = langData.ui.prev;
        if (nextBtn && langData.ui.next) nextBtn.textContent = langData.ui.next;
        if (calcBtn && langData.ui.calc) calcBtn.textContent = langData.ui.calc;
    }

    // UI feedback only: reflect page boundaries on pager buttons.
    if (prevBtn) prevBtn.disabled = (n <= 1);
    if (nextBtn) nextBtn.disabled = (n >= totalPages);
}

function nextPage() {
    showPage(currentPage + 1);
}

function prevPage() {
    showPage(currentPage - 1);
}

function renderReport(lang, ctx) {
    const t = TEXT[lang].report;
    const {
        resultDiv,
        displayName, todayStr,
        total, totalLevel,
        closedTotal, resistTotal,
        closedType, resistType,
        closedSub, balanceSub, highLinearSub, innerChaosSub, energyBlurSub,
        animal
    } = ctx;

    const bookLink = `<a href="${t.bookUrl}" target="_blank">${t.bookTitle}</a>`;
    const creditHtml = t.credit
        .replace('{bookLink}', bookLink)
        .replace('{author}', t.bookAuthor);

    resultDiv.innerHTML = `
    <div id="reportCard" class="report-card">

      <h2>${t.title}</h2>
      <p>${t.labelName}：<strong>${displayName}</strong></p>
      <p>${t.labelDate}：${todayStr}</p>
      <hr>

      <section>
        <h3>${t.overallTitle}</h3>
        <p>${t.overallText1}<strong>${total} ${t.unitScore}</strong>，${t.overallText2} <strong>${totalLevel}</strong>。</p>
        
         <p class="hint">
            ${t.overallHint}<br>
            ${t.overallDynamicHint}
        </p>
      </section>

      <section>
        <h3>${t.axesTitle}</h3>
        <p><strong>${t.closedLabel}：</strong>${closedTotal} ${t.unitScore}</p>
        <p class="hint">${closedType}</p>

        <p><strong>${t.resistLabel}：</strong>${resistTotal} ${t.unitScore}</p>
        <p class="hint">${resistType}</p>
      </section>

      <section class="animal-section">
        <h3>${t.animalTitle}：${animal.name}</h3>
        <div class="animal-box">
          <img src="${animal.img}" alt="${animal.name}" class="animal-img">
          <div class="animal-text">
            <p>${animal.summary}</p>
            <ul>
              ${animal.points.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        </div>
      </section>

       <p class="hint label-warning">${t.labelWarning}</p>

      <section class="radar-section">
        <h3>${t.dimTitle}</h3>
        <div class="radar-wrapper">
          <canvas id="entropyRadar"></canvas>
        </div>

        <p><strong>${t.dimClosed}：</strong>${fmt(closedSub)} ${t.unitScore}<br>
          <span class="hint">${t.dimClosedHint}</span></p>
        <p><strong>${t.dimBalance}：</strong>${fmt(balanceSub)} ${t.unitScore}<br>
          <span class="hint">${t.dimBalanceHint}</span></p>
        <p><strong>${t.dimHighLinear}：</strong>${fmt(highLinearSub)} ${t.unitScore}<br>
          <span class="hint">${t.dimHighLinearHint}</span></p>
        <p><strong>${t.dimInnerChaos}：</strong>${fmt(innerChaosSub)} ${t.unitScore}<br>
          <span class="hint">${t.dimInnerChaosHint}</span></p>
        <p><strong>${t.dimEnergyBlur}：</strong>${fmt(energyBlurSub)} ${t.unitScore}<br>
          <span class="hint">${t.dimEnergyBlurHint}</span></p>
      </section>

        <p class="hint">${t.dimMetaHint}</p>

       


        <p class="credit">${creditHtml}</p>
    </div>

    <div class="share-actions">
      <button type="button" id="shareImgBtn">${lang == 'zh' ? '分享 / 保存' : 'Share / Save'}</button>
      <button type="button" id="copyImgBtn">${lang === 'zh' ? '复制图片' : 'Copy Image'}</button>
      <button type="button" id="downloadImgBtn">${lang === 'zh' ? '下载图片' : 'Download Image'}</button>
      <span id="shareStatus" class="share-status"></span>
    </div>
  `;
}


// 五维度雷达图（支持多语言）
let radarChart = null;

function drawRadar(closed, balance, highLinear, innerChaos, energyBlur) {
    const canvas = document.getElementById('entropyRadar');
    if (!canvas) return;

    const gridColor = cssVar('--chart-grid');
    const tickColor = cssVar('--chart-tick');
    const labelColor = cssVar('--chart-label');
    const fillColor = cssVar('--chart-fill');
    const lineColor = cssVar('--chart-line');

    // 从当前语言的文本里拿维度名 & 数据集标题
    const langData = TEXT[currentLang];
    const r = langData && langData.report ? langData.report : {};

    const labels = [
        r.dimClosed || "封闭性",
        r.dimHighLinear || "高线性",
        r.dimEnergyBlur || "能量失焦",
        r.dimInnerChaos || "内心失序",
        r.dimBalance || "平衡态"
    ];

    const datasetLabel = r.radarLabel || r.dimTitle || "五维熵值";

    if (radarChart) {
        radarChart.destroy();
    }

    radarChart = new Chart(canvas.getContext('2d'), {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                data: [closed, highLinear, energyBlur, innerChaos, balance],
                backgroundColor: fillColor,
                borderColor: lineColor,
                pointBackgroundColor: lineColor,
                pointBorderColor: lineColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        color: tickColor,
                        backdropColor: 'transparent', // ✅ 去掉灰底
                        showLabelBackdrop: false      // ✅ 不画背板
                    },
                    grid: { color: gridColor },
                    angleLines: { color: gridColor },
                    pointLabels: { color: labelColor, font: { size: 14 } }
                }
            }
        }
    });
}

function getAnimalType(closedTotal, resistTotal) {
    const isGrowth = closedTotal <= 40;
    const isEfficient = resistTotal <= 40;

    // 1. 判定 key
    let key;
    if (isGrowth && isEfficient) {
        key = 'dolphin';
    } else if (isGrowth && !isEfficient) {
        key = 'sloth';
    } else if (!isGrowth && isEfficient) {
        key = 'rhino';
    } else {
        key = 'tunicate';
    }

    // 2. 当前语言里的 animals 文案
    const langData = TEXT[currentLang];
    const animals = langData && langData.report && langData.report.animals
        ? langData.report.animals
        : {};

    const info = animals[key] || {
        name: key,
        summary: '',
        points: []
    };

    // 3. 图片路径（语言无关，直接在 JS 里写就好）
    const imgMap = {
        dolphin: 'img/animals/dolphin.png',
        sloth: 'img/animals/sloth.png',
        rhino: 'img/animals/rhino.png',
        tunicate: 'img/animals/tunicate.png'
    };

    return {
        key,
        img: imgMap[key],
        name: info.name,
        summary: info.summary,
        points: info.points || []
    };
}


// ================ 结果 & 分享 ================

async function generateReportImage() {
    const card = document.getElementById('reportCard');
    if (!card) return null;

    const canvas = await html2canvas(card, { scale: 2 });
    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png');
    });
}

async function copyReportImage() {
    const status = document.getElementById('shareStatus');
    status.textContent = getShareText('shareGenerating');

    try {
        const blob = await generateReportImage();
        if (!blob) {
            status.textContent = getShareText('shareCopyFail');
            return;
        }

        if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            status.textContent = getShareText('shareCopyOk');
        } else {
            status.textContent = getShareText('shareCopyUnsupported');
        }
    } catch (err) {
        console.error(err);
        //status.textContent = getShareText('shareCopyFail');
        status.textContent = `${getShareText('shareCopyFail')} (${err?.name || 'Error'})`;

    }
}

async function downloadReportImage() {
    const status = document.getElementById('shareStatus');
    status.textContent = getShareText('shareGenerating');

    try {
        const blob = await generateReportImage();
        if (!blob) {
            status.textContent = getShareText('shareDownloadFail');
            return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const todayStr = new Date().toISOString().slice(0, 10);

        a.href = url;
        a.download = `entropy-report-${todayStr}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        status.textContent = getShareText('shareDownloadOk');
    } catch (err) {
        console.error(err);
        status.textContent = getShareText('shareDownloadFail');
    }
}

async function shareReportImage() {
    const status = document.getElementById('shareStatus');
    status.textContent = getShareText('shareGenerating');

    try {
        const blob = await generateReportImage();
        if (!blob) {
            status.textContent = getShareText('shareShareFail'); // 新 key
            return;
        }

        const file = new File([blob], 'entropy-report.png', { type: 'image/png' });

        // ✅ 移动端：优先系统分享
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: getShareText('shareTitle') || 'Entropy Report',   // 新 key（可选）
                text: getShareText('shareText') || ''                  // 新 key（可选）
            });

            status.textContent = getShareText('shareShareOpened');     // 新 key
            return;
        }

        // 兜底：不支持 share -> 下载
        await downloadReportImage();
    } catch (e) {
        console.error(e);
        status.textContent = getShareText('shareShareFail');         // 新 key
    }
}

// ========= 主逻辑 =========
// ================ 主逻辑（入口） ================

document.addEventListener('DOMContentLoaded', async () => {
    const btn = document.getElementById('calcBtn');
    const resultDiv = document.getElementById('resultArea');

    try {
        // 初始加载中文
        currentLang = 'zh';
        const zhData = await loadLang('zh');
        applyUiTexts(zhData);
        renderQuestionsUsing(zhData);

        if (isDevMode() && typeof myAnswers !== 'undefined') {
            autoFillCustom(myAnswers);
        }

        showPage(1);
    } catch (err) {
        console.error(err);
        alert('加载题目失败，请稍后重试');
        return;
    }

    btn.addEventListener('click', () => {
        const questionDivs = document.querySelectorAll('.question');
        const scores = {};
        let total = 0;

        for (const qDiv of questionDivs) {
            const qNum = parseInt(qDiv.dataset.q, 10);
            const selected = qDiv.querySelector('input[type="radio"]:checked');

            if (!selected) {
                if (currentLang === 'zh') {
                    alert(`第 ${qNum} 题还没有选择哦`);
                } else {
                    alert(`Question ${qNum} has not been answered yet.`);
                }
                return;
            }

            const score = getScore(qNum, selected.value);
            scores[qNum] = score;
            total += score;
        }

        // 总熵值区间
        /*
        let totalLevel = '';
        if (total <= 64) totalLevel = '低熵';
        else if (total <= 127) totalLevel = '中熵';
        else totalLevel = '高熵';
        */

        let levelKey = total <= 64 ? 'low' : (total <= 127 ? 'medium' : 'high');
        totalLevel = TEXT[currentLang].entropyLevel[levelKey];


        // 两个主维度
        const closedTotal = sumByQuestions(scores, closednessTotalQs);
        const resistTotal = sumByQuestions(scores, resistanceTotalQs);


        // 五个子维度（最后是 1~5 分）
        const closedSub = sumByQuestions(scores, dimClosed) / 8;
        const balanceSub = sumByQuestions(scores, dimBalance) / 4;
        const highLinearSub = sumByQuestions(scores, dimHighLinear) / 4;
        const innerChaosSub = sumByQuestions(scores, dimInnerChaos) / 8;
        const energyBlurSub = sumByQuestions(scores, dimEnergyBlur) / 8;

        // 动物类型
        const animal = getAnimalType(closedTotal, resistTotal);

        // 主维度解释
        let closedType = '';
        let resistType = '';

        closedType = closedTotal <= 40
            ? TEXT[currentLang].explain.closedGrowth
            : TEXT[currentLang].explain.closedFixed;

        resistType = resistTotal <= 40
            ? TEXT[currentLang].explain.resistEfficient
            : TEXT[currentLang].explain.resistInefficient;

        /*
        if (closedTotal <= 40) {
            closedType = '你的整体思维更偏向「成长型思维」：分数越低，说明越开放、越容易相信自己可以通过努力改变。';
        } else {
            closedType = '你的整体思维略偏向「固化型思维」：分数越高，说明越容易固守既有看法，较不愿意尝试改变。';
        }
    
        if (resistTotal <= 40) {
            resistType = '你在「做功」时整体偏向「增效做功」：分数越低，说明行动更高效、能量更容易用在有价值的事情上。';
        } else {
            resistType = '你在「做功」时略偏向「内耗做工」：分数越高，说明更容易陷入犹豫、反复、情绪消耗，效率会被拖慢。';
        }
            */

        const nameInput = document.getElementById('userName');
        const displayName = nameInput && nameInput.value.trim()
            ? nameInput.value.trim()
            : (currentLang === 'zh' ? '（未填写）' : '(not provided)');

        const todayStr = (currentLang === 'zh')
            ? new Date().toLocaleDateString('zh-CN')
            : new Date().toLocaleDateString('en-GB');

        // ✅ 用统一的模板函数渲染报告（里面负责写 innerHTML + 画雷达 + 绑定按钮）
        renderReport(currentLang, {
            resultDiv,
            displayName,
            todayStr,
            total,
            totalLevel,
            closedTotal,
            resistTotal,
            closedType,
            resistType,
            closedSub,
            balanceSub,
            highLinearSub,
            innerChaosSub,
            energyBlurSub,
            animal
        });

        lastRadarValues = { closedSub, balanceSub, highLinearSub, innerChaosSub, energyBlurSub };

        // ⬇️ 报告的 HTML 已经包含 <canvas id="entropyRadar"> 了
        drawRadar(closedSub, balanceSub, highLinearSub, innerChaosSub, energyBlurSub);


        // ⬇️ 现在再去抓按钮并绑定点击事件
        const copyBtn = document.getElementById('copyImgBtn');
        const dlBtn = document.getElementById('downloadImgBtn');
        const shareBtn = document.getElementById('shareImgBtn');
        if (shareBtn) shareBtn.addEventListener('click', shareReportImage);


        if (copyBtn) {
            copyBtn.onclick = copyReportImage;
        }
        if (dlBtn) {
            dlBtn.onclick = downloadReportImage;
        }
    });
});
