// Firebase Configuration & Initialization
let db = null;
let firebaseConfig = null;
let useFirebase = false;

// Initialize Firebase if configured
async function initializeFirebase() {
  firebaseConfig = localStorage.getItem('firebaseConfig');
  if (!firebaseConfig) {
    showSetupModal();
    return false;
  }

  try {
    const config = JSON.parse(firebaseConfig);
    firebaseConfig = config;
    useFirebase = true;
    
    // Load Firebase SDK
    if (!window.firebase) {
      await loadFirebaseSDK();
    }
    
    // Initialize Firebase
    firebase.initializeApp(config);
    db = firebase.database();
    
    // Load data from Firebase
    await loadDataFromFirebase();
    return true;
  } catch (e) {
    console.log('Firebase config invalid, using local storage');
    return false;
  }
}

async function loadFirebaseSDK() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
    script.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
      script2.onload = resolve;
      script2.onerror = reject;
      document.head.appendChild(script2);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function showSetupModal() {
  document.getElementById('setup-modal').style.display = 'flex';
}

function saveFirebaseConfig() {
  const apiKey = document.getElementById('api-key').value.trim();
  const projectId = document.getElementById('project-id').value.trim();
  const databaseURL = document.getElementById('db-url').value.trim();

  if (!apiKey || !projectId || !databaseURL) {
    toast('Preencha todos os campos');
    return;
  }

  const config = {
    apiKey: apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    databaseURL: databaseURL,
    projectId: projectId,
    storageBucket: `${projectId}.appspot.com`,
    messagingSenderId: '',
    appId: ''
  };

  localStorage.setItem('firebaseConfig', JSON.stringify(config));
  document.getElementById('setup-modal').style.display = 'none';
  location.reload();
}

function useLocalStorage() {
  localStorage.setItem('useLocalOnly', 'true');
  document.getElementById('setup-modal').style.display = 'none';
  initApp();
}

async function loadDataFromFirebase() {
  if (!db) return;

  try {
    const snapshot = await db.ref('pharmastock').once('value');
    const data = snapshot.val();
    
    if (data) {
      produtos = data.produtos || [];
      baias = data.baias || {};
      paletes = data.paletes || { pp1: {}, pp2: {} };
      historico = data.historico || [];
    }
    
    updMetrics();
  } catch (e) {
    console.error('Error loading from Firebase:', e);
  }
}

async function saveDataToFirebase() {
  if (!db || !useFirebase) return;

  try {
    await db.ref('pharmastock').set({
      produtos: produtos,
      baias: baias,
      paletes: paletes,
      historico: historico,
      lastUpdate: new Date().toISOString()
    });
  } catch (e) {
    console.error('Error saving to Firebase:', e);
  }
}

// Local storage fallback
function saveToLocalStorage() {
  const data = {
    produtos,
    baias,
    paletes,
    historico,
    lastUpdate: new Date().toISOString()
  };
  localStorage.setItem('pharmastock_data', JSON.stringify(data));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem('pharmastock_data');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      produtos = parsed.produtos || [];
      baias = parsed.baias || {};
      paletes = parsed.paletes || { pp1: {}, pp2: {} };
      historico = parsed.historico || [];
    } catch (e) {
      console.error('Error loading local storage:', e);
    }
  }
}

// App data
const N_COLS = 62, N_BAND = 6, N_POS = 4, PP1 = 32, PP2 = 26;

let produtos = [];
let baias = {};
let paletes = { pp1: {}, pp2: {} };
let historico = [];
let tipoMov = 'entrada';
let impRows = [];

// Utility functions
function colN(n) {
  return 'N' + String(n).padStart(3, '0');
}

function convertAddr(r, c, b, p) {
  const col = parseInt(r) || 1;
  const band = parseInt(b) || 1;
  const baia = parseInt(p) || 1;
  return { col, band, baia, label: `${colN(col)} · B${band} · P${baia}` };
}

function getStatus(p) {
  if (!p.min || p.min === 0) return 'ok';
  const ratio = p.qtd / p.min;
  if (ratio <= 0.3) return 'danger';
  if (ratio < 1) return 'warn';
  return 'ok';
}

function updMetrics() {
  const alerts = produtos.filter(p => getStatus(p) !== 'ok').length;
  document.getElementById('m-total').textContent = produtos.length;
  document.getElementById('m-alert').textContent = alerts;
  document.getElementById('nbadge').textContent = alerts;
  const baiaOcup = Object.keys(baias).length;
  document.getElementById('m-baias').textContent = (N_COLS * N_BAND * N_POS - baiaOcup);
  const palOcup = Object.keys(paletes.pp1).length + Object.keys(paletes.pp2).length;
  document.getElementById('m-pals').textContent = (PP1 + PP2 - palOcup);
  renderDashAlertas();
  renderDashHist();
}

function renderDashAlertas() {
  const alerts = produtos.filter(p => getStatus(p) !== 'ok');
  const el = document.getElementById('dash-alertas');
  if (!alerts.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--m);text-align:center;padding:14px">Nenhum alerta ativo</div>';
    return;
  }
  el.innerHTML = alerts.map(p => {
    const s = getStatus(p);
    const cls = s === 'danger' ? 'danger' : 'warn';
    const ico = s === 'danger' ? 'ti-alert-triangle' : 'ti-alert-circle';
    return `<div class="alert-card ${cls}"><i class="ti ${ico}" aria-hidden="true"></i><div><div class="alert-title">${p.desc} — ${s === 'danger' ? 'crítico' : 'baixo'}</div><div class="alert-desc">${p.qtd} un. · mín ${p.min} · <span style="font-family:var(--mono)">${p.addr}</span></div></div></div>`;
  }).join('');
}

function renderDashHist() {
  const el = document.getElementById('dash-hist');
  if (!historico.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--m);text-align:center;padding:10px">Nenhuma movimentação ainda</div>';
    return;
  }
  el.innerHTML = '<div style="padding:2px 0">' + historico.slice(0, 5).map(h => `
    <div class="hist-item">
      <div class="hdot ${h.tipo}"></div>
      <div class="hi"><div class="hn">${h.desc}</div><div class="hm">${h.hora} · ${h.addr}</div></div>
      <div class="hq ${h.tipo}">${h.tipo === 'in' ? '+' : '−'}${h.qtd}</div>
    </div>`).join('') + '</div>';
  document.getElementById('mov-hist').innerHTML = el.innerHTML;
}

function renderProdutos(lista) {
  const el = document.getElementById('lista-prod');
  if (!lista.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--m);text-align:center;padding:24px">Nenhum produto encontrado</div>';
    return;
  }
  el.innerHTML = lista.map(p => {
    const s = getStatus(p);
    const pct = p.min ? Math.min(100, Math.round(p.qtd / p.min * 100)) : 100;
    const barC = s === 'ok' ? 'var(--g)' : s === 'warn' ? 'var(--a)' : 'var(--r)';
    const badge = s === 'ok' ? '<span class="badge bg">normal</span>' : s === 'warn' ? '<span class="badge bo">baixo</span>' : '<span class="badge br">crítico</span>';
    return `<div class="prod-card">
      <div class="pc-top">
        <div class="pc-info">
          <div class="pc-name">${p.desc}</div>
          <div class="pc-sub">${p.sku ? 'SKU ' + p.sku + ' · ' : ''}<span style="color:var(--g)">${p.addr}</span></div>
        </div>
        ${badge}
      </div>
      <div class="sbar">
        <div class="sbar-bg"><div class="sbar-fill" style="width:${pct}%;background:${barC}"></div></div>
        <div class="sbar-lbl"><span>${p.qtd} un.</span><span>mín ${p.min || '—'}</span></div>
      </div>
    </div>`;
  }).join('');
}

function filtrarProd(q) {
  const r = q ? produtos.filter(p => (p.desc || '').toLowerCase().includes(q.toLowerCase()) || (p.sku || '').includes(q) || (p.addr || '').toLowerCase().includes(q.toLowerCase())) : produtos;
  renderProdutos(r);
}

function populateMovSelect() {
  const sel = document.getElementById('mov-prod');
  sel.innerHTML = '<option value="">Selecione...</option>' + produtos.map((p, i) => `<option value="${i}">${p.desc}</option>`).join('');
}

function onMovProd() {
  const i = document.getElementById('mov-prod').value;
  const card = document.getElementById('mov-addr-card');
  if (i === '') {
    card.style.display = 'none';
    return;
  }
  const p = produtos[i];
  document.getElementById('mov-addr-show').textContent = p.addr;
  card.style.display = 'block';
}

function setMov(t) {
  tipoMov = t;
  document.getElementById('mbtn-in').className = 'mov-btn' + (t === 'entrada' ? ' entrada' : '');
  document.getElementById('mbtn-out').className = 'mov-btn' + (t === 'saida' ? ' saida' : '');
}

async function registrarMov() {
  const i = document.getElementById('mov-prod').value;
  const qtd = parseInt(document.getElementById('mov-qtd').value) || 0;
  const lote = document.getElementById('mov-lote').value.trim();
  if (i === '') {
    toast('Selecione um produto');
    return;
  }
  if (qtd <= 0) {
    toast('Informe a quantidade');
    return;
  }
  const p = produtos[i];
  if (tipoMov === 'saida' && p.qtd < qtd) {
    toast('Estoque insuficiente!');
    return;
  }
  if (tipoMov === 'entrada') p.qtd += qtd;
  else p.qtd -= qtd;
  const now = new Date();
  const hora = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  historico.unshift({ tipo: tipoMov === 'entrada' ? 'in' : 'out', desc: p.desc, addr: p.addr, qtd, hora, lote });
  document.getElementById('mov-prod').value = '';
  document.getElementById('mov-qtd').value = '';
  document.getElementById('mov-lote').value = '';
  document.getElementById('mov-addr-card').style.display = 'none';
  updMetrics();
  toast((tipoMov === 'entrada' ? '+' : '-') + qtd + ' un. registradas');
  
  // Save to both storage options
  saveToLocalStorage();
  await saveDataToFirebase();
}

function initColSelect() {
  const sel = document.getElementById('sel-col');
  sel.innerHTML = '';
  for (let i = 1; i <= N_COLS; i++) {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = colN(i);
    sel.appendChild(o);
  }
}

function renderBaias() {
  const col = parseInt(document.getElementById('sel-col').value);
  let html = '';
  for (let b = 1; b <= N_BAND; b++) {
    for (let p = 1; p <= N_POS; p++) {
      const key = `${col}-${b}-${p}`;
      const item = baias[key];
      const s = item ? (getStatus(item) === 'danger' ? 'warn' : 'ok') : 'empty';
      const name = item ? item.desc.split(' ')[0] : '';
      html += `<div class="bcell ${s}" onclick="showBaiaDet(${col},${b},${p})">
        <div class="bcell-name">${name || '—'}</div>
        <div class="bcell-addr">B${b}·P${p}</div>
      </div>`;
    }
  }
  document.getElementById('baia-grid').innerHTML = html;
  document.getElementById('baia-det').style.display = 'none';
}

function showBaiaDet(col, b, p) {
  const key = `${col}-${b}-${p}`;
  const item = baias[key];
  const addr = `${colN(col)} · B${b} · P${p}`;
  const body = document.getElementById('baia-det-body');
  document.getElementById('baia-det').style.display = 'block';
  if (!item) {
    body.innerHTML = `<div style="font-size:12px;color:var(--m)">Posição <span style="font-family:var(--mono)">${addr}</span> — vazia</div>`;
    return;
  }
  body.innerHTML = `
    <div class="ir"><span class="il">Endereço</span><span class="iv" style="color:var(--g)">${addr}</span></div>
    <div class="ir"><span class="il">Produto</span><span class="iv">${item.desc}</span></div>
    ${item.sku ? `<div class="ir"><span class="il">SKU</span><span class="iv">${item.sku}</span></div>` : ''}
    ${item.ean ? `<div class="ir"><span class="il">Cód. barras</span><span class="iv">${item.ean}</span></div>` : ''}
    <div class="ir"><span class="il">Quantidade</span><span class="iv">${item.qtd} un.</span></div>`;
}

function renderPaletes() {
  let html = '';
  [[1, PP1, 'PP1'], [2, PP2, 'PP2']].forEach(([pp, max, label]) => {
    const store = pp === 1 ? paletes.pp1 : paletes.pp2;
    const ocup = Object.keys(store).length;
    html += `<div class="pal-porta"><div class="pal-phdr"><span><i class="ti ti-building-warehouse" aria-hidden="true" style="font-size:13px;margin-right:4px"></i>${label} — ${max} posições</span><span>${ocup}/${max} ocup.</span></div><div class="pal-pgrid">`;
    for (let i = 1; i <= max; i++) {
      const item = store[i];
      const s = item ? 'ok' : 'empty';
      const name = item ? item.desc.split(' ')[0] : '';
      html += `<div class="pal-cell ${s}" onclick="showPalDet(${pp},${i})"><div style="font-size:7px;font-weight:500;max-width:34px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center">${name || '—'}</div><div style="font-size:7px;opacity:.65">P${String(i).padStart(2, '0')}</div></div>`;
    }
    html += '</div></div>';
  });
  document.getElementById('pal-grid').innerHTML = html;
}

function showPalDet(pp, pos) {
  const store = pp === 1 ? paletes.pp1 : paletes.pp2;
  const item = store[pos];
  const addr = `PP${pp} · P${String(pos).padStart(2, '0')}`;
  document.getElementById('pal-det').style.display = 'block';
  const body = document.getElementById('pal-det-body');
  if (!item) {
    body.innerHTML = `<div style="font-size:12px;color:var(--m)">Palete <span style="font-family:var(--mono)">${addr}</span> — vazio</div>`;
    return;
  }
  body.innerHTML = `
    <div class="ir"><span class="il">Endereço</span><span class="iv" style="color:var(--pu)">${addr}</span></div>
    <div class="ir"><span class="il">Produto</span><span class="iv">${item.desc}</span></div>
    ${item.sku ? `<div class="ir"><span class="il">SKU</span><span class="iv">${item.sku}</span></div>` : ''}
    <div class="ir"><span class="il">Qtd. caixas</span><span class="iv">${item.qtd} cx.</span></div>`;
}

function updManAddr() {
  const r = document.getElementById('man-r').value;
  const b = document.getElementById('man-b').value;
  const p = document.getElementById('man-p').value;
  if (r && b && p) {
    const a = convertAddr(r, 0, b, p);
    document.getElementById('man-addr-preview').textContent = a.label;
  } else {
    document.getElementById('man-addr-preview').textContent = '—';
  }
}

async function addManual() {
  const sku = document.getElementById('man-sku').value.trim();
  const desc = document.getElementById('man-desc').value.trim();
  const ean = document.getElementById('man-ean').value.trim();
  const qtd = parseInt(document.getElementById('man-qtd').value) || 0;
  const min = parseInt(document.getElementById('man-min').value) || 0;
  const r = document.getElementById('man-r').value;
  const b = document.getElementById('man-b').value;
  const p = document.getElementById('man-p').value;
  if (!desc) {
    toast('Informe a descrição do produto');
    return;
  }
  const a = convertAddr(r || 1, 0, b || 1, p || 1);
  const prod = { sku, desc, ean, qtd, min, addr: a.label, col: a.col, band: a.band, baia: a.baia };
  produtos.push(prod);
  const key = `${a.col}-${a.band}-${a.baia}`;
  baias[key] = prod;
  ['man-sku', 'man-desc', 'man-ean', 'man-qtd', 'man-min', 'man-r', 'man-c', 'man-b', 'man-p'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('man-addr-preview').textContent = '—';
  updMetrics();
  populateMovSelect();
  toast('Produto adicionado: ' + desc);
  
  saveToLocalStorage();
  await saveDataToFirebase();
}

async function handleFile(input) {
  const file = input.files[0];
  if (!file) return;
  document.getElementById('imp-status').style.display = 'block';
  document.getElementById('imp-filename').textContent = file.name;
  document.getElementById('imp-fileinfo').textContent = (file.size / 1024).toFixed(0) + ' KB · ' + file.type;
  document.getElementById('imp-manual').style.display = 'none';
  document.getElementById('imp-preview').style.display = 'none';

  const bar = document.getElementById('imp-bar');
  const lbl = document.getElementById('imp-progress-label');

  const progSteps = [
    [20, 'Lendo arquivo...'],
    [45, 'Extraindo texto com IA...'],
    [70, 'Convertendo endereços...'],
    [90, 'Preparando prévia...'],
  ];
  for (const [pct, msg] of progSteps) {
    await new Promise(r => setTimeout(r, 600));
    bar.style.width = pct + '%';
    lbl.textContent = msg;
  }

  let content = '';
  try {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      content = await readPDFWithAI(file);
    } else {
      content = await file.text();
    }
    impRows = parseRelatorio(content);
  } catch (e) {
    impRows = [];
  }

  if (!impRows.length) {
    lbl.textContent = 'Não foi possível extrair automaticamente. Use a entrada manual.';
    bar.style.width = '100%';
    bar.style.background = 'var(--a)';
    document.getElementById('imp-manual').style.display = 'block';
    return;
  }

  bar.style.width = '100%';
  lbl.textContent = 'Concluído — ' + impRows.length + ' produtos encontrados';
  renderImpPreview();
}

async function readPDFWithAI(file) {
  const b64 = await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } },
          {
            type: 'text', text: `Extraia os produtos deste relatório de controle de estoque. Para cada produto retorne APENAS JSON válido com array de objetos no formato:
[{"sku":"","desc":"","ean":"","rua":"","coluna":"","bandeja":"","baia":"","qtd":0}]
Campos de endereço: rua=R, coluna=C, bandeja=B, baia=número após B. Se não encontrar um campo, deixe string vazia. Retorne SOMENTE o JSON, sem texto extra.`
          }
        ]
      }]
    })
  });
  const data = await resp.json();
  const text = data.content.map(c => c.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  return clean;
}

function parseRelatorio(text) {
  try {
    const arr = JSON.parse(text);
    if (Array.isArray(arr)) return arr;
  } catch (e) { }
  const rows = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const parts = line.split(/[;,|\t]+/);
    if (parts.length >= 4) {
      rows.push({
        sku: parts[0]?.trim() || '',
        desc: parts[1]?.trim() || '',
        ean: parts[2]?.trim() || '',
        rua: parts[3]?.trim() || '',
        coluna: parts[4]?.trim() || '',
        bandeja: parts[5]?.trim() || '',
        baia: parts[6]?.trim() || '',
        qtd: parseInt(parts[7]) || 0
      });
    }
  }
  return rows.filter(r => r.desc);
}

function renderImpPreview() {
  document.getElementById('imp-preview').style.display = 'block';
  const tbody = document.getElementById('imp-tbody');
  tbody.innerHTML = impRows.map((r, i) => {
    const a = convertAddr(r.rua || 1, r.coluna || 0, r.bandeja || 1, r.baia || 1);
    const oldAddr = `R${r.rua || '?'}·C${r.coluna || '?'}·B${r.bandeja || '?'}·P${r.baia || '?'}`;
    return `<tr>
      <td><span class="badge bgr">${r.sku || '—'}</span></td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.desc || '—'}</td>
      <td><span style="font-family:var(--mono);font-size:10px;color:var(--m)">${oldAddr}</span></td>
      <td><span style="font-family:var(--mono);font-size:10px;color:var(--g)">${a.label}</span></td>
      <td><span style="font-family:var(--mono)">${r.qtd}</span></td>
      <td><button onclick="removerImpRow(${i})" style="background:none;border:none;cursor:pointer;color:var(--r);font-size:14px"><i class="ti ti-x" aria-hidden="true"></i></button></td>
    </tr>`;
  }).join('');
}

function removerImpRow(i) {
  impRows.splice(i, 1);
  if (!impRows.length) {
    cancelarImp();
    return;
  }
  renderImpPreview();
  document.getElementById('btn-confirmar').textContent = 'Importar ' + impRows.length + ' produtos';
}

async function confirmarImp() {
  let count = 0;
  for (const r of impRows) {
    const a = convertAddr(r.rua || 1, r.coluna || 0, r.bandeja || 1, r.baia || 1);
    const prod = { sku: r.sku, desc: r.desc, ean: r.ean, qtd: parseInt(r.qtd) || 0, min: 0, addr: a.label, col: a.col, band: a.band, baia: a.baia };
    const exists = produtos.find(p => p.sku && p.sku === r.sku);
    if (!exists) {
      produtos.push(prod);
      const key = `${a.col}-${a.band}-${a.baia}`;
      if (!baias[key]) baias[key] = prod;
      count++;
    }
  }
  impRows = [];
  updMetrics();
  populateMovSelect();
  cancelarImp();
  toast(count + ' produtos importados com sucesso!');
  
  saveToLocalStorage();
  await saveDataToFirebase();
}

function cancelarImp() {
  document.getElementById('imp-status').style.display = 'none';
  document.getElementById('imp-preview').style.display = 'none';
  document.getElementById('imp-manual').style.display = 'block';
  impRows = [];
  const bar = document.getElementById('imp-bar');
  bar.style.width = '0%';
  bar.style.background = 'var(--g)';
}

function nav(id, btn) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('on'));
  document.getElementById('pg-' + id).classList.add('on');
  if (btn) btn.classList.add('on');
  if (id === 'produtos') renderProdutos(produtos);
  if (id === 'mov') populateMovSelect();
  if (id === 'baias') {
    initColSelect();
    renderBaias();
  }
  if (id === 'paletes') renderPaletes();
}

let toastT;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('on'), 2800);
}

// Initialize app
async function initApp() {
  // Load from local storage first
  loadFromLocalStorage();
  
  // Try to initialize Firebase
  const firebaseReady = await initializeFirebase();
  
  // Initialize UI
  initColSelect();
  updMetrics();
  populateMovSelect();
}

// Start the app
initApp();
