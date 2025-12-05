// ===================
// 环境切换开关
// ===================
const DEV_MODE = false;   // 🔥 开发中：自动填答会开启

// ========= 配置区域 =========

// 需要【反向计分】的题号：
// raw 选择 1~5 -> 实际得分 5~1
// 你看着计分表，把需要反向的题号填进来，比如：3,5,12...
const reversedQuestions = [1, 2, 4, 7, 8, 13, 14, 16, 17, 18, 20, 23, 24, 30, 32];

// 两个主维度:封闭程度&做功阻力
const closednessTotalQs = [1, 2, 3, 4, 5, 6, 7, 8, 17, 18, 19, 20, 21, 22, 23, 24]; //1~8, 17~24
const resistanceTotalQs = [9, 10, 11, 12, 13, 14, 15, 16, 25, 26, 27, 28, 29, 30, 31, 32]; //9~16,25~32

// 五个子维度
const dimClosed = [1, 2, 3, 4, 17, 18, 19, 20];                  // 封闭性
const dimBalance = [5, 6, 21, 22];                      // 平衡态
const dimHighLinear = [7, 8, 23, 24];                   // 高线性
const dimInnerChaos = [9, 10, 11, 12, 25, 26, 27, 28];      // 内心失序
const dimEnergyBlur = [13, 14, 15, 16, 29, 30, 31, 32];     // 能量失焦

// 这里写你自己的答案：值是“你当时选的是第几个选项（1~5）”
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

/*
const questions = [
  "我感到每天都在朝自己的目标迈进。",
  "有麻烦的时候，我通常能想到一些应付的方法。",
  "一些技能(比如跑步，演讲，写作)，即使我再努力，也不会学得多好。",
  ...
  // 一直到 32 题
];

*/

// ========= 工具函数 =========

// 把原始选项（1~5）转换成最后得分
function getScore(questionNumber, rawValue) {
    const v = parseInt(rawValue, 10); // 1~5
    if (Number.isNaN(v)) return 0;

    // 反向题：1->5, 2->4, 3->3, 4->2, 5->1
    if (reversedQuestions.includes(questionNumber)) {
        return 6 - v;
    }
    // 正向题：直接用
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
function autoFillCustom(ans = 3) {
    Object.keys(ans).forEach(qNum => {
        const value = ans[qNum];           // 1~5
        const selector = `input[name="q${qNum}"][value="${value}"]`;
        const el = document.querySelector(selector);
        if (el) el.checked = true;
    });
}

// 格式化函数
function fmt(num) {
    // 最多保留三位小数
    let s = num.toFixed(3);

    // 去掉多余的 0：3.100 -> 3.1，3.000 -> 3
    s = s.replace(/\.?0+$/, "");

    return s;
}


//分页功能
let currentPage = 1;

function showPage(n) {
    document.querySelectorAll('.page').forEach(div => div.style.display = 'none');
    document.getElementById(`page${n}`).style.display = 'block';
}

function nextPage() {
    if (currentPage < 4) {
        currentPage++;
        showPage(currentPage);
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        showPage(currentPage);
    }
}


// ========= 主逻辑 =========

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('calcBtn');
    const resultDiv = document.getElementById('resultArea');

    // 初始化显示第一页（分页功能）
    showPage(1);

    if (DEV_MODE) {
        autoFillCustom(myAnswers); // ⬅ 自动用你的答案填好全部题目
    }

    btn.addEventListener('click', () => {
        const questionDivs = document.querySelectorAll('.question');
        const scores = {};  // { 题号: 得分 }
        let total = 0;

        // 逐题读取
        for (const qDiv of questionDivs) {
            const qNum = parseInt(qDiv.dataset.q, 10); // data-q
            const selected = qDiv.querySelector('input[type="radio"]:checked');

            if (!selected) {
                alert(`第 ${qNum} 题还没有选择哦`);
                return;
            }

            const score = getScore(qNum, selected.value);
            scores[qNum] = score;
            total += score;
        }

        // 总熵值区间
        let totalLevel = '';
        if (total <= 64) totalLevel = '低熵';
        else if (total <= 127) totalLevel = '中熵';
        else totalLevel = '高熵';

        // 两个主维度
        const closedTotal = sumByQuestions(scores, closednessTotalQs);
        const resistTotal = sumByQuestions(scores, resistanceTotalQs);

        // 五个子维度（最后是 1~5 分）
        const closedSub = sumByQuestions(scores, dimClosed) / 8;
        const balanceSub = sumByQuestions(scores, dimBalance) / 4;
        const highLinearSub = sumByQuestions(scores, dimHighLinear) / 4;
        const innerChaosSub = sumByQuestions(scores, dimInnerChaos) / 8;
        const energyBlurSub = sumByQuestions(scores, dimEnergyBlur) / 8;

        resultDiv.innerHTML = `
      <h2>结果</h2>
      <p>总熵值：<strong>${total}</strong> 分，暂时处于 <strong>${totalLevel}</strong> 状态。</p>
      <p>封闭程度：${closedTotal} 分</p>
      <p>做功阻力：${resistTotal} 分</p>
      <hr>
      <h4> 子维度得分（1~5分） </h4>
      <p>封闭性：${fmt(closedSub)} 分</p>
      <p>平衡态：${fmt(balanceSub)} 分</p>
      <p>高线性：${fmt(highLinearSub)} 分</p>
      <p>内心失序：${fmt(innerChaosSub)} 分</p>
      <p>能量失焦：${fmt(energyBlurSub)} 分</p>
      <p style="font-size: 0.9em; color: #666;">
        * 本测试仅供自我反思和娱乐参考，不作为任何临床诊断依据。
      </p>
    `;

        // 以后要画雷达图的话，在这里调用 drawRadar(...)
        // drawRadar(closedSub, balanceSub, highLinearSub, innerChaosSub, energyBlurSub);
    });
});

/* ====== 以后要用到的多语言 / 雷达图函数，可以先留下注释 ======

const i18n = {
  zh: {
    title: "多维熵值自测",
    // q1: "...",
  },
  en: {
    title: "Multidimensional Entropy Self-Assessment",
    // q1: "...",
  }
};

let currentLang = 'zh';

function applyLanguage(lang) {
  currentLang = lang;
  document
    .querySelectorAll('[data-i18n]')
    .forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = i18n[lang][key];
    });
}

let radarChart = null;

function drawRadar(closed, balance, highLinear, innerChaos, energyBlur) {
  const ctx = document.getElementById('entropyRadar').getContext('2d');

  if (radarChart) radarChart.destroy();

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ["封闭性", "平衡态", "高线性", "内心失序", "能量失焦"],
      datasets: [{
        label: "我的五向熵维",
        data: [closed, balance, highLinear, innerChaos, energyBlur]
      }]
    },
    options: {
      scales: {
        r: { min: 0, max: 5 }
      }
    }
  });
}

========================================================= */
