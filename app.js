const symbolSelect = document.getElementById('symbolSelect');
const timeframeSelect = document.getElementById('timeframeSelect');
const periodInput = document.getElementById('periodInput');
const refreshBtn = document.getElementById('refreshBtn');
const canvas = document.getElementById('priceCanvas');
const ctx = canvas.getContext('2d');

const summaryEl = document.getElementById('marketSummary');
const signalTextEl = document.getElementById('signalText');
const trendPill = document.getElementById('trendPill');
const volatilityPill = document.getElementById('volatilityPill');
const levelsList = document.getElementById('levelsList');

const seeds = {
  BTCUSDT: 28000,
  ETHUSDT: 1800,
  EURUSD: 1.08,
  AAPL: 190,
};

function rng(seed) {
  let t = seed + 0x6D2B79F5;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSeries(symbol, points) {
  const base = seeds[symbol] ?? 100;
  const random = rng(symbol.length * points + base);
  let last = base;
  const data = [];
  for (let i = 0; i < points; i += 1) {
    const drift = (random() - 0.49) * base * 0.012;
    const shock = (random() - 0.5) * base * 0.009;
    last = Math.max(0.0001, last + drift + shock);
    data.push(last);
  }
  return data;
}

function movingAverage(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const segment = data.slice(i - period + 1, i + 1);
    const avg = segment.reduce((a, b) => a + b, 0) / period;
    return avg;
  });
}

function exponentialMovingAverage(data, period) {
  const multiplier = 2 / (period + 1);
  let ema = data[0];
  return data.map((value, i) => {
    if (i === 0) return ema;
    ema = (value - ema) * multiplier + ema;
    return ema;
  });
}

function rsi(data, period = 14) {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i += 1) {
    const change = data[i] - data[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period || 0.0000001;

  for (let i = period + 1; i < data.length; i += 1) {
    const change = data[i] - data[i - 1];
    const gain = Math.max(0, change);
    const loss = Math.max(0, -change);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period || 0.0000001;
  }

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function drawLine(data, color, min, max, width = 2) {
  const padX = 40;
  const padY = 22;
  const w = canvas.width - padX * 2;
  const h = canvas.height - padY * 2;

  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.strokeStyle = color;

  data.forEach((v, i) => {
    if (v == null) return;
    const x = padX + (i / (data.length - 1)) * w;
    const y = padY + h - ((v - min) / (max - min || 1)) * h;
    if (i === 0 || data[i - 1] == null) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

function clearCanvas() {
  ctx.fillStyle = '#0b1324';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(131,152,194,.2)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 5; i += 1) {
    const y = (canvas.height / 6) * i;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }
}

function formatPrice(symbol, value) {
  const digits = symbol === 'EURUSD' ? 5 : value < 10 ? 4 : 2;
  return value.toFixed(digits);
}

function render() {
  const symbol = symbolSelect.value;
  const periods = Math.max(40, Number(periodInput.value) || 120);
  const data = generateSeries(symbol, periods);
  const ema21 = exponentialMovingAverage(data, 21);
  const sma50 = movingAverage(data, 50);
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const percent = ((last - prev) / prev) * 100;

  const dataMin = Math.min(...data, ...ema21.filter(Boolean), ...sma50.filter(Boolean));
  const dataMax = Math.max(...data, ...ema21.filter(Boolean), ...sma50.filter(Boolean));

  clearCanvas();
  drawLine(data, '#66d9ef', dataMin, dataMax, 2);
  drawLine(ema21, '#ffc857', dataMin, dataMax, 1.8);
  drawLine(sma50, '#ff7f7f', dataMin, dataMax, 1.8);

  const rsiValue = rsi(data);
  const trend = ema21[ema21.length - 1] > (sma50[sma50.length - 1] ?? ema21[ema21.length - 1]) ? 'Alcista' : 'Bajista';
  const volatility = ((dataMax - dataMin) / last) * 100;

  summaryEl.innerHTML = `
    <li><strong>Activo:</strong> ${symbol}</li>
    <li><strong>Marco temporal:</strong> ${timeframeSelect.value}</li>
    <li><strong>Último precio:</strong> ${formatPrice(symbol, last)}</li>
    <li><strong>Variación reciente:</strong> ${percent.toFixed(2)}%</li>
    <li><strong>RSI (14):</strong> ${rsiValue.toFixed(2)}</li>
  `;

  let signal = 'Mantener';
  let signalClass = 'flat';
  if (trend === 'Alcista' && rsiValue < 65) {
    signal = 'Compra en retroceso';
    signalClass = 'bull';
  } else if (trend === 'Bajista' && rsiValue > 40) {
    signal = 'Venta en rebote';
    signalClass = 'bear';
  }

  signalTextEl.className = signalClass;
  signalTextEl.textContent = `${signal}. Confirmar con gestión de riesgo.`;

  trendPill.textContent = `Tendencia: ${trend}`;
  trendPill.className = `pill ${trend === 'Alcista' ? 'bull' : 'bear'}`;

  const volLabel = volatility > 8 ? 'Alta' : volatility > 4 ? 'Media' : 'Baja';
  volatilityPill.textContent = `Volatilidad: ${volLabel}`;
  volatilityPill.className = `pill ${volLabel === 'Alta' ? 'bear' : volLabel === 'Media' ? 'flat' : 'bull'}`;

  const support = dataMin + (last - dataMin) * 0.35;
  const resistance = last + (dataMax - last) * 0.35;
  const stopLoss = trend === 'Alcista' ? support * 0.99 : resistance * 1.01;

  levelsList.innerHTML = `
    <li><strong>Soporte:</strong> ${formatPrice(symbol, support)}</li>
    <li><strong>Resistencia:</strong> ${formatPrice(symbol, resistance)}</li>
    <li><strong>Stop sugerido:</strong> ${formatPrice(symbol, stopLoss)}</li>
    <li><strong>Rango:</strong> ${formatPrice(symbol, dataMin)} - ${formatPrice(symbol, dataMax)}</li>
  `;
}

[symbolSelect, timeframeSelect, periodInput].forEach((el) => {
  el.addEventListener('change', render);
});
refreshBtn.addEventListener('click', render);

render();
