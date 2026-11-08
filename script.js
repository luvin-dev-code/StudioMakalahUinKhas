const appState = {
  mode: 'manual',
  currentStep: 'step-identitas',
  lastFocusedTextarea: null,
  docGenerated: false,
  splitPreviewOpen: false,
  lastDocId: '',
  lastFileName: '',
  logoTapCount: 0,
  logoTapTimer: null,
  adminPassword: '',
  adminAuthenticated: false,
  adminApiKeys: [],
  penulis: [
    { nama: 'Mahasiswa 1', nim: '231101010001' }
  ],
  rumusan: [
    'Bagaimana kerangka konseptual mengenai topik yang dikaji?',
    'Bagaimana implementasi praktis serta relevansinya di era kontemporer?'
  ],
  tujuan: [
    'Untuk mendeskripsikan kerangka konseptual mengenai topik yang dikaji.',
    'Untuk menganalisis implementasi praktis serta relevansinya di era kontemporer.'
  ],
  pembahasan: [
    {
      judulSub: 'Landasan Konseptual dan Teoretis',
      isiSub: '',
      subPoin: [
        { judulPoin: 'Pengertian dan Ruang Lingkup', isiPoin: '' },
        { judulPoin: 'Tinjauan Pustaka', isiPoin: '' }
      ]
    },
    {
      judulSub: 'Analisis Pembahasan',
      isiSub: '',
      subPoin: [
        { judulPoin: 'Implementasi dan Studi Kasus', isiPoin: '' }
      ]
    }
  ]
};

const prodiListByFakultas = {
  'TARBIYAH DAN ILMU KEGURUAN': [
    'PENDIDIKAN AGAMA ISLAM',
    'PENDIDIKAN BAHASA ARAB',
    'MANAJEMEN PENDIDIKAN ISLAM',
    'PENDIDIKAN GURU MADRASAH IBTIDAIYAH',
    'PENDIDIKAN ISLAM ANAK USIA DINI',
    'TADRIS BAHASA INGGRIS',
    'TADRIS MATEMATIKA',
    'TADRIS BIOLOGI',
    'TADRIS ILMU PENGETAHUAN ALAM',
    'TADRIS ILMU PENGETAHUAN SOSIAL'
  ],
  'SYARIAH': [
    'HUKUM KELUARGA (AHWAL SYAKHSHIYYAH)',
    'HUKUM EKONOMI SYARIAH (MUAMALAH)',
    'HUKUM TATA NEGARA (SIYASAH)',
    'HUKUM PIDANA ISLAM (JINAYAH)'
  ],
  'EKONOMI DAN BISNIS ISLAM': [
    'PERBANKAN SYARIAH',
    'EKONOMI SYARIAH',
    'AKUNTANSI SYARIAH',
    'MANAJEMEN ZAKAT DAN WAKAF'
  ],
  'DAKWAH': [
    'KOMUNIKASI DAN PENYIARAN ISLAM',
    'BIMBINGAN DAN KONSELING ISLAM',
    'MANAJEMEN DAKWAH',
    'PENGEMBANGAN MASYARAKAT ISLAM',
    'PSIKOLOGI ISLAM'
  ],
  'USHULUDDIN, ADAB, DAN HUMANIORA': [
    'ILMU AL-QUR\'AN DAN TAFSIR',
    'ILMU HADIS',
    'AQIDAH DAN FILSAFAT ISLAM',
    'SEJARAH PERADABAN ISLAM',
    'BAHASA DAN SASTRA ARAB'
  ]
};

window.addEventListener('DOMContentLoaded', () => {
  handleFakultasChange();
  renderMembers();
  renderRumusanList();
  renderTujuanList();
  renderBab2List();
  syncOptionalModules();
  updateOutputFileName();
  refreshTocPreview();
  switchStep('step-identitas');
  openIntroModal();

  document.addEventListener('focusin', (e) => {
    if (e.target && e.target.tagName === 'TEXTAREA') {
      appState.lastFocusedTextarea = e.target;
    }
  });
});

document.addEventListener('click', (e) => {
  const popover = document.getElementById('optionsPopover');
  const moreBtn = document.getElementById('dockMoreBtn');
  if (!popover.classList.contains('hidden')) {
    if (!popover.contains(e.target) && !moreBtn.contains(e.target)) {
      popover.classList.add('hidden');
    }
  }
});

function openIntroModal() {
  document.getElementById('introModal').classList.remove('hidden');
}

function closeIntroModal() {
  document.getElementById('introModal').classList.add('hidden');
}

function handleIntroBackdropClick(e) {
  if (e.target.id === 'introModal') {
    closeIntroModal();
  }
}

function openSplitPreview() {
  const wrapper = document.getElementById('workspaceSplitWrapper');
  wrapper.classList.add('split-active');
  document.body.classList.add('split-mode-on');
  appState.splitPreviewOpen = true;
  const lbl = document.getElementById('lblTogglePreview');
  if (lbl) lbl.textContent = 'Tutup Pratinjau';
}

function closeSplitPreview() {
  const wrapper = document.getElementById('workspaceSplitWrapper');
  wrapper.classList.remove('split-active');
  document.body.classList.remove('split-mode-on');
  appState.splitPreviewOpen = false;
  const lbl = document.getElementById('lblTogglePreview');
  if (lbl) lbl.textContent = 'Pratinjau';
}

function toggleSplitPreview() {
  if (!appState.docGenerated) {
    showToast('Buat dokumen makalah terlebih dahulu untuk melihat pratinjau.');
    return;
  }
  if (appState.splitPreviewOpen) {
    closeSplitPreview();
  } else {
    openSplitPreview();
  }
}

function refreshLivePreview() {
  const payload = gatherFormData();
  renderLiveA4Preview(payload);
  showToast('Pratinjau lembar A4 berhasil diperbarui.');
}

function handleLogoSecretTap() {
  appState.logoTapCount++;
  if (appState.logoTapTimer) {
    clearTimeout(appState.logoTapTimer);
  }
  if (appState.logoTapCount >= 7) {
    appState.logoTapCount = 0;
    openAdminModal();
    return;
  }
  appState.logoTapTimer = setTimeout(() => {
    appState.logoTapCount = 0;
  }, 2500);
}

function openAdminModal() {
  const modal = document.getElementById('adminModal');
  const card = document.getElementById('adminModalCard');
  modal.classList.remove('hidden');

  if (appState.adminAuthenticated && appState.adminPassword) {
    card.classList.add('admin-modal-card');
    document.getElementById('adminLoginView').classList.add('hidden');
    document.getElementById('adminDashboardView').classList.remove('hidden');
    document.getElementById('adminSubtitleLabel').textContent = 'Manajemen Konfigurasi AI, Template & File Makalah';
    loadAdminDashboardData(appState.adminPassword);
  } else {
    card.classList.remove('admin-modal-card');
    document.getElementById('adminLoginView').classList.remove('hidden');
    document.getElementById('adminDashboardView').classList.add('hidden');
    document.getElementById('adminSubtitleLabel').textContent = 'Otentikasi Keamanan Administrator';
    const pwInput = document.getElementById('inpAdminPassword');
    pwInput.value = '';
    setTimeout(() => pwInput.focus(), 100);
  }
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.add('hidden');
}

function handleAdminBackdropClick(e) {
  if (e.target.id === 'adminModal') {
    closeAdminModal();
  }
}

async function submitAdminLogin() {
  const pw = document.getElementById('inpAdminPassword').value.trim();
  if (pw !== '010506') {
    showToast('Password Admin salah!');
    return;
  }
  const btn = document.getElementById('btnAdminLogin');
  btn.disabled = true;
  btn.textContent = 'Memuat Data Admin...';

  try {
    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal login.');

    btn.disabled = false;
    btn.textContent = 'Masuk ke Admin Panel';
    appState.adminPassword = pw;
    appState.adminAuthenticated = true;

    const card = document.getElementById('adminModalCard');
    card.classList.add('admin-modal-card');
    document.getElementById('adminLoginView').classList.add('hidden');
    document.getElementById('adminDashboardView').classList.remove('hidden');
    document.getElementById('adminSubtitleLabel').textContent = 'Manajemen Konfigurasi AI, Template & File Makalah';

    populateAdminConfigUI(data.config);
    renderAdminFilesTable(data.files || []);
    showToast('Selamat datang di Admin Panel.');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Masuk ke Admin Panel';
    alert('Gagal membuka Admin Panel: ' + err.message);
  }
}

async function loadAdminDashboardData(pw) {
  try {
    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal memuat data.');
    populateAdminConfigUI(data.config);
    renderAdminFilesTable(data.files || []);
  } catch (err) {
    showToast('Gagal memuat data admin: ' + err.message);
  }
}

function maskApiKeyDisplay(key, idx) {
  const clean = String(key || '').trim();
  if (clean.length <= 12) return 'Key #' + (idx + 1) + ' (' + clean + ')';
  return 'Key #' + (idx + 1) + ' — ' + clean.substring(0, 8) + '...' + clean.substring(clean.length - 6);
}

function populateAdminConfigUI(config) {
  if (!config) return;
  appState.adminApiKeys = Array.isArray(config.apiKeys) ? config.apiKeys : [];

  const selKey = document.getElementById('selAdminApiKey');
  selKey.innerHTML = '';
  appState.adminApiKeys.forEach((k, idx) => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = maskApiKeyDisplay(k, idx);
    if (k === config.activeApiKey) {
      opt.selected = true;
    }
    selKey.appendChild(opt);
  });

  const selModel = document.getElementById('selAdminGeminiModel');
  if (config.activeModel) {
    selModel.value = config.activeModel;
    if (!selModel.value) {
      selModel.selectedIndex = 0;
    }
  }

  const inpTpl = document.getElementById('inpAdminTemplateId');
  if (config.templateDocId) {
    inpTpl.value = config.templateDocId;
  }
}

async function handleAddApiKey() {
  const inp = document.getElementById('inpNewApiKey');
  const newKey = inp.value.trim();
  if (!newKey) {
    showToast('Masukkan API Key Gemini terlebih dahulu.');
    return;
  }
  try {
    const res = await fetch('/api/admin/apikey/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: appState.adminPassword, newKey })
    });
    const updatedConfig = await res.json();
    if (!res.ok) throw new Error(updatedConfig.error || 'Gagal menambah API Key.');
    inp.value = '';
    populateAdminConfigUI(updatedConfig);
    showToast('API Key baru berhasil ditambahkan dan diaktifkan.');
  } catch (err) {
    alert(err.message);
  }
}

async function handleRemoveSelectedApiKey() {
  const selKey = document.getElementById('selAdminApiKey');
  const targetKey = selKey.value;
  if (!targetKey) return;
  if (appState.adminApiKeys.length <= 1) {
    showToast('Minimal harus ada 1 API Key yang tersimpan.');
    return;
  }
  try {
    const res = await fetch('/api/admin/apikey/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: appState.adminPassword, targetKey })
    });
    const updatedConfig = await res.json();
    if (!res.ok) throw new Error(updatedConfig.error || 'Gagal menghapus API Key.');
    populateAdminConfigUI(updatedConfig);
    showToast('API Key berhasil dihapus dari daftar.');
  } catch (err) {
    alert(err.message);
  }
}

async function saveAdminSettings() {
  const activeApiKey = document.getElementById('selAdminApiKey').value;
  const activeModel = document.getElementById('selAdminGeminiModel').value;
  const templateDocId = document.getElementById('inpAdminTemplateId').value.trim();

  if (!templateDocId) {
    showToast('Template ID tidak boleh kosong.');
    return;
  }

  const btn = document.getElementById('btnSaveAdminConfig');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  try {
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: appState.adminPassword,
        newConfig: {
          apiKeys: appState.adminApiKeys,
          activeApiKey: activeApiKey,
          activeModel: activeModel,
          templateDocId: templateDocId
        }
      })
    });
    const updatedConfig = await res.json();
    btn.disabled = false;
    btn.textContent = 'Simpan Konfigurasi Admin';
    if (!res.ok) throw new Error(updatedConfig.error || 'Gagal menyimpan konfigurasi.');
    populateAdminConfigUI(updatedConfig);
    showToast('Konfigurasi Admin berhasil disimpan!');
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Simpan Konfigurasi Admin';
    alert('Gagal menyimpan konfigurasi: ' + err.message);
  }
}

function refreshAdminFilesList() {
  const tbody = document.getElementById('adminFilesTableBody');
  tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94A3B8;">Memuat ulang daftar file makalah...</td></tr>';
  loadAdminDashboardData(appState.adminPassword);
}

function formatAdminDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderAdminFilesTable(files) {
  const tbody = document.getElementById('adminFilesTableBody');
  if (!Array.isArray(files) || files.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94A3B8;">Belum ada file makalah yang tersimpan.</td></tr>';
    return;
  }

  tbody.innerHTML = files.map(f => `
    <tr>
      <td>
        <div style="font-weight:600; color:#0F172A;">${escapeHtml(f.fileName || 'Tanpa Judul')}</div>
        <div style="font-family:var(--font-mono); font-size:11px; color:#64748B;">ID: ${escapeHtml(f.docId)}</div>
      </td>
      <td style="white-space:nowrap; color:#475569;">${escapeHtml(formatAdminDate(f.createdAt))}</td>
      <td>
        <div class="admin-file-actions">
          <button type="button" class="btn-link-sm" onclick="openDownloadModal()">Unduh</button>
          <button type="button" class="btn-danger-sm" onclick="handleDeleteMakalahFile('${escapeAttr(f.docId)}', '${escapeAttr(f.fileName)}')">Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function handleDeleteMakalahFile(docId, fileName) {
  if (!confirm('Hapus file makalah "' + fileName + '" secara permanen dari daftar?')) {
    return;
  }
  showToast('Menghapus file ' + fileName + '...');
  try {
    const res = await fetch('/api/admin/files/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: appState.adminPassword, docId })
    });
    const updatedFiles = await res.json();
    if (!res.ok) throw new Error(updatedFiles.error || 'Gagal menghapus file.');
    renderAdminFilesTable(updatedFiles || []);
    if (appState.lastDocId === docId) {
      closeSplitPreview();
      appState.docGenerated = false;
      appState.lastDocId = '';
      document.getElementById('floatingActionBar').classList.add('hidden');
    }
    showToast('File "' + fileName + '" berhasil dihapus.');
  } catch (err) {
    alert('Gagal menghapus file: ' + err.message);
  }
}

function setEditorMode(mode) {
  appState.mode = mode;
  document.getElementById('dockManualBtn').classList.toggle('active', mode === 'manual');
  document.getElementById('dockAiBtn').classList.toggle('active', mode === 'ai');
  document.getElementById('aiAssistantBanner').classList.toggle('hidden', mode !== 'ai');
}

function switchStep(stepId) {
  appState.currentStep = stepId;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  const targetPanel = document.getElementById(stepId);
  if (targetPanel) targetPanel.classList.add('active');

  document.querySelectorAll('.step-circle').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-step') === stepId);
  });

  if (stepId === 'step-daftarisi') {
    refreshTocPreview();
  }
}

function handleFakultasChange() {
  const fak = document.getElementById('selFakultas').value;
  const selProdi = document.getElementById('selProdi');
  const prodiOptions = prodiListByFakultas[fak] || [];
  selProdi.innerHTML = '';
  prodiOptions.forEach(prodi => {
    const opt = document.createElement('option');
    opt.value = prodi;
    opt.textContent = prodi;
    selProdi.appendChild(opt);
  });
}

function toggleOptionsPopover() {
  const popover = document.getElementById('optionsPopover');
  popover.classList.toggle('hidden');
}

function syncOptionalModules() {
  const useTujuan = document.getElementById('chkTujuan').checked;
  const useSaran = document.getElementById('chkSaran').checked;
  document.getElementById('boxTujuan').classList.toggle('hidden', !useTujuan);
  document.getElementById('boxSaran').classList.toggle('hidden', !useSaran);
  refreshTocPreview();
}

function updateOutputFileName() {
  const kelompok = document.getElementById('inpKelompok').value.trim() || 'Kelompok';
  const mk = document.getElementById('inpMataKuliah').value.trim() || 'Mata Kuliah';
  const fileName = (kelompok + ' ' + mk).trim();
  document.getElementById('lblFileName').textContent = fileName;
}

function updateStatusBanner(msg, statusType) {
  const pill = document.getElementById('statusPill');
  pill.textContent = msg;
  pill.className = 'status-pill';
  if (statusType) pill.classList.add(statusType);
}

function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

function getTargetTextarea() {
  const activePanel = document.getElementById(appState.currentStep);
  if (appState.lastFocusedTextarea && activePanel && activePanel.contains(appState.lastFocusedTextarea)) {
    return appState.lastFocusedTextarea;
  }
  if (activePanel) {
    const firstTa = activePanel.querySelector('textarea');
    if (firstTa) return firstTa;
  }
  return null;
}

function focusActivePanelInput() {
  const activePanel = document.getElementById(appState.currentStep);
  if (!activePanel) return;
  const field = activePanel.querySelector('textarea, input[type="text"]');
  if (field) {
    field.focus();
    showToast('Kursor diarahkan ke kolom input aktif.');
  }
}

function insertTemplateParagraph() {
  const ta = getTargetTextarea();
  if (!ta) {
    showToast('Buka bagian yang memiliki kolom paragraf terlebih dahulu.');
    return;
  }
  const snippet = (ta.value.trim() ? '\n' : '') + 'Berdasarkan tinjauan literatur tersebut, dapat dipahami bahwa ';
  insertAtElement(ta, snippet);
  showToast('Paragraf baru ditambahkan.');
}

function insertActiveFootnote() {
  const ta = getTargetTextarea();
  if (!ta) {
    showToast('Pilih atau buka kolom teks pembahasan/latar belakang terlebih dahulu.');
    return;
  }
  const snippet = '^[Nama Depan Nama Belakang, Judul Buku (Kota: Penerbit, 2024), 25.]';
  insertAtElement(ta, snippet);
  showToast('Tag Native Footnote CMOS 17th disisipkan.');
}

function insertActiveBlockquote() {
  const ta = getTargetTextarea();
  if (!ta) {
    showToast('Pilih atau buka kolom teks pembahasan/latar belakang terlebih dahulu.');
    return;
  }
  const snippet = (ta.value.trim() ? '\n' : '') + '[BLOCKQUOTE] ';
  insertAtElement(ta, snippet);
  showToast('Penanda kutipan panjang (>= 5 baris) disisipkan.');
}

function scrollToBottomGenerate() {
  const bar = document.getElementById('bottomGenerateBar');
  if (bar) {
    bar.scrollIntoView({ behavior: 'smooth' });
  }
}

function insertAtElement(el, snippet) {
  const start = el.selectionStart || el.value.length;
  const end = el.selectionEnd || el.value.length;
  el.value = el.value.substring(0, start) + snippet + el.value.substring(end);
  el.dispatchEvent(new Event('input'));
  el.focus();
}

function insertFormatting(textareaId, snippet) {
  const el = document.getElementById(textareaId);
  if (!el) return;
  insertAtElement(el, snippet);
}

function insertBibliographySample(type) {
  const ta = document.getElementById('txtDaftarPustaka');
  if (!ta) return;
  let sample = '';
  if (type === 'book') {
    sample = 'Siddiq, Achmad. "Karakteristik Pendidikan Pesantren." Dalam Pemikiran Pendidikan Islam, 45-68. Jember: IAIN Jember Press, 2018.';
  } else {
    sample = 'Mustofa, Bisri. "Transformasi Hukum Islam di Indonesia." Jurnal Hukum Islam Nusantara 14, no. 2 (2023): 110-128.';
  }
  ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + sample;
  ta.focus();
}

function toRomanClient(num) {
  const map = [
    { val: 10, sym: 'x' },
    { val: 9, sym: 'ix' },
    { val: 5, sym: 'v' },
    { val: 4, sym: 'iv' },
    { val: 1, sym: 'i' }
  ];
  let res = '';
  let n = Math.max(1, Math.floor(num));
  for (let i = 0; i < map.length; i++) {
    while (n >= map[i].val) {
      res += map[i].sym;
      n -= map[i].val;
    }
  }
  return res;
}

function refreshTocPreview() {
  const wrap = document.getElementById('tocLivePreview');
  if (!wrap) return;

  const useTujuan = document.getElementById('chkTujuan').checked;
  const useSaran = document.getElementById('chkSaran').checked;
  const rows = [];

  rows.push({ title: 'KATA PENGANTAR', page: toRomanClient(1), level: 1 });
  rows.push({ title: 'DAFTAR ISI', page: toRomanClient(2), level: 1 });

  let pageCounter = 1;
  rows.push({ title: 'BAB I PENDAHULUAN', page: String(pageCounter), level: 1 });
  rows.push({ title: 'A. Latar Belakang', page: String(pageCounter), level: 2 });
  rows.push({ title: 'B. Rumusan Masalah', page: String(pageCounter + 1), level: 2 });
  if (useTujuan) rows.push({ title: 'C. Tujuan Penulisan', page: String(pageCounter + 1), level: 2 });

  pageCounter = 3;
  rows.push({ title: 'BAB II PEMBAHASAN', page: String(pageCounter), level: 1 });
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  appState.pembahasan.forEach((sub, sIdx) => {
    const letter = letters[sIdx] || (sIdx + 1);
    rows.push({ title: letter + '. ' + (sub.judulSub || 'Sub-bab'), page: String(pageCounter), level: 2 });
    (sub.subPoin || []).forEach((pt, pIdx) => {
      rows.push({ title: (pIdx + 1) + '. ' + (pt.judulPoin || 'Anak Sub-bab'), page: String(pageCounter), level: 3 });
      pageCounter++;
    });
  });

  rows.push({ title: 'BAB III PENUTUP', page: String(pageCounter), level: 1 });
  rows.push({ title: 'A. Kesimpulan', page: String(pageCounter), level: 2 });
  if (useSaran) rows.push({ title: 'B. Saran', page: String(pageCounter), level: 2 });
  rows.push({ title: 'DAFTAR PUSTAKA', page: String(pageCounter + 1), level: 1 });

  wrap.innerHTML = rows.map(r => `
    <div class="toc-row lvl-${r.level}">
      <div class="toc-col-left">
        <span class="toc-title">${escapeHtml(r.title)}</span>
        <span class="toc-leader"></span>
      </div>
      <div class="toc-col-right">${escapeHtml(r.page)}</div>
    </div>
  `).join('');
}

function showCenterLoading(title, subtitle) {
  document.getElementById('loadingTitle').textContent = title || 'Memproses Dokumen...';
  document.getElementById('loadingSubtitle').textContent = subtitle || 'Mohon tunggu sebentar.';
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideCenterLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function showSuccessOverlay(fileName) {
  document.getElementById('successFileNameLabel').textContent = fileName;
  document.getElementById('successOverlay').classList.remove('hidden');
}

function closeSuccessOverlay() {
  document.getElementById('successOverlay').classList.add('hidden');
}

function openDownloadModal() {
  document.getElementById('downloadModal').classList.remove('hidden');
}

function closeDownloadModal() {
  document.getElementById('downloadModal').classList.add('hidden');
}

function handleDownloadBackdropClick(e) {
  if (e.target.id === 'downloadModal') {
    closeDownloadModal();
  }
}

function renderMembers() {
  const wrap = document.getElementById('membersList');
  wrap.innerHTML = '';
  appState.penulis.forEach((m, idx) => {
    const div = document.createElement('div');
    div.className = 'dyn-row';
    div.innerHTML = `
      <span class="row-badge">${idx + 1}</span>
      <input type="text" class="form-input input-nama" placeholder="Nama Lengkap" value="${escapeAttr(m.nama)}" oninput="editMember(${idx}, 'nama', this.value)">
      <input type="text" class="form-input input-nim" placeholder="NIM Mahasiswa" value="${escapeAttr(m.nim)}" oninput="editMember(${idx}, 'nim', this.value)">
      <button type="button" class="btn-remove" onclick="deleteMember(${idx})">Hapus</button>
    `;
    wrap.appendChild(div);
  });
}

function addMember() {
  appState.penulis.push({ nama: '', nim: '' });
  renderMembers();
}

function editMember(idx, field, val) {
  appState.penulis[idx][field] = val;
}

function deleteMember(idx) {
  if (appState.penulis.length <= 1) return;
  appState.penulis.splice(idx, 1);
  renderMembers();
}

function renderRumusanList() {
  const wrap = document.getElementById('rumusanList');
  wrap.innerHTML = '';
  appState.rumusan.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'dyn-row';
    div.innerHTML = `
      <span class="row-badge">${idx + 1}.</span>
      <input type="text" class="form-input input-nama" value="${escapeAttr(item)}" oninput="editRumusan(${idx}, this.value)">
      <button type="button" class="btn-remove" onclick="deleteRumusan(${idx})">Hapus</button>
    `;
    wrap.appendChild(div);
  });
}

function addRumusan() {
  appState.rumusan.push('');
  renderRumusanList();
}

function editRumusan(idx, val) {
  appState.rumusan[idx] = val;
}

function deleteRumusan(idx) {
  if (appState.rumusan.length <= 1) return;
  appState.rumusan.splice(idx, 1);
  renderRumusanList();
}

function renderTujuanList() {
  const wrap = document.getElementById('tujuanList');
  wrap.innerHTML = '';
  appState.tujuan.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'dyn-row';
    div.innerHTML = `
      <span class="row-badge">${idx + 1}.</span>
      <input type="text" class="form-input input-nama" value="${escapeAttr(item)}" oninput="editTujuan(${idx}, this.value)">
      <button type="button" class="btn-remove" onclick="deleteTujuan(${idx})">Hapus</button>
    `;
    wrap.appendChild(div);
  });
}

function addTujuan() {
  appState.tujuan.push('');
  renderTujuanList();
}

function editTujuan(idx, val) {
  appState.tujuan[idx] = val;
}

function deleteTujuan(idx) {
  if (appState.tujuan.length <= 1) return;
  appState.tujuan.splice(idx, 1);
  renderTujuanList();
}

function renderBab2List() {
  const wrap = document.getElementById('bab2List');
  wrap.innerHTML = '';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  appState.pembahasan.forEach((sub, sIdx) => {
    const letter = letters[sIdx] || (sIdx + 1);
    const card = document.createElement('div');
    card.className = 'bab2-subcard';

    let pointsHtml = '';
    (sub.subPoin || []).forEach((pt, pIdx) => {
      pointsHtml += `
        <div class="point-box">
          <div class="subcard-top">
            <span class="row-badge">${pIdx + 1}.</span>
            <input type="text" class="form-input" placeholder="Judul anak sub-bab" value="${escapeAttr(pt.judulPoin)}" oninput="editBab2PointTitle(${sIdx}, ${pIdx}, this.value)">
            <button type="button" class="btn-remove" onclick="deleteBab2Point(${sIdx}, ${pIdx})">Hapus</button>
          </div>
          <textarea class="form-textarea" rows="4" placeholder="Uraian pembahasan mendalam beserta catatan kaki di akhir kalimat ^[Nama Penulis, Judul Buku (Kota: Penerbit, Tahun), 25.]..." oninput="editBab2PointBody(${sIdx}, ${pIdx}, this.value)">${escapeHtml(pt.isiPoin)}</textarea>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="subcard-top">
        <span class="row-badge">${letter}.</span>
        <input type="text" class="form-input" placeholder="Judul sub-bab" value="${escapeAttr(sub.judulSub)}" oninput="editBab2SubTitle(${sIdx}, this.value)">
        <button type="button" class="btn-outline-sm" onclick="addBab2Point(${sIdx})">+ Anak Sub-bab</button>
        <button type="button" class="btn-remove" onclick="deleteBab2Sub(${sIdx})">Hapus Sub-bab</button>
      </div>
      <textarea class="form-textarea" rows="3" placeholder="Paragraf pengantar sub-bab (opsional)..." oninput="editBab2SubBody(${sIdx}, this.value)">${escapeHtml(sub.isiSub)}</textarea>
      <div class="children-points">${pointsHtml}</div>
    `;
    wrap.appendChild(card);
  });
  refreshTocPreview();
}

function addBab2Sub() {
  appState.pembahasan.push({
    judulSub: '',
    isiSub: '',
    subPoin: [{ judulPoin: '', isiPoin: '' }]
  });
  renderBab2List();
}

function deleteBab2Sub(sIdx) {
  if (appState.pembahasan.length <= 1) return;
  appState.pembahasan.splice(sIdx, 1);
  renderBab2List();
}

function editBab2SubTitle(sIdx, val) {
  appState.pembahasan[sIdx].judulSub = val;
  refreshTocPreview();
}

function editBab2SubBody(sIdx, val) {
  appState.pembahasan[sIdx].isiSub = val;
}

function addBab2Point(sIdx) {
  appState.pembahasan[sIdx].subPoin.push({ judulPoin: '', isiPoin: '' });
  renderBab2List();
}

function deleteBab2Point(sIdx, pIdx) {
  appState.pembahasan[sIdx].subPoin.splice(pIdx, 1);
  renderBab2List();
}

function editBab2PointTitle(sIdx, pIdx, val) {
  appState.pembahasan[sIdx].subPoin[pIdx].judulPoin = val;
  refreshTocPreview();
}

function editBab2PointBody(sIdx, pIdx, val) {
  appState.pembahasan[sIdx].subPoin[pIdx].isiPoin = val;
}

function gatherFormData() {
  const rawBib = document.getElementById('txtDaftarPustaka').value;
  return {
    judul: document.getElementById('inpJudul').value.trim(),
    kelompok: document.getElementById('inpKelompok').value.trim(),
    mataKuliah: document.getElementById('inpMataKuliah').value.trim(),
    dosen: document.getElementById('inpDosen').value.trim(),
    fakultas: document.getElementById('selFakultas').value.trim().toUpperCase(),
    prodi: document.getElementById('selProdi').value.trim().toUpperCase(),
    kota: document.getElementById('inpKota').value.trim().toUpperCase(),
    bulanTahun: document.getElementById('inpBulanTahun').value.trim().toUpperCase(),
    penulis: appState.penulis,
    useKataPengantar: true,
    useTujuan: document.getElementById('chkTujuan').checked,
    useSaran: document.getElementById('chkSaran').checked,
    kataPengantar: document.getElementById('txtKataPengantar').value,
    latarBelakang: document.getElementById('txtLatarBelakang').value,
    rumusanMasalah: appState.rumusan,
    tujuanPenulisan: appState.tujuan,
    pembahasan: appState.pembahasan,
    kesimpulan: document.getElementById('txtKesimpulan').value,
    saran: document.getElementById('txtSaran').value,
    daftarPustaka: rawBib.split('\n').map(b => b.trim()).filter(b => b !== '')
  };
}

async function runSmartAssistant() {
  const judul = document.getElementById('inpJudul').value.trim();
  const mataKuliah = document.getElementById('inpMataKuliah').value.trim();

  if (!judul) {
    updateStatusBanner('Judul makalah wajib diisi', 'err');
    alert('Silakan isi Judul Makalah pada Bagian 01 terlebih dahulu.');
    switchStep('step-identitas');
    return;
  }

  const btn = document.getElementById('btnRunAi');
  btn.disabled = true;
  updateStatusBanner('Menyusun draf akademik...', 'warn');
  showCenterLoading('Menyusun Draf AI...', 'Asisten AI sedang menyusun latar belakang, pembahasan, Native Footnote CMOS 17th (halaman spesifik), dan daftar pustaka (rentang halaman).');

  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judul: judul,
        mataKuliah: mataKuliah,
        useTujuan: document.getElementById('chkTujuan').checked,
        useSaran: document.getElementById('chkSaran').checked
      })
    });
    const data = await res.json();
    hideCenterLoading();
    btn.disabled = false;
    if (!res.ok) throw new Error(data.error || 'Gagal menghasilkan konten AI.');

    if (data.kataPengantar) document.getElementById('txtKataPengantar').value = data.kataPengantar;
    if (data.latarBelakang) document.getElementById('txtLatarBelakang').value = data.latarBelakang;
    if (Array.isArray(data.rumusanMasalah) && data.rumusanMasalah.length > 0) {
      appState.rumusan = data.rumusanMasalah;
      renderRumusanList();
    }
    if (Array.isArray(data.tujuanPenulisan) && data.tujuanPenulisan.length > 0) {
      appState.tujuan = data.tujuanPenulisan;
      renderTujuanList();
    }
    if (Array.isArray(data.pembahasan) && data.pembahasan.length > 0) {
      appState.pembahasan = data.pembahasan;
      renderBab2List();
    }
    if (data.kesimpulan) document.getElementById('txtKesimpulan').value = data.kesimpulan;
    if (data.saran) document.getElementById('txtSaran').value = data.saran;
    if (Array.isArray(data.daftarPustaka)) {
      document.getElementById('txtDaftarPustaka').value = data.daftarPustaka.join('\n');
    }

    refreshTocPreview();
    updateStatusBanner('Draf AI berhasil dibuat', 'ok');
    setEditorMode('manual');
    showToast('Draf makalah AI berhasil dimuat ke seluruh bagian.');
  } catch (err) {
    hideCenterLoading();
    btn.disabled = false;
    updateStatusBanner('Gagal membuat draf AI', 'err');
    alert(err.message);
  }
}

async function generateDocument() {
  const payload = gatherFormData();
  if (!payload.judul) {
    updateStatusBanner('Judul makalah belum diisi', 'err');
    alert('Silakan lengkapi Judul Makalah sebelum membuat dokumen.');
    switchStep('step-identitas');
    return;
  }

  const btn = document.getElementById('btnBuildDoc');
  btn.disabled = true;
  updateStatusBanner('Memproses dokumen...', 'warn');
  showCenterLoading('Memproses Dokumen Makalah...', 'Menyusun naskah akademik berstandar UIN KHAS Jember, tabel Daftar Isi, dan catatan kaki.');

  try {
    const res = await fetch('/api/makalah/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    hideCenterLoading();
    btn.disabled = false;
    if (!res.ok) throw new Error(data.error || 'Gagal membuat dokumen.');

    appState.docGenerated = true;
    appState.lastDocId = data.docId;
    appState.lastFileName = data.fileName;
    updateStatusBanner('Dokumen siap: ' + data.fileName, 'ok');

    document.getElementById('previewModalTitle').textContent = data.fileName;
    document.getElementById('modalFileNameLabel').textContent = data.fileName;

    renderLiveA4Preview(payload);
    document.getElementById('floatingActionBar').classList.remove('hidden');
    openSplitPreview();
    showSuccessOverlay(data.fileName);
  } catch (err) {
    hideCenterLoading();
    btn.disabled = false;
    updateStatusBanner('Gagal membuat dokumen', 'err');
    alert(err.message);
  }
}

function isArabicText(text) {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(text);
}

function parseTextWithFootnotes(rawText, fnGlobalList) {
  let isBlockquote = false;
  let cleanLine = rawText;
  if (cleanLine.startsWith('[BLOCKQUOTE]')) {
    isBlockquote = true;
    cleanLine = cleanLine.replace('[BLOCKQUOTE]', '').trim();
  }
  const isArabic = isArabicText(cleanLine);
  const segments = cleanLine.split(/(\^\[[^\]]+\])/g);
  let html = '';
  segments.forEach(seg => {
    if (!seg) return;
    if (seg.startsWith('^[') && seg.endsWith(']')) {
      const fnText = seg.slice(2, -1).trim();
      fnGlobalList.push(fnText);
      const fnNum = fnGlobalList.length;
      html += `<sup class="a4-footnote-ref">[${fnNum}]</sup>`;
    } else {
      html += escapeHtml(seg);
    }
  });

  if (isArabic) {
    return `<p class="a4-p-arabic">${html}</p>`;
  }
  if (isBlockquote) {
    return `<div class="a4-blockquote">${html}</div>`;
  }
  return `<p class="a4-p">${html}</p>`;
}

function renderLiveA4Preview(data) {
  const container = document.getElementById('academicPaperPreview');
  if (!container) return;
  container.innerHTML = '';

  const fnList = [];
  const pages = [];

  const authorsHtml = (data.penulis || []).map((p, idx) => `
    <div><strong>${escapeHtml(p.nama || 'Nama Mahasiswa')}</strong> (NIM: ${escapeHtml(p.nim || '-')})</div>
  `).join('');

  const coverHtml = `
    <div class="a4-page">
      <div class="a4-header"></div>
      <div class="a4-body a4-cover-wrap">
        <div>
          <div class="a4-cover-title">${escapeHtml(data.judul || 'JUDUL MAKALAH AKADEMIK')}</div>
          <div class="a4-cover-label">MAKALAH</div>
        </div>
        <div>
          <img src="https://lh3.googleusercontent.com/d/1abt15uTvX-593w_xSlrRm6IGEsf7Iqnc" alt="Logo UIN KHAS" class="a4-cover-logo" onerror="this.style.display='none'">
        </div>
        <div>
          <div class="a4-cover-meta">
            <div>Diajukan untuk Memenuhi Tugas Mata Kuliah:</div>
            <div><strong>${escapeHtml(data.mataKuliah || 'Mata Kuliah')}</strong></div>
            <div style="margin-top:6px;">Dosen Pengampu:</div>
            <div><strong>${escapeHtml(data.dosen || 'Nama Dosen Pengampu')}</strong></div>
          </div>
          <div class="a4-cover-authors">
            <div style="margin-bottom:4px;">Disusun Oleh: <strong>${escapeHtml(data.kelompok || 'Kelompok')}</strong></div>
            ${authorsHtml}
          </div>
        </div>
        <div class="a4-cover-bottom">
          <div>PROGRAM STUDI ${escapeHtml(data.prodi || 'PROGRAM STUDI')}</div>
          <div>FAKULTAS ${escapeHtml(data.fakultas || 'FAKULTAS')}</div>
          <div>UNIVERSITAS ISLAM NEGERI KIAI HAJI ACHMAD SIDDIQ JEMBER</div>
          <div>${escapeHtml(data.bulanTahun || '2026')}</div>
        </div>
      </div>
      <div class="a4-footer"></div>
    </div>
  `;
  pages.push(coverHtml);

  const pengantarLines = (data.kataPengantar || '').split('\n').map(l => l.trim()).filter(l => l !== '');
  const pengantarBody = pengantarLines.map(l => parseTextWithFootnotes(l, fnList)).join('');
  const pengantarHtml = `
    <div class="a4-page">
      <div class="a4-header"></div>
      <div class="a4-body">
        <div class="a4-heading-1">KATA PENGANTAR</div>
        ${pengantarBody}
      </div>
      <div class="a4-footer">i</div>
    </div>
  `;
  pages.push(pengantarHtml);

  const tocRows = [];
  tocRows.push({ title: 'KATA PENGANTAR', page: 'i', bold: true, indent: 0 });
  tocRows.push({ title: 'DAFTAR ISI', page: 'ii', bold: true, indent: 0 });
  tocRows.push({ title: 'BAB I PENDAHULUAN', page: '1', bold: true, indent: 0 });
  tocRows.push({ title: 'A. Latar Belakang', page: '1', bold: false, indent: 18 });
  tocRows.push({ title: 'B. Rumusan Masalah', page: '2', bold: false, indent: 18 });
  if (data.useTujuan) {
    tocRows.push({ title: 'C. Tujuan Penulisan', page: '2', bold: false, indent: 18 });
  }
  tocRows.push({ title: 'BAB II PEMBAHASAN', page: '3', bold: true, indent: 0 });
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  (data.pembahasan || []).forEach((sub, sIdx) => {
    const letter = letters[sIdx] || String(sIdx + 1);
    tocRows.push({ title: `${letter}. ${sub.judulSub || 'Sub-bab'}`, page: '3', bold: false, indent: 18 });
    (sub.subPoin || []).forEach((pt, pIdx) => {
      tocRows.push({ title: `${pIdx + 1}. ${pt.judulPoin || 'Anak Sub-bab'}`, page: '4', bold: false, indent: 36 });
    });
  });
  tocRows.push({ title: 'BAB III PENUTUP', page: '5', bold: true, indent: 0 });
  tocRows.push({ title: 'A. Kesimpulan', page: '5', bold: false, indent: 18 });
  if (data.useSaran) {
    tocRows.push({ title: 'B. Saran', page: '5', bold: false, indent: 18 });
  }
  tocRows.push({ title: 'DAFTAR PUSTAKA', page: '6', bold: true, indent: 0 });

  const tocTableRowsHtml = tocRows.map(r => `
    <tr>
      <td style="padding-left:${r.indent}px; font-weight:${r.bold ? '700' : '400'};">
        <div style="display:flex; align-items:baseline;">
          <span>${escapeHtml(r.title)}</span>
          <span style="flex:1; border-bottom:1px dotted #000; margin:0 6px;"></span>
        </div>
      </td>
      <td style="width:36px; text-align:right; font-weight:${r.bold ? '700' : '400'};">${r.page}</td>
    </tr>
  `).join('');

  const tocHtml = `
    <div class="a4-page">
      <div class="a4-header"></div>
      <div class="a4-body">
        <div class="a4-heading-1">DAFTAR ISI</div>
        <table class="a4-toc-table">
          ${tocTableRowsHtml}
        </table>
      </div>
      <div class="a4-footer">ii</div>
    </div>
  `;
  pages.push(tocHtml);

  const bab1FnList = [];
  const latarLines = (data.latarBelakang || '').split('\n').map(l => l.trim()).filter(l => l !== '');
  const latarBody = latarLines.map(l => parseTextWithFootnotes(l, bab1FnList)).join('');

  const rumusanListHtml = (data.rumusanMasalah || []).map((r, idx) => `
    <div class="a4-p" style="text-indent:0; padding-left:1.27cm;">${idx + 1}. ${escapeHtml(r)}</div>
  `).join('');

  let tujuanHtml = '';
  if (data.useTujuan && data.tujuanPenulisan && data.tujuanPenulisan.length > 0) {
    const tujuanList = data.tujuanPenulisan.map((t, idx) => `
      <div class="a4-p" style="text-indent:0; padding-left:1.27cm;">${idx + 1}. ${escapeHtml(t)}</div>
    `).join('');
    tujuanHtml = `
      <div class="a4-heading-2">C. Tujuan Penulisan</div>
      ${tujuanList}
    `;
  }

  const bab1FnItemsHtml = bab1FnList.map((fn, idx) => `
    <div class="a4-footnote-item"><sup>[${idx + 1}]</sup> ${escapeHtml(fn)}</div>
  `).join('');

  const bab1Html = `
    <div class="a4-page">
      <div class="a4-header"></div>
      <div class="a4-body">
        <div class="a4-heading-1">BAB I<br>PENDAHULUAN</div>
        <div class="a4-heading-2">A. Latar Belakang</div>
        ${latarBody}
        <div class="a4-heading-2">B. Rumusan Masalah</div>
        ${rumusanListHtml}
        ${tujuanHtml}
        ${bab1FnList.length > 0 ? `
          <div class="a4-footnote-container">
            <div class="a4-footnote-line"></div>
            ${bab1FnItemsHtml}
          </div>
        ` : ''}
      </div>
      <div class="a4-footer">1</div>
    </div>
  `;
  pages.push(bab1Html);

  const bab2FnList = [];
  let bab2BodyHtml = '';
  (data.pembahasan || []).forEach((sub, sIdx) => {
    const letter = letters[sIdx] || String(sIdx + 1);
    bab2BodyHtml += `<div class="a4-heading-2">${letter}. ${escapeHtml(sub.judulSub || 'Sub-bab')}</div>`;
    if (sub.isiSub && sub.isiSub.trim()) {
      const subLines = sub.isiSub.split('\n').map(l => l.trim()).filter(l => l !== '');
      bab2BodyHtml += subLines.map(l => parseTextWithFootnotes(l, bab2FnList)).join('');
    }
    (sub.subPoin || []).forEach((pt, pIdx) => {
      bab2BodyHtml += `<div class="a4-heading-3">${pIdx + 1}. ${escapeHtml(pt.judulPoin || 'Anak Sub-bab')}</div>`;
      if (pt.isiPoin && pt.isiPoin.trim()) {
        const ptLines = pt.isiPoin.split('\n').map(l => l.trim()).filter(l => l !== '');
        bab2BodyHtml += ptLines.map(l => parseTextWithFootnotes(l, bab2FnList)).join('');
      }
    });
  });

  const bab2FnItemsHtml = bab2FnList.map((fn, idx) => `
    <div class="a4-footnote-item"><sup>[${idx + 1}]</sup> ${escapeHtml(fn)}</div>
  `).join('');

  const bab2Html = `
    <div class="a4-page">
      <div class="a4-header"></div>
      <div class="a4-body">
        <div class="a4-heading-1">BAB II<br>PEMBAHASAN</div>
        ${bab2BodyHtml}
        ${bab2FnList.length > 0 ? `
          <div class="a4-footnote-container">
            <div class="a4-footnote-line"></div>
            ${bab2FnItemsHtml}
          </div>
        ` : ''}
      </div>
      <div class="a4-footer">2</div>
    </div>
  `;
  pages.push(bab2Html);

  const bab3FnList = [];
  const kesimpulanLines = (data.kesimpulan || '').split('\n').map(l => l.trim()).filter(l => l !== '');
  const kesimpulanBody = kesimpulanLines.map(l => parseTextWithFootnotes(l, bab3FnList)).join('');

  let saranHtml = '';
  if (data.useSaran && data.saran && data.saran.trim()) {
    const saranLines = data.saran.split('\n').map(l => l.trim()).filter(l => l !== '');
    const saranBody = saranLines.map(l => parseTextWithFootnotes(l, bab3FnList)).join('');
    saranHtml = `
      <div class="a4-heading-2">B. Saran</div>
      ${saranBody}
    `;
  }

  const bab3Html = `
    <div class="a4-page">
      <div class="a4-header"></div>
      <div class="a4-body">
        <div class="a4-heading-1">BAB III<br>PENUTUP</div>
        <div class="a4-heading-2">A. Kesimpulan</div>
        ${kesimpulanBody}
        ${saranHtml}
      </div>
      <div class="a4-footer">3</div>
    </div>
  `;
  pages.push(bab3Html);

  const sortedBib = (data.daftarPustaka || [])
    .map(b => b.trim())
    .filter(b => b !== '')
    .sort((a, b) => a.localeCompare(b, 'id'));

  const bibEntriesHtml = sortedBib.map(b => `
    <div class="a4-bib-entry">${escapeHtml(b)}</div>
  `).join('');

  const bibHtml = `
    <div class="a4-page">
      <div class="a4-header"></div>
      <div class="a4-body">
        <div class="a4-heading-1">DAFTAR PUSTAKA</div>
        ${bibEntriesHtml}
      </div>
      <div class="a4-footer">4</div>
    </div>
  `;
  pages.push(bibHtml);

  container.innerHTML = pages.join('');
}

function triggerPrintPdf() {
  if (!appState.docGenerated) {
    const payload = gatherFormData();
    if (!payload.judul) {
      showToast('Lengkapi Judul Makalah terlebih dahulu.');
      return;
    }
    renderLiveA4Preview(payload);
  }
  openSplitPreview();
  setTimeout(() => {
    window.print();
  }, 250);
}

function triggerDirectDownload(format) {
  if (format === 'pdf') {
    closeDownloadModal();
    triggerPrintPdf();
    return;
  }
  closeDownloadModal();
  generateAndDownloadDocx();
}

async function generateAndDownloadDocx() {
  if (typeof JSZip === 'undefined') {
    alert('Library JSZip belum termuat. Pastikan terhubung ke internet.');
    return;
  }

  showCenterLoading('Menyusun Dokumen Word (.docx)...', 'Membuat berkas OpenXML berstandar akademik UIN KHAS Jember.');

  try {
    const data = gatherFormData();
    const safeName = (data.kelompok + ' ' + data.mataKuliah).trim().replace(/[\\/:*?"<>|]/g, '_') || 'Makalah_Akademik';
    const zip = new JSZip();

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/word/footer2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
</Types>`);

    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

    zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdFootnotes" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/>
  <Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
  <Relationship Id="rIdFooter2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/>
  <Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
</Relationships>`);

    zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Traditional Arabic"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="32"/>
        <w:lang w:val="id-ID"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="360" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`);

    zip.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="24"/>
      </w:rPr>
      <w:fldSimple w:instr="PAGE"/>
    </w:r>
  </w:p>
</w:ftr>`);

    zip.file('word/footer2.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="24"/>
      </w:rPr>
      <w:fldSimple w:instr="PAGE"/>
    </w:r>
  </w:p>
</w:ftr>`);

    zip.file('word/header1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:jc w:val="right"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="24"/>
      </w:rPr>
      <w:fldSimple w:instr="PAGE"/>
    </w:r>
  </w:p>
</w:hdr>`);

    let footnoteIdCounter = 1;
    const footnoteEntries = [];

    function buildXmlParagraph(text, options = {}) {
      const isArabic = isArabicText(text);
      let isBlockquote = false;
      let cleanText = text;
      if (cleanText.startsWith('[BLOCKQUOTE]')) {
        isBlockquote = true;
        cleanText = cleanText.replace('[BLOCKQUOTE]', '').trim();
      }

      let pPr = '';
      if (options.isHeading1) {
        pPr = '<w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="160" w:line="360" w:lineRule="auto"/></w:pPr>';
      } else if (options.isHeading2) {
        pPr = '<w:pPr><w:jc w:val="left"/><w:spacing w:before="200" w:after="100" w:line="360" w:lineRule="auto"/></w:pPr>';
      } else if (options.isHeading3) {
        pPr = '<w:pPr><w:ind w:left="360"/><w:jc w:val="left"/><w:spacing w:before="160" w:after="80" w:line="360" w:lineRule="auto"/></w:pPr>';
      } else if (isArabic) {
        pPr = '<w:pPr><w:bidi/><w:jc w:val="right"/><w:spacing w:line="240" w:lineRule="auto" w:before="120" w:after="120"/></w:pPr>';
      } else if (isBlockquote) {
        pPr = '<w:pPr><w:ind w:left="720"/><w:jc w:val="both"/><w:spacing w:line="240" w:lineRule="auto" w:before="120" w:after="120"/></w:pPr>';
      } else if (options.isBib) {
        pPr = '<w:pPr><w:ind w:left="720" w:hanging="720"/><w:jc w:val="both"/><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="240"/></w:pPr>';
      } else if (options.isList) {
        pPr = '<w:pPr><w:ind w:left="360" w:hanging="360"/><w:jc w:val="both"/><w:spacing w:line="360" w:lineRule="auto" w:after="80"/></w:pPr>';
      } else {
        pPr = '<w:pPr><w:ind w:firstLine="720"/><w:jc w:val="both"/><w:spacing w:line="360" w:lineRule="auto" w:after="80"/></w:pPr>';
      }

      const segments = cleanText.split(/(\^\[[^\]]+\])/g);
      let runsXml = '';
      segments.forEach(seg => {
        if (!seg) return;
        if (seg.startsWith('^[') && seg.endsWith(']')) {
          const fnContent = seg.slice(2, -1).trim();
          const curId = footnoteIdCounter++;
          footnoteEntries.push({ id: curId, text: fnContent });
          runsXml += `<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="${curId}"/></w:r>`;
        } else {
          const fontTag = isArabic
            ? '<w:rFonts w:ascii="Traditional Arabic" w:hAnsi="Traditional Arabic" w:cs="Traditional Arabic"/><w:sz w:val="32"/><w:szCs w:val="32"/><w:rtl/>'
            : `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/>${options.bold ? '<w:b/>' : ''}`;
          runsXml += `<w:r><w:rPr>${fontTag}</w:rPr><w:t xml:space="preserve">${escapeXml(seg)}</w:t></w:r>`;
        }
      });
      return `<w:p>${pPr}${runsXml}</w:p>`;
    }

    let docBody = '';

    docBody += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="400" w:after="160"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>${escapeXml(data.judul || 'JUDUL MAKALAH')}</w:t></w:r></w:p>`;
    docBody += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="200" w:after="400"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>MAKALAH</w:t></w:r></w:p>`;
    docBody += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="600" w:after="200"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t>Diajukan untuk Memenuhi Tugas Mata Kuliah: ${escapeXml(data.mataKuliah || '')}</w:t></w:r></w:p>`;
    docBody += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="400"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>Dosen Pengampu: ${escapeXml(data.dosen || '')}</w:t></w:r></w:p>`;
    docBody += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="400" w:after="120"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>Disusun Oleh: ${escapeXml(data.kelompok || 'Kelompok')}</w:t></w:r></w:p>`;

    (data.penulis || []).forEach(p => {
      docBody += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="60"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(p.nama || '')} (NIM: ${escapeXml(p.nim || '')})</w:t></w:r></w:p>`;
    });

    docBody += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="600" w:after="60"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>PROGRAM STUDI ${escapeXml(data.prodi || '')}</w:t></w:r></w:p>`;
    docBody += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="60"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>FAKULTAS ${escapeXml(data.fakultas || '')}</w:t></w:r></w:p>`;
    docBody += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="60"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>UNIVERSITAS ISLAM NEGERI KIAI HAJI ACHMAD SIDDIQ JEMBER</w:t></w:r></w:p>`;
    docBody += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="60"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(data.bulanTahun || '2026')}</w:t></w:r></w:p>`;

    docBody += `<w:p><w:pPr><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p>`;

    docBody += buildXmlParagraph('KATA PENGANTAR', { isHeading1: true, bold: true });
    (data.kataPengantar || '').split('\n').map(l => l.trim()).filter(l => l !== '').forEach(line => {
      docBody += buildXmlParagraph(line);
    });

    docBody += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
    docBody += buildXmlParagraph('DAFTAR ISI', { isHeading1: true, bold: true });

    const tocList = [];
    tocList.push({ title: 'KATA PENGANTAR', page: 'i', bold: true });
    tocList.push({ title: 'DAFTAR ISI', page: 'ii', bold: true });
    tocList.push({ title: 'BAB I PENDAHULUAN', page: '1', bold: true });
    tocList.push({ title: 'A. Latar Belakang', page: '1', bold: false });
    tocList.push({ title: 'B. Rumusan Masalah', page: '2', bold: false });
    if (data.useTujuan) tocList.push({ title: 'C. Tujuan Penulisan', page: '2', bold: false });
    tocList.push({ title: 'BAB II PEMBAHASAN', page: '3', bold: true });
    (data.pembahasan || []).forEach((sub, sIdx) => {
      const letter = letters[sIdx] || String(sIdx + 1);
      tocList.push({ title: `${letter}. ${sub.judulSub || 'Sub-bab'}`, page: '3', bold: false });
      (sub.subPoin || []).forEach((pt, pIdx) => {
        tocList.push({ title: `${pIdx + 1}. ${pt.judulPoin || 'Anak Sub-bab'}`, page: '4', bold: false });
      });
    });
    tocList.push({ title: 'BAB III PENUTUP', page: '5', bold: true });
    tocList.push({ title: 'A. Kesimpulan', page: '5', bold: false });
    if (data.useSaran) tocList.push({ title: 'B. Saran', page: '5', bold: false });
    tocList.push({ title: 'DAFTAR PUSTAKA', page: '6', bold: true });

    tocList.forEach(item => {
      docBody += `<w:p><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="7938"/></w:tabs><w:spacing w:line="280" w:lineRule="auto" w:before="40" w:after="40"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/>${item.bold ? '<w:b/>' : ''}</w:rPr><w:t>${escapeXml(item.title)}</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/>${item.bold ? '<w:b/>' : ''}</w:rPr><w:t>${escapeXml(item.page)}</w:t></w:r></w:p>`;
    });

    docBody += `<w:p><w:pPr><w:sectPr><w:footerReference w:type="default" r:id="rIdFooter2"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/><w:pgNumType w:fmt="lowerRoman" w:start="1"/><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p>`;

    docBody += buildXmlParagraph('BAB I PENDAHULUAN', { isHeading1: true, bold: true });
    docBody += buildXmlParagraph('A. Latar Belakang', { isHeading2: true, bold: true });
    (data.latarBelakang || '').split('\n').map(l => l.trim()).filter(l => l !== '').forEach(line => {
      docBody += buildXmlParagraph(line);
    });

    docBody += buildXmlParagraph('B. Rumusan Masalah', { isHeading2: true, bold: true });
    (data.rumusanMasalah || []).forEach((r, idx) => {
      docBody += buildXmlParagraph(`${idx + 1}. ${r}`, { isList: true });
    });

    if (data.useTujuan && data.tujuanPenulisan && data.tujuanPenulisan.length > 0) {
      docBody += buildXmlParagraph('C. Tujuan Penulisan', { isHeading2: true, bold: true });
      data.tujuanPenulisan.forEach((t, idx) => {
        docBody += buildXmlParagraph(`${idx + 1}. ${t}`, { isList: true });
      });
    }

    docBody += `<w:p><w:pPr><w:sectPr><w:headerReference w:type="default" r:id="rIdHeader1"/><w:footerReference w:type="firstPage" r:id="rIdFooter1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/><w:pgNumType w:start="1"/><w:titlePg/><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p>`;

    docBody += buildXmlParagraph('BAB II PEMBAHASAN', { isHeading1: true, bold: true });
    (data.pembahasan || []).forEach((sub, sIdx) => {
      const letter = letters[sIdx] || String(sIdx + 1);
      docBody += buildXmlParagraph(`${letter}. ${sub.judulSub || 'Sub-bab'}`, { isHeading2: true, bold: true });
      if (sub.isiSub && sub.isiSub.trim()) {
        sub.isiSub.split('\n').map(l => l.trim()).filter(l => l !== '').forEach(l => {
          docBody += buildXmlParagraph(l);
        });
      }
      (sub.subPoin || []).forEach((pt, pIdx) => {
        docBody += buildXmlParagraph(`${pIdx + 1}. ${pt.judulPoin || 'Anak Sub-bab'}`, { isHeading3: true, bold: true });
        if (pt.isiPoin && pt.isiPoin.trim()) {
          pt.isiPoin.split('\n').map(l => l.trim()).filter(l => l !== '').forEach(l => {
            docBody += buildXmlParagraph(l);
          });
        }
      });
    });

    docBody += `<w:p><w:pPr><w:sectPr><w:headerReference w:type="default" r:id="rIdHeader1"/><w:footerReference w:type="firstPage" r:id="rIdFooter1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/><w:titlePg/><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p>`;

    docBody += buildXmlParagraph('BAB III PENUTUP', { isHeading1: true, bold: true });
    docBody += buildXmlParagraph('A. Kesimpulan', { isHeading2: true, bold: true });
    (data.kesimpulan || '').split('\n').map(l => l.trim()).filter(l => l !== '').forEach(line => {
      docBody += buildXmlParagraph(line);
    });

    if (data.useSaran && data.saran && data.saran.trim()) {
      docBody += buildXmlParagraph('B. Saran', { isHeading2: true, bold: true });
      data.saran.split('\n').map(l => l.trim()).filter(l => l !== '').forEach(line => {
        docBody += buildXmlParagraph(line);
      });
    }

    docBody += `<w:p><w:pPr><w:sectPr><w:headerReference w:type="default" r:id="rIdHeader1"/><w:footerReference w:type="firstPage" r:id="rIdFooter1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/><w:titlePg/><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p>`;

    docBody += buildXmlParagraph('DAFTAR PUSTAKA', { isHeading1: true, bold: true });
    (data.daftarPustaka || [])
      .map(b => b.trim())
      .filter(b => b !== '')
      .sort((a, b) => a.localeCompare(b, 'id'))
      .forEach(entry => {
        docBody += buildXmlParagraph(entry, { isBib: true });
      });

    docBody += `<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader1"/><w:footerReference w:type="firstPage" r:id="rIdFooter1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1701" w:bottom="1701" w:left="2268"/><w:titlePg/></w:sectPr>`;

    zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${docBody}
  </w:body>
</w:document>`);

    let footnotesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:footnote w:type="separator" w:id="-1">
    <w:p><w:r><w:separator/></w:r></w:p>
  </w:footnote>
  <w:footnote w:type="continuationSeparator" w:id="0">
    <w:p><w:r><w:continuationSeparator/></w:r></w:p>
  </w:footnote>`;

    footnoteEntries.forEach(item => {
      footnotesXml += `
  <w:footnote w:id="${item.id}">
    <w:p>
      <w:pPr>
        <w:ind w:firstLine="720"/>
        <w:jc w:val="both"/>
        <w:spacing w:line="240" w:lineRule="auto" w:after="40"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rStyle w:val="FootnoteReference"/>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:footnoteRef/>
      </w:r>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t xml:space="preserve"> ${escapeXml(item.text)}</w:t>
      </w:r>
    </w:p>
  </w:footnote>`;
    });

    footnotesXml += `\n</w:footnotes>`;
    zip.file('word/footnotes.xml', footnotesXml);

    const docxBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    hideCenterLoading();
    const downloadUrl = URL.createObjectURL(docxBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = safeName + '.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

    showToast('File ' + safeName + '.docx berhasil diunduh.');
  } catch (err) {
    hideCenterLoading();
    alert('Gagal membuat file DOCX: ' + err.message);
  }
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
