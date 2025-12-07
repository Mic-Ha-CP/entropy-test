// ===================
// 环境切换开关
// ===================
const DEV_MODE = true;   // 🔥 开发中：自动填答会开启

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

//五维度雷达图
let radarChart = null;

function drawRadar(closed, balance, highLinear, innerChaos, energyBlur) {
    const ctx = document.getElementById('entropyRadar').getContext('2d');

    if (radarChart) radarChart.destroy();

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ["封闭性", "高线性", "能量失焦", "内心失序", "平衡态"],
            datasets: [{
                label: "我的五向熵维",
                data: [closed, highLinear, energyBlur, innerChaos, balance],
                borderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            scales: {
                r: { min: 0, max: 5 }
            }
        }
    });
}

function getAnimalType(closedTotal, resistTotal) {
  const isGrowth = closedTotal <= 40;
  const isEfficient = resistTotal <= 40;

  if (isGrowth && isEfficient) {
    return {
      key: 'dolphin',
      name: '海豚型（成长 + 增效）',
      img: 'img/animals/dolphin.png',
      summary: '高开放、低内阻，既敢伸展又能高效行动，是典型的「心流型」配置。',
      points: [
        '高开放、低内阻：更愿意尝试新的可能，也比较不怕犯错。',
        '能不断扩大伸展圈：主动探索、愿意尝试新事物。',
        '目标清晰，认知能量集中在重要事情上。',
        '能在过程里找到乐趣，遇到挫折也有恢复力。'
      ]
    };
  }

  if (isGrowth && !isEfficient) {
    return {
      key: 'sloth',
      name: '树懒型（成长 + 内耗）',
      img: 'img/animals/sloth.png',
      summary: '内心想成长，但行动常常被拖延与情绪内耗拉住。',
      points: [
        '高开放、高内阻：想成长，但不容易迈出第一步。',
        '目标明确，但执行困难，容易犹豫拖延。',
        '能量涣散，容易被想法与情绪拉走注意力。',
        '有成长意识，但弹性较弱，压力时容易失衡。'
      ]
    };
  }

  if (!isGrowth && isEfficient) {
    return {
      key: 'rhino',
      name: '犀牛型（固化 + 增效）',
      img: 'img/animals/rhino.png',
      summary: '做事高效、能吃苦，但容易停留在舒适圈而缺乏突破。',
      points: [
        '低开放、低内阻：能稳定输出，但变化动力不足。',
        '能量旺盛，但多用于熟悉领域。',
        '抗压好、执行力强，但未必关注成长过程。',
        '偏重结果，较少关注体验与自我更新。'
      ]
    };
  }

  return {
    key: 'tunicate',
    name: '海鞘型（固化 + 内耗）',
    img: 'img/animals/tunicate.png',
    summary: '容易卡住、感觉疲惫，既抗拒改变又容易被情绪消耗。',
    points: [
      '低开放、高内阻：习惯待在安全区，不愿迈出变化。',
      '目标缺乏方向，能量分散或不足。',
      '容易陷入负面循环，对挫折更敏感。',
      '内耗导致行动困难，成长动力降低。'
    ]
  };
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

        // 动物类型
        const animal = getAnimalType(closedTotal, resistTotal);

        // 主维度解释
        let closedType = '';
        if (closedTotal <= 40) {
            closedType = '你的整体思维更偏向「成长型思维」：分数越低，说明越开放、越容易相信自己可以通过努力改变。';
        } else {
            closedType = '你的整体思维略偏向「固化型思维」：分数越高，说明越容易固守既有看法，较不愿意尝试改变。';
        }

        let resistType = '';
        if (resistTotal <= 40) {
            resistType = '你在「做功」时整体偏向「增效做功」：分数越低，说明行动更高效、能量更容易用在有价值的事情上。';
        } else {
            resistType = '你在「做功」时略偏向「内耗做工」：分数越高，说明更容易陷入犹豫、反复、情绪消耗，效率会被拖慢。';
        }



        resultDiv.innerHTML = `
  <h2>测验结果</h2>

  <section>
    <h3>整体熵值</h3>
    <p>总熵值：<strong>${total}</strong> 分，目前处于 <strong>${totalLevel}</strong> 状态。</p>
    <p class="hint">
      一般来说，总熵值越高，说明系统（人生 / 心境）的不确定性、波动性越大；
      越低则代表状态更稳定、有序。但「高 / 低」并不等于「好 / 坏」，需要结合你的成长目标一起看。
    </p>
  </section>

  <section>
    <h3>两条主轴</h3>
    <p><strong>封闭程度：</strong>${closedTotal} 分</p>
    <p class="hint">
      分数越低说明越开放，越高则越封闭。大致来说：≤ 40 分偏向「成长型思维」，> 40 分偏向「固化型思维」。
      <br>${closedType}
    </p>

    <p><strong>做功阻力：</strong>${resistTotal} 分</p>
    <p class="hint">
      分数越低说明做事更高效、能量更容易被用在「真正重要的事情」上；分数越高则说明更容易内耗、拖延。
      大致来说：≤ 40 分偏向「增效做功」，> 40 分偏向「内耗做工」。
      <br>${resistType}
    </p>
  </section>

     <section class="animal-section">
    <h3>你的类型：${animal.name}</h3>

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

  <hr>

  <section>
    <h3>五个子维度（1～5 分）</h3>
    <p><strong>封闭性：</strong>${fmt(closedSub)} 分<br>
      <span class="hint">相关构念：目标感、自我效能感、学习信念、积极认知。</span>
    </p>
    <p><strong>平衡态：</strong>${fmt(balanceSub)} 分<br>
      <span class="hint">相关构念：回避挑战、拒绝改变。</span>
    </p>
    <p><strong>高线性：</strong>${fmt(highLinearSub)} 分<br>
      <span class="hint">相关构念：坚毅特质、过程导向。</span>
    </p>
    <p><strong>内心失序：</strong>${fmt(innerChaosSub)} 分<br>
      <span class="hint">相关构念：情绪敏感、控制想法、抑制欲望、反脆弱。</span>
    </p>
    <p><strong>能量失焦：</strong>${fmt(energyBlurSub)} 分<br>
      <span class="hint">相关构念：专注力、设定目标、抗压力、逆商。</span>
    </p>
  </section>

  <p style="font-size: 0.9em; color: #666; margin-top: 1em;">
    * 本测试改编自相关书籍中的自测量表，仅供个人反思与交流使用，不作为任何临床诊断或专业评估依据。
  </p>
`;

        resultDiv.innerHTML += `
  <p class="credit">
    题目与部分解释参考自：
    <a href="https://weread.qq.com/web/bookDetail/65932700813ab7a60g010c78" target="_blank">
      《从内耗到心流：复杂时代下的熵减行动指南》
    </a>，
    作者：杨鸣。仅供个人学习交流使用，如有侵权请联系我撤下。
  </p>
`;


        // 以后要画雷达图的话，在这里调用 drawRadar(...)
        drawRadar(closedSub, balanceSub, highLinearSub, innerChaosSub, energyBlurSub);
    });
});

/*====== 以后要用到的多语言 / 雷达图函数，可以先留下注释 ======

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
*/

//========================================================= 
