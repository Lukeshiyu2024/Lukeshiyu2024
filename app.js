const CITY_POLICY = {
  Berlin: {
    mealAllowancePerDay: 55,
    publicTransportPerDay: 12,
    hotelMaxPerNight: 220,
    notes: [
      '餐补按自然日计算，跨天航班当天按50%计。',
      '公共交通优先地铁/公交，打车需说明原因。',
      '酒店超标部分需主管审批。'
    ]
  },
  Paris: {
    mealAllowancePerDay: 65,
    publicTransportPerDay: 15,
    hotelMaxPerNight: 260,
    notes: [
      '含客户晚宴的当天，餐补减半。',
      '公共交通支持周票报销，需上传电子发票。',
      '临时换酒店请在24小时内补充变更说明。'
    ]
  },
  Amsterdam: {
    mealAllowancePerDay: 60,
    publicTransportPerDay: 13,
    hotelMaxPerNight: 240,
    notes: [
      '餐补可与早餐券同时存在，但总额不超过上限。',
      '会议地点远离酒店可报销打车，需附地图截图。',
      '机票改签费需上传邮件通知或会议延期证明。'
    ]
  }
};

const cityEl = document.getElementById('city');
const startEl = document.getElementById('startDate');
const endEl = document.getElementById('endDate');
const flightBaseEl = document.getElementById('flightBase');
const hotelPerNightEl = document.getElementById('hotelPerNight');
const hotelChangeEl = document.getElementById('hotelChange');
const flightChangeEl = document.getElementById('flightChange');
const extraTransportEl = document.getElementById('extraTransport');
const summaryListEl = document.getElementById('summaryList');
const policyTipsEl = document.getElementById('policyTips');

let latestCalc = null;

Object.keys(CITY_POLICY).forEach((city) => {
  const option = document.createElement('option');
  option.value = city;
  option.textContent = city;
  cityEl.appendChild(option);
});

function getDays(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const ms = endDate - startDate;
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}

function euro(n) {
  return `€${n.toFixed(2)}`;
}

function calculate() {
  const city = cityEl.value;
  const policy = CITY_POLICY[city];
  const days = getDays(startEl.value, endEl.value);

  if (!days) {
    alert('请先填写正确的出发和返回日期。');
    return null;
  }

  const nights = Math.max(days - 1, 1);
  const flightBase = Number(flightBaseEl.value) || 0;
  const hotelNight = Number(hotelPerNightEl.value) || 0;
  const hotelChange = Number(hotelChangeEl.value) || 0;
  const flightChange = Number(flightChangeEl.value) || 0;
  const extraTransport = Number(extraTransportEl.value) || 0;

  const meal = days * policy.mealAllowancePerDay;
  const transport = days * policy.publicTransportPerDay + extraTransport;
  const hotel = nights * hotelNight + hotelChange;
  const total = flightBase + flightChange + meal + transport + hotel;

  return {
    city,
    days,
    nights,
    flightBase,
    flightChange,
    meal,
    transport,
    hotel,
    total,
    overHotelLimit: Math.max(0, hotelNight - policy.hotelMaxPerNight),
    policy
  };
}

function render(calc) {
  summaryListEl.innerHTML = '';
  const items = [
    `出差城市：${calc.city}`,
    `出差天数：${calc.days} 天（${calc.nights} 晚）`,
    `餐补估算：${euro(calc.meal)}`,
    `交通估算：${euro(calc.transport)}`,
    `酒店估算：${euro(calc.hotel)}`,
    `机票估算（含改签）：${euro(calc.flightBase + calc.flightChange)}`,
    `预计可报销总额：${euro(calc.total)}`
  ];

  if (calc.overHotelLimit > 0) {
    items.push(`⚠ 酒店每晚超标：${euro(calc.overHotelLimit)}，请走审批流程`);
  }

  items.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    summaryListEl.appendChild(li);
  });

  policyTipsEl.innerHTML = '';
  calc.policy.notes.forEach((note) => {
    const li = document.createElement('li');
    li.textContent = note;
    policyTipsEl.appendChild(li);
  });
}

function exportText() {
  if (!latestCalc) {
    alert('请先生成预算。');
    return;
  }
  const lines = [
    '[出差报销说明]',
    `城市: ${latestCalc.city}`,
    `日期: ${startEl.value} 至 ${endEl.value}`,
    `天数: ${latestCalc.days} 天`,
    `餐补: ${euro(latestCalc.meal)}`,
    `交通: ${euro(latestCalc.transport)}`,
    `酒店: ${euro(latestCalc.hotel)}`,
    `机票: ${euro(latestCalc.flightBase + latestCalc.flightChange)}`,
    `总额: ${euro(latestCalc.total)}`,
    '备注: 已根据城市政策自动提醒审批要点。'
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `报销说明_${latestCalc.city}_${startEl.value}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('estimateBtn').addEventListener('click', () => {
  const calc = calculate();
  if (calc) {
    latestCalc = calc;
    render(calc);
  }
});

document.getElementById('updateBtn').addEventListener('click', () => {
  const calc = calculate();
  if (calc) {
    latestCalc = calc;
    render(calc);
  }
});

document.getElementById('exportBtn').addEventListener('click', exportText);
