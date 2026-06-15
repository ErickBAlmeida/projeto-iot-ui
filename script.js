const MAX_HISTORY = 5;
const history = [];
let intervalId = null;

function tempClass(t) {
  if (t < 20) return 'temp-cool';
  if (t <= 30) return 'temp-warm';
  return 'temp-hot';
}

function applyTheme(t) {
  const body = document.body;
  const banner = document.getElementById('theme-banner');
  body.classList.remove('theme-cold', 'theme-hot');
  banner.className = 'theme-banner';
  if (t < 20) {
    body.classList.add('theme-cold');
    banner.classList.add('cold');
    document.getElementById('banner-icon').textContent = '❄️';
    document.getElementById('banner-txt').textContent = 'Temperatura baixa — abaixo de 20 °C';
  } else if (t > 30) {
    body.classList.add('theme-hot');
    banner.classList.add('hot');
    document.getElementById('banner-icon').textContent = '🔥';
    document.getElementById('banner-txt').textContent = 'Temperatura alta — acima de 30 °C';
  }
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

function setStatus(live, msg) {
  document.getElementById('status-dot').className = 'dot' + (live ? ' live' : '');
  document.getElementById('status-txt').textContent = msg;
}

function renderHistory() {
  const el = document.getElementById('history-list');
  if (!history.length) {
    el.innerHTML = '<p class="empty-state">Nenhum dado carregado ainda.</p>';
    return;
  }
  el.innerHTML = history.slice().reverse().map(r => `
    <div class="history-row">
      <span class="date-col">${r.data_hora || '--'}</span>
      <span class="temp-pill ${tempClass(r.temperatura)}">${r.temperatura}°C</span>
      <span class="hum-col">💧 ${r.umidade}%</span>
    </div>
  `).join('');
}

async function fetchData(url) {
  const base = url.replace(/\/$/, '');
  const resp = await fetch(`${base}/leituras.json`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

function processData(data) {
  if (!data) { setStatus(false, 'Sem dados em /leituras'); return; }
  const entries = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  if (!entries.length) return;

  const latest = entries[0];
  document.getElementById('temp-val').textContent = latest.temperatura ?? '--';
  if (latest.temperatura != null) applyTheme(latest.temperatura);
  document.getElementById('hum-val').innerHTML = `${latest.umidade ?? '--'} <span>%</span>`;
  const parts = (latest.data_hora || '').split(' ');
  document.getElementById('date-val').textContent = parts[0] || '--';
  document.getElementById('time-val').textContent = parts[1] || '--';
  document.getElementById('device-val').textContent = latest.device_id || '';
  setStatus(true, 'Ao vivo · atualiza a cada 10s');
  showError('');

  const known = new Set(history.map(h => h.timestamp));
  entries.forEach(e => { if (!known.has(e.timestamp)) history.push(e); });
  history.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  renderHistory();
}

async function poll() {
  const url = document.getElementById('firebase-url').value.trim();
  if (!url) return;
  try {
    const data = await fetchData(url);
    processData(data);
  } catch (e) {
    setStatus(false, 'Erro na leitura');
    showError('Não foi possível acessar o Firebase. Verifique a URL e certifique-se de que as regras de leitura estão como ".read": true.');
  }
}

function connect() {
  showError('');
  if (intervalId) clearInterval(intervalId);
  setStatus(false, 'Conectando...');
  poll();
  intervalId = setInterval(poll, 10000);
}

connect();