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

  document.addEventListener('focusin', (e) => {
    if (e.target && e.target.tagName === 'TEXTAREA') {
      appState.lastFocusedTextarea = e.target;
    }
  });
});

document.addEventListener('click', (e) => {
  const popover = document.getElementById('optionsPopover');
  const moreBtn = document.getElementById('dockMoreBtn');
  if (popover && !popover.classList.contains('hidden')) {
    if (!popover.contains(e.target) && (!moreBtn || !moreBtn.contains(e.target)) && !e.target.closest('[data-nav="contact"]') && !e.target.closest('.btn-mobile-menu')) {
      popover.classList.add('hidden');
    }
  }
});

function handleTopNav(navKey) {
  document.querySelectorAll('.nav-link-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-nav') === navKey);
  });
  if (navKey === 'home') {
    switchStep('step-identitas');
  } else if (navKey === 'generator') {
    switchStep('step-bab1');
  }
}

function handleDockMenu(menuKey) {
  document.querySelectorAll('.dock-nav-item').forEach(btn => btn.classList.remove('active'));
  if (menuKey === 'home') {
    document.getElementById('dockManualBtn').classList.add('active');
    switchStep('step-identitas');
  } else if (menuKey === 'riwayat') {
    document.getElementById('dockHistoryBtn').classList.add('active');
    if (appState.docGenerated) {
      openSplitPreview();
      showToast('Menampilkan pratinjau dokumen terakhir.');
    } else {
      switchStep('step-daftarisi');
      showToast('Menampilkan kerangka Daftar Isi makalah.');
    }
  }
}

function toggleEditorAiBanner() {
  const banner = document.getElementById('aiAssistantBanner');
  if (!banner) return;
  const isHidden = banner.classList.contains('hidden');
  if (isHidden) {
    banner.classList.remove('hidden');
    appState.mode = 'ai';
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    banner.classList.add('hidden');
    appState.mode = 'manual';
  }
}

function toggleThemeBrightness() {
  document.body.classList.toggle('theme-dimmed');
  const isDimmed = document.body.classList.contains('theme-dimmed');
  showToast(isDimmed ? 'Tampilan kontras lembut diaktifkan.' : 'Tampilan cerah standar diaktifkan.');
}

function toggleMobileDrawer() {
  const popover = document.getElementById('optionsPopover');
  if (popover) {
    popover.classList.toggle('hidden');
  }
}

function resetFormConfirm() {
  if (!confirm('Ingin mengatur ulang formulir ke bagian awal?')) {
    return;
  }
  switchStep('step-identitas');
  closeSplitPreview();
  showToast('Kembali ke halaman utama identitas makalah.');
}

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
        <div style="font-weight:700; color:#0F172A;">${escapeHtml(f.fileName || 'Tanpa Judul')}</div>
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
  const banner = document.getElementById('aiAssistantBanner');
  if (banner) {
    banner.classList.toggle('hidden', mode !== 'ai');
  }
}

function switchStep(stepId) {
  appState.currentStep = stepId;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  const targetPanel = document.getElementById(stepId);
  if (targetPanel) targetPanel.classList.add('active');

  document.querySelectorAll('.step-circle[data-step]').forEach(c => {
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
    switchStep('step-bab1');
    setTimeout(() => {
      const target = document.getElementById('txtLatarBelakang');
      if (target) target.focus();
    }, 100);
    showToast('Silakan ketik pada kolom paragraf Bab I.');
    return;
  }
  const snippet = (ta.value.trim() ? '\n' : '') + 'Berdasarkan tinjauan literatur tersebut, dapat dipahami bahwa ';
  insertAtElement(ta, snippet);
  showToast('Paragraf baru ditambahkan.');
}

function insertActiveFootnote() {
  const ta = getTargetTextarea();
  if (!ta) {
    switchStep('step-bab1');
    showToast('Buka kolom teks Latar Belakang atau Pembahasan terlebih dahulu.');
    return;
  }
  const snippet = '^[Nama Depan Nama Belakang, Judul Buku (Kota: Penerbit, 2024), 25.]';
  insertAtElement(ta, snippet);
  showToast('Tag Native Footnote CMOS 17th disisipkan.');
}

function insertActiveBlockquote() {
  const ta = getTargetTextarea();
  if (!ta) {
    switchStep('step-bab1');
    showToast('Buka kolom teks Latar Belakang atau Pembahasan terlebih dahulu.');
    return;
  }
  const snippet = (ta.value.trim() ? '\n' : '') + '[BLOCKQUOTE] ';
  insertAtElement(ta, snippet);
  showToast('Penanda kutipan panjang (>= 5 baris) disisipkan.');
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
    { val: 100, sym: 'c' },
    { val: 90, sym: 'xc' },
    { val: 50, sym: 'l' },
    { val: 40, sym: 'xl' },
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

function computeAcademicLayout(data) {
  const pageMap = {};
  const allPages = [];
  let fnCounter = 1;

  function parseParagraphLine(rawLine, indentStyle) {
    let isBlockquote = false;
    let clean = String(rawLine || '').trim();
    if (clean.indexOf('[BLOCKQUOTE]') !== -1) {
      isBlockquote = clean.startsWith('[BLOCKQUOTE]');
      clean = clean.replace(/\[BLOCKQUOTE\]/g, '').trim();
    }
    const isArabic = isArabicText(clean);
    const segments = clean.split(/(\^\[[^\]]+\])/g);
    let htmlInner = '';
    const lineFootnotes = [];

    segments.forEach(seg => {
      if (!seg) return;
      if (seg.startsWith('^[') && seg.endsWith(']')) {
        const fnText = seg.slice(2, -1).trim();
        const num = fnCounter++;
        lineFootnotes.push({ num, text: fnText });
        htmlInner += `<sup class="a4-footnote-ref">${num}</sup>`;
      } else {
        htmlInner += escapeHtml(seg);
      }
    });

    const plainTextLen = clean.replace(/\^\[[^\]]+\]/g, '').length;
    const charsPerLine = isBlockquote ? 62 : 68;
    const lineCount = Math.max(1, Math.ceil((plainTextLen + 6) / charsPerLine));
    const estHeight = lineCount * (isBlockquote ? 15 : 21) + 6 + (lineFootnotes.length * 22);

    let blockHtml = '';
    if (isArabic) {
      blockHtml = `<p class="a4-p-arabic">${htmlInner}</p>`;
    } else if (isBlockquote) {
      blockHtml = `<div class="a4-blockquote">${htmlInner}</div>`;
    } else if (indentStyle === 'list') {
      blockHtml = `<div class="a4-p" style="text-indent:0; padding-left:0.63cm;">${htmlInner}</div>`;
    } else if (indentStyle === 'subpoin') {
      blockHtml = `<p class="a4-p" style="padding-left:0.63cm;">${htmlInner}</p>`;
    } else {
      blockHtml = `<p class="a4-p">${htmlInner}</p>`;
    }

    return {
      type: 'para',
      html: blockHtml,
      heightPt: estHeight,
      footnotes: lineFootnotes,
      tocKey: null
    };
  }

  function paginateChapterBlocks(chapterTitleHtml, blocks, numberingMode, startCounter) {
    const MAX_PAGE_PT = 500;
    const chapterPages = [];
    let currentBlocks = [];
    let currentFootnotes = [];
    let currentHeight = 52;
    let blocksCountOnPage = 0;
    let pageIdxInChapter = 0;

    function flushPage() {
      const pageNumVal = startCounter + pageIdxInChapter;
      const pageStr = numberingMode === 'roman' ? toRomanClient(pageNumVal) : String(pageNumVal);
      const isFirstPage = pageIdxInChapter === 0;

      const headerStr = (numberingMode === 'arabic' && !isFirstPage) ? pageStr : '';
      const footerStr = (numberingMode === 'roman' || (numberingMode === 'arabic' && isFirstPage)) ? pageStr : '';

      currentBlocks.forEach(b => {
        if (b.tocKey && !pageMap[b.tocKey]) {
          pageMap[b.tocKey] = pageStr;
        }
      });

      const fnHtml = currentFootnotes.length > 0 ? `
        <div class="a4-footnote-container">
          <div class="a4-footnote-line"></div>
          ${currentFootnotes.map(f => `<div class="a4-footnote-item"><sup class="a4-footnote-ref">${f.num}</sup> ${escapeHtml(f.text)}</div>`).join('')}
        </div>
      ` : '';

      const pageHtml = `
        <div class="a4-page">
          <div class="a4-header">${headerStr}</div>
          <div class="a4-body">
            ${isFirstPage ? chapterTitleHtml : ''}
            ${currentBlocks.map(b => b.html).join('')}
            ${fnHtml}
          </div>
          <div class="a4-footer">${footerStr}</div>
        </div>
      `;
      chapterPages.push(pageHtml);
      pageIdxInChapter++;
      currentBlocks = [];
      currentFootnotes = [];
      currentHeight = 0;
      blocksCountOnPage = 0;
    }

    for (let i = 0; i < blocks.length; i++) {
      const blk = blocks[i];
      if (blocksCountOnPage >= 2 && (currentHeight + blk.heightPt > MAX_PAGE_PT)) {
        let movedHeading = null;
        if (currentBlocks.length > 0 && currentBlocks[currentBlocks.length - 1].isSubHeading && currentBlocks.length >= 2) {
          movedHeading = currentBlocks.pop();
        }
        flushPage();
        if (movedHeading) {
          currentBlocks.push(movedHeading);
          currentHeight += movedHeading.heightPt;
          blocksCountOnPage++;
        }
      }
      currentBlocks.push(blk);
      if (blk.footnotes && blk.footnotes.length > 0) {
        currentFootnotes.push(...blk.footnotes);
      }
      currentHeight += blk.heightPt;
      blocksCountOnPage++;
    }

    if (currentBlocks.length > 0 || pageIdxInChapter === 0) {
      flushPage();
    }

    return {
      pagesHtml: chapterPages,
      nextCounter: startCounter + pageIdxInChapter
    };
  }

  const authorsTableRows = (data.penulis || []).map(p => `
    <tr>
      <td style="width:45%; text-align:center; padding:2px 4px;">${escapeHtml(p.nama || '')}</td>
      <td style="width:10%; text-align:center;"></td>
      <td style="width:45%; text-align:left; padding:2px 4px;">${escapeHtml(p.nim || '')}</td>
    </tr>
  `).join('');

  const coverPageHtml = `
    <div class="a4-page">
      <div class="a4-header"></div>
      <div class="a4-body a4-cover-wrap">
        <div style="margin-top:4mm;">
          <div style="font-weight:700; font-size:14pt; line-height:1.5;">MAKALAH</div>
          <div style="font-weight:700; font-size:14pt; line-height:1.5;">${escapeHtml(data.judul || 'Judul Makalah')}</div>
          <div style="font-size:12pt; line-height:1.5; margin-top:4px;">Disususn Untuk Memenuhi Tugas Mata Kuliah ${escapeHtml(data.mataKuliah || '')}</div>
          <div style="font-size:12pt; line-height:1.5;">Dosen pengampu : ${escapeHtml(data.dosen || '')}</div>
        </div>
        <div style="margin:10mm 0;">
          <img src="https://lh3.googleusercontent.com/d/1abt15uTvX-593w_xSlrRm6IGEsf7Iqnc" alt="Logo UIN KHAS" style="width:6.7cm; height:6.7cm; object-fit:contain;" onerror="this.style.display='none'">
        </div>
        <div style="width:100%;">
          <div style="font-weight:700; font-size:12pt; margin-bottom:6px;">Oleh ${escapeHtml(data.kelompok || 'Kelompok 1')} :</div>
          <table style="width:100%; border-collapse:collapse; font-size:12pt; margin-bottom:10mm;">
            ${authorsTableRows}
          </table>
        </div>
        <div style="font-weight:700; font-size:12pt; line-height:1.5; text-transform:uppercase;">
          <div>PROGRAM STUDI ${escapeHtml(data.prodi || '')}</div>
          <div>FAKULTAS ${escapeHtml(data.fakultas || '')}</div>
          <div style="height:12pt;"></div>
          <div>UNIVERSITAS ISLAM NEGERI KIAI HAJI ACHMAD SIDDIQ</div>
          <div>${escapeHtml(data.kota || 'JEMBER')} ${escapeHtml(data.bulanTahun || 'NOVEMBER 2026')}</div>
        </div>
      </div>
      <div class="a4-footer"></div>
    </div>
  `;
  allPages.push(coverPageHtml);

  let romanCounter = 1;
  pageMap['KATA PENGANTAR'] = toRomanClient(romanCounter);
  const pengantarLines = (data.kataPengantar || '').split('\n').map(l => l.trim()).filter(l => l !== '');
  const pengantarBlocks = pengantarLines.map(l => parseParagraphLine(l, 'normal'));
  const pengantarRes = paginateChapterBlocks(
    `<div class="a4-heading-1" style="font-size:14pt;">KATA PENGANTAR</div>`,
    pengantarBlocks,
    'roman',
    romanCounter
  );
  romanCounter = pengantarRes.nextCounter;
  const tocRomanStr = toRomanClient(romanCounter);
  pageMap['DAFTAR ISI'] = tocRomanStr;

  let arabicCounter = 1;
  pageMap['BAB I'] = String(arabicCounter);
  const bab1Blocks = [];
  bab1Blocks.push({
    html: `<div class="a4-heading-2">A. Latar Belakang</div>`,
    heightPt: 28,
    isSubHeading: true,
    tocKey: 'A. LATAR BELAKANG',
    footnotes: []
  });
  (data.latarBelakang || '').split('\n').map(l => l.trim()).filter(l => l !== '').forEach(l => {
    bab1Blocks.push(parseParagraphLine(l, 'normal'));
  });

  bab1Blocks.push({
    html: `<div class="a4-heading-2">B. Rumusan Masalah</div>`,
    heightPt: 28,
    isSubHeading: true,
    tocKey: 'B. RUMUSAN MASALAH',
    footnotes: []
  });
  (data.rumusanMasalah || []).map(r => r.trim()).filter(r => r !== '').forEach((r, idx) => {
    bab1Blocks.push(parseParagraphLine(`${idx + 1}. ${r}`, 'list'));
  });

  if (data.useTujuan && data.tujuanPenulisan && data.tujuanPenulisan.length > 0) {
    bab1Blocks.push({
      html: `<div class="a4-heading-2">C. Tujuan Penulisan</div>`,
      heightPt: 28,
      isSubHeading: true,
      tocKey: 'C. TUJUAN PENULISAN',
      footnotes: []
    });
    data.tujuanPenulisan.map(t => t.trim()).filter(t => t !== '').forEach((t, idx) => {
      bab1Blocks.push(parseParagraphLine(`${idx + 1}. ${t}`, 'list'));
    });
  }

  const bab1Res = paginateChapterBlocks(
    `<div class="a4-heading-1" style="font-size:14pt;">BAB I<br>PENDAHULUAN</div>`,
    bab1Blocks,
    'arabic',
    arabicCounter
  );
  arabicCounter = bab1Res.nextCounter;

  pageMap['BAB II'] = String(arabicCounter);
  const bab2Blocks = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  (data.pembahasan || []).forEach((sub, sIdx) => {
    const letter = letters[sIdx] || String(sIdx + 1);
    const subTitle = `${letter}. ${sub.judulSub || 'Sub-bab'}`;
    bab2Blocks.push({
      html: `<div class="a4-heading-2">${escapeHtml(subTitle)}</div>`,
      heightPt: 28,
      isSubHeading: true,
      tocKey: subTitle.toUpperCase().trim(),
      footnotes: []
    });
    if (sub.isiSub && sub.isiSub.trim()) {
      sub.isiSub.split('\n').map(l => l.trim()).filter(l => l !== '').forEach(l => {
        bab2Blocks.push(parseParagraphLine(l, 'normal'));
      });
    }
    (sub.subPoin || []).forEach((pt, pIdx) => {
      const ptTitle = `${pIdx + 1}. ${pt.judulPoin || 'Anak Sub-bab'}`;
      bab2Blocks.push({
        html: `<div class="a4-heading-3">${escapeHtml(ptTitle)}</div>`,
        heightPt: 26,
        isSubHeading: true,
        tocKey: ptTitle.toUpperCase().trim(),
        footnotes: []
      });
      if (pt.isiPoin && pt.isiPoin.trim()) {
        pt.isiPoin.split('\n').map(l => l.trim()).filter(l => l !== '').forEach(l => {
          bab2Blocks.push(parseParagraphLine(l, 'subpoin'));
        });
      }
    });
  });

  const bab2Res = paginateChapterBlocks(
    `<div class="a4-heading-1" style="font-size:14pt;">BAB II<br>PEMBAHASAN</div>`,
    bab2Blocks,
    'arabic',
    arabicCounter
  );
  arabicCounter = bab2Res.nextCounter;

  pageMap['BAB III'] = String(arabicCounter);
  const bab3Blocks = [];
  bab3Blocks.push({
    html: `<div class="a4-heading-2">A. Kesimpulan</div>`,
    heightPt: 28,
    isSubHeading: true,
    tocKey: 'A. KESIMPULAN',
    footnotes: []
  });
  (data.kesimpulan || '').split('\n').map(l => l.trim()).filter(l => l !== '').forEach(l => {
    bab3Blocks.push(parseParagraphLine(l, 'normal'));
  });

  if (data.useSaran && data.saran && data.saran.trim()) {
    bab3Blocks.push({
      html: `<div class="a4-heading-2">B. Saran</div>`,
      heightPt: 28,
      isSubHeading: true,
      tocKey: 'B. SARAN',
      footnotes: []
    });
    data.saran.split('\n').map(l => l.trim()).filter(l => l !== '').forEach(l => {
      bab3Blocks.push(parseParagraphLine(l, 'normal'));
    });
  }

  const bab3Res = paginateChapterBlocks(
    `<div class="a4-heading-1" style="font-size:14pt;">BAB III<br>PENUTUP</div>`,
    bab3Blocks,
    'arabic',
    arabicCounter
  );
  arabicCounter = bab3Res.nextCounter;

  pageMap['DAFTAR PUSTAKA'] = String(arabicCounter);
  const sortedBib = (data.daftarPustaka || [])
    .map(b => b.trim())
    .filter(b => b !== '')
    .sort((a, b) => a.localeCompare(b, 'id'));

  const bibBlocks = sortedBib.map(b => {
    const lines = Math.max(1, Math.ceil(b.length / 72));
    return {
      html: `<div class="a4-bib-entry">${escapeHtml(b)}</div>`,
      heightPt: lines * 15 + 12,
      isSubHeading: false,
      tocKey: null,
      footnotes: []
    };
  });

  const bibRes = paginateChapterBlocks(
    `<div class="a4-heading-1" style="font-size:14pt;">DAFTAR PUSTAKA</div>`,
    bibBlocks,
    'arabic',
    arabicCounter
  );

  const tocEntries = [];
  tocEntries.push({ title: 'KATA PENGANTAR', page: pageMap['KATA PENGANTAR'] || 'i', level: 1 });
  tocEntries.push({ title: 'DAFTAR ISI', page: pageMap['DAFTAR ISI'] || 'ii', level: 1 });
  tocEntries.push({ title: 'BAB I PENDAHULUAN', page: pageMap['BAB I'] || '1', level: 1 });
  tocEntries.push({ title: 'A. Latar Belakang', page: pageMap['A. LATAR BELAKANG'] || pageMap['BAB I'] || '1', level: 2 });
  tocEntries.push({ title: 'B. Rumusan Masalah', page: pageMap['B. RUMUSAN MASALAH'] || pageMap['BAB I'] || '1', level: 2 });
  if (data.useTujuan) {
    tocEntries.push({ title: 'C. Tujuan Penulisan', page: pageMap['C. TUJUAN PENULISAN'] || pageMap['BAB I'] || '1', level: 2 });
  }
  tocEntries.push({ title: 'BAB II PEMBAHASAN', page: pageMap['BAB II'] || '2', level: 1 });
  (data.pembahasan || []).forEach((sub, sIdx) => {
    const letter = letters[sIdx] || String(sIdx + 1);
    const subTitle = `${letter}. ${sub.judulSub || 'Sub-bab'}`;
    const subKey = subTitle.toUpperCase().trim();
    tocEntries.push({ title: subTitle, page: pageMap[subKey] || pageMap['BAB II'] || '2', level: 2 });
    (sub.subPoin || []).forEach((pt, pIdx) => {
      const ptTitle = `${pIdx + 1}. ${pt.judulPoin || 'Anak Sub-bab'}`;
      const ptKey = ptTitle.toUpperCase().trim();
      tocEntries.push({ title: ptTitle, page: pageMap[ptKey] || pageMap[subKey] || '2', level: 3 });
    });
  });
  tocEntries.push({ title: 'BAB III PENUTUP', page: pageMap['BAB III'] || '3', level: 1 });
  tocEntries.push({ title: 'A. Kesimpulan', page: pageMap['A. KESIMPULAN'] || pageMap['BAB III'] || '3', level: 2 });
  if (data.useSaran) {
    tocEntries.push({ title: 'B. Saran', page: pageMap['B. SARAN'] || pageMap['BAB III'] || '3', level: 2 });
  }
  tocEntries.push({ title: 'DAFTAR PUSTAKA', page: pageMap['DAFTAR PUSTAKA'] || '4', level: 1 });

  const tocTableRowsHtml = tocEntries.map(r => {
    const indentPx = r.level === 1 ? 0 : (r.level === 2 ? 18 : 36);
    const isBold = r.level === 1;
    return `
      <tr>
        <td style="padding-left:${indentPx}px; font-weight:${isBold ? '700' : '400'};">
          <div style="display:flex; align-items:baseline;">
            <span>${escapeHtml(r.title)}</span>
            <span style="flex:1; border-bottom:1px dotted #000; margin:0 6px;"></span>
          </div>
        </td>
        <td style="width:36px; text-align:right; font-weight:${isBold ? '700' : '400'};">${escapeHtml(r.page)}</td>
      </tr>
    `;
  }).join('');

  const tocPageHtml = `
    <div class="a4-page">
      <div class="a4-header"></div>
      <div class="a4-body">
        <div class="a4-heading-1" style="font-size:14pt;">DAFTAR ISI</div>
        <table class="a4-toc-table">
          ${tocTableRowsHtml}
        </table>
      </div>
      <div class="a4-footer">${tocRomanStr}</div>
    </div>
  `;

  allPages.push(...pengantarRes.pagesHtml);
  allPages.push(tocPageHtml);
  allPages.push(...bab1Res.pagesHtml);
  allPages.push(...bab2Res.pagesHtml);
  allPages.push(...bab3Res.pagesHtml);
  allPages.push(...bibRes.pagesHtml);

  return {
    pagesHtml: allPages,
    tocEntries,
    pageMap
  };
}

function refreshTocPreview() {
  const wrap = document.getElementById('tocLivePreview');
  if (!wrap) return;
  const data = gatherFormData();
  const layout = computeAcademicLayout(data);

  wrap.innerHTML = layout.tocEntries.map(r => `
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
      <span class="row-badge">${idx + 1} &bull;</span>
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
  const rawBib = document.getElementById('txtDaftarPustaka') ? document.getElementById('txtDaftarPustaka').value : '';
  return {
    judul: document.getElementById('inpJudul') ? document.getElementById('inpJudul').value.trim() : '',
    kelompok: document.getElementById('inpKelompok') ? document.getElementById('inpKelompok').value.trim() : 'Kelompok 1',
    mataKuliah: document.getElementById('inpMataKuliah') ? document.getElementById('inpMataKuliah').value.trim() : '',
    dosen: document.getElementById('inpDosen') ? document.getElementById('inpDosen').value.trim() : '',
    fakultas: document.getElementById('selFakultas') ? document.getElementById('selFakultas').value.trim().toUpperCase() : '',
    prodi: document.getElementById('selProdi') ? document.getElementById('selProdi').value.trim().toUpperCase() : '',
    kota: document.getElementById('inpKota') ? document.getElementById('inpKota').value.trim().toUpperCase() : 'JEMBER',
    bulanTahun: document.getElementById('inpBulanTahun') ? document.getElementById('inpBulanTahun').value.trim().toUpperCase() : 'NOVEMBER 2026',
    penulis: appState.penulis,
    useKataPengantar: true,
    useTujuan: document.getElementById('chkTujuan') ? document.getElementById('chkTujuan').checked : false,
    useSaran: document.getElementById('chkSaran') ? document.getElementById('chkSaran').checked : false,
    kataPengantar: document.getElementById('txtKataPengantar') ? document.getElementById('txtKataPengantar').value : '',
    latarBelakang: document.getElementById('txtLatarBelakang') ? document.getElementById('txtLatarBelakang').value : '',
    rumusanMasalah: appState.rumusan,
    tujuanPenulisan: appState.tujuan,
    pembahasan: appState.pembahasan,
    kesimpulan: document.getElementById('txtKesimpulan') ? document.getElementById('txtKesimpulan').value : '',
    saran: document.getElementById('txtSaran') ? document.getElementById('txtSaran').value : '',
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
  showCenterLoading('Memproses Dokumen Makalah...', 'Mengisi Template Makalah UIN KHAS Jember, menyusun Tabel Daftar Isi, dan menyematkan Native Footnote.');

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

function renderLiveA4Preview(data) {
  const container = document.getElementById('academicPaperPreview');
  if (!container) return;
  const layout = computeAcademicLayout(data);
  container.innerHTML = layout.pagesHtml.join('');
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

function buildTocLeaderLineDocx(title, level) {
  const isLvl1 = level === 1;
  const leftIndent = level === 1 ? 0 : (level === 2 ? 18 : 36);
  const baseColWidth = 356;
  const targetWidthPt = Math.max(140, baseColWidth - leftIndent - 34);
  const cleanTitle = String(title || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  let total = 0;
  for (let i = 0; i < cleanTitle.length; i++) {
    const ch = cleanTitle.charAt(i);
    if ('MW'.indexOf(ch) !== -1) total += isLvl1 ? 11.0 : 9.8;
    else if ('mw'.indexOf(ch) !== -1) total += isLvl1 ? 9.4 : 8.4;
    else if (ch >= 'A' && ch <= 'Z') total += isLvl1 ? 8.5 : 7.6;
    else if ('Iiltjfr1.,:;\'()[]!| '.indexOf(ch) !== -1) total += isLvl1 ? 3.9 : 3.4;
    else total += isLvl1 ? 6.2 : 5.6;
  }
  const dotWidthPt = isLvl1 ? 3.3 : 3.05;
  let effectiveTitleWidth = total;
  if (total > targetWidthPt - 18) {
    effectiveTitleWidth = total % targetWidthPt;
    if (effectiveTitleWidth > targetWidthPt - 18) {
      effectiveTitleWidth = targetWidthPt - 22;
    }
  }
  const remainingPt = Math.max(12, targetWidthPt - effectiveTitleWidth);
  const dotCount = Math.max(4, Math.floor(remainingPt / dotWidthPt));
  return cleanTitle + '\u00A0' + '.'.repeat(dotCount);
}

async function generateAndDownloadDocx() {
  if (typeof JSZip === 'undefined') {
    alert('Library JSZip belum termuat. Pastikan terhubung ke internet.');
    return;
  }

  showCenterLoading('Menyusun Dokumen Word (.docx)...', 'Mengisi Template Makalah.docx beserta Logo, Tabel Anggota, Daftar Isi, dan Native Footnote.');

  try {
    const data = gatherFormData();
    const layout = computeAcademicLayout(data);
    const safeName = (data.kelompok + ' ' + data.mataKuliah).trim().replace(/[\\/:*?"<>|]/g, '_') || 'Makalah_Akademik';

    const tplResponse = await fetch('/template.docx');
    if (!tplResponse.ok) {
      throw new Error('File /template.docx belum ditemukan di server. Pastikan file template.docx sudah diunggah.');
    }
    const tplBuffer = await tplResponse.arrayBuffer();
    const zip = await JSZip.loadAsync(tplBuffer);

    let docXml = await zip.file('word/document.xml').async('string');

    let footnoteIdCounter = 1;
    const footnoteEntries = [];

    function createFormattedParagraphXml(rawLine, baseIndentPt) {
      let isBlockquote = false;
      let cleanLine = rawLine || '';
      if (cleanLine.indexOf('[BLOCKQUOTE]') !== -1) {
        isBlockquote = cleanLine.trim().startsWith('[BLOCKQUOTE]');
        cleanLine = cleanLine.replace(/\[BLOCKQUOTE\]/g, '').trim();
      }
      const mostlyArabic = isArabicText(cleanLine) && cleanLine.replace(/[\u0600-\u06FF\s]/g, '').length < cleanLine.length * 0.3;
      const baseTwips = Math.round((baseIndentPt || 0) * 20);

      let pPr = '';
      if (mostlyArabic) {
        pPr = `<w:pPr><w:bidi/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/><w:ind w:left="${baseTwips}" w:firstLine="0"/><w:jc w:val="right"/></w:pPr>`;
      } else if (isBlockquote) {
        pPr = `<w:pPr><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/><w:ind w:left="${baseTwips + 720}" w:firstLine="0"/><w:jc w:val="both"/></w:pPr>`;
      } else {
        pPr = `<w:pPr><w:spacing w:before="0" w:after="80" w:line="360" w:lineRule="auto"/><w:ind w:left="${baseTwips}" w:firstLine="720"/><w:jc w:val="both"/></w:pPr>`;
      }

      const segments = cleanLine.split(/(\^\[[^\]]+\])/g);
      let runsXml = '';
      segments.forEach(seg => {
        if (!seg) return;
        if (seg.startsWith('^[') && seg.endsWith(']')) {
          const fnText = seg.slice(2, -1).trim();
          const curId = footnoteIdCounter++;
          footnoteEntries.push({ id: curId, text: fnText });
          runsXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:vertAlign w:val="superscript"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:footnoteReference w:id="${curId}"/></w:r>`;
        } else {
          if (mostlyArabic) {
            runsXml += `<w:r><w:rPr><w:rFonts w:ascii="Traditional Arabic" w:hAnsi="Traditional Arabic" w:cs="Traditional Arabic"/><w:sz w:val="32"/><w:szCs w:val="32"/><w:rtl/></w:rPr><w:t xml:space="preserve">${escapeXml(seg)}</w:t></w:r>`;
          } else {
            runsXml += `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(seg)}</w:t></w:r>`;
          }
        }
      });

      return `<w:p>${pPr}${runsXml}</w:p>`;
    }

    function buildParagraphsBlockXml(rawText, baseIndentPt) {
      const lines = (rawText || '').split('\n').map(l => l.trim()).filter(l => l !== '');
      if (lines.length === 0) return '<w:p/>';
      return lines.map(line => createFormattedParagraphXml(line, baseIndentPt)).join('');
    }

    function buildListBlockXml(items, numbered) {
      const valid = (items || []).map(i => i.trim()).filter(i => i !== '');
      if (valid.length === 0) return '<w:p/>';
      return valid.map((item, idx) => {
        const prefix = numbered ? (idx + 1) + '. ' : '';
        const indXml = numbered ? '<w:ind w:left="360" w:hanging="360"/>' : '<w:ind w:left="0" w:firstLine="0"/>';
        return `<w:p><w:pPr><w:spacing w:before="0" w:after="80" w:line="360" w:lineRule="auto"/>${indXml}<w:jc w:val="both"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(prefix + item)}</w:t></w:r></w:p>`;
      }).join('');
    }

    function buildBab2BlockXml(pembahasanList) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let out = '';
      (pembahasanList || []).forEach((sub, sIdx) => {
        const letter = letters[sIdx] || String(sIdx + 1);
        const h2Title = letter + '. ' + (sub.judulSub || 'Sub-Bab');
        out += `<w:p><w:pPr><w:spacing w:before="200" w:after="80" w:line="360" w:lineRule="auto"/><w:ind w:left="0" w:firstLine="0"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(h2Title)}</w:t></w:r></w:p>`;
        if (sub.isiSub && sub.isiSub.trim() !== '') {
          out += buildParagraphsBlockXml(sub.isiSub, 0);
        }
        (sub.subPoin || []).forEach((poin, pIdx) => {
          const h3Title = (pIdx + 1) + '. ' + (poin.judulPoin || 'Anak Sub-Bab');
          out += `<w:p><w:pPr><w:spacing w:before="120" w:after="80" w:line="360" w:lineRule="auto"/><w:ind w:left="360" w:firstLine="0"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(h3Title)}</w:t></w:r></w:p>`;
          if (poin.isiPoin && poin.isiPoin.trim() !== '') {
            out += buildParagraphsBlockXml(poin.isiPoin, 18);
          }
        });
      });
      return out || '<w:p/>';
    }

    function buildBibliographyBlockXml(bibList) {
      const sorted = (bibList || []).map(b => b.trim()).filter(b => b !== '').sort((a, b) => a.localeCompare(b, 'id'));
      if (sorted.length === 0) return '<w:p/>';
      return sorted.map(entry => {
        return `<w:p><w:pPr><w:spacing w:before="240" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="720" w:hanging="720"/><w:jc w:val="both"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(entry)}</w:t></w:r></w:p>`;
      }).join('');
    }

    function buildTocTableXml(tocEntries) {
      let rowsXml = '';
      tocEntries.forEach(item => {
        const isLvl1 = item.level === 1;
        const leftPadTwips = item.level === 1 ? 0 : (item.level === 2 ? 360 : 720);
        const leaderText = buildTocLeaderLineDocx(item.title, item.level);
        const boldTag = isLvl1 ? '<w:b/><w:bCs/>' : '';
        rowsXml += `
          <w:tr>
            <w:tc>
              <w:tcPr>
                <w:tcW w:w="7120" w:type="dxa"/>
                <w:tcMar>
                  <w:top w:w="${isLvl1 ? 80 : 20}" w:type="dxa"/>
                  <w:left w:w="${leftPadTwips}" w:type="dxa"/>
                  <w:bottom w:w="40" w:type="dxa"/>
                  <w:right w:w="80" w:type="dxa"/>
                </w:tcMar>
              </w:tcPr>
              <w:p>
                <w:pPr>
                  <w:spacing w:before="0" w:after="0" w:line="276" w:lineRule="auto"/>
                  <w:jc w:val="left"/>
                </w:pPr>
                <w:r>
                  <w:rPr>
                    <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                    ${boldTag}
                    <w:sz w:val="24"/>
                    <w:szCs w:val="24"/>
                  </w:rPr>
                  <w:t xml:space="preserve">${escapeXml(leaderText)}</w:t>
                </w:r>
              </w:p>
            </w:tc>
            <w:tc>
              <w:tcPr>
                <w:tcW w:w="720" w:type="dxa"/>
                <w:tcMar>
                  <w:top w:w="${isLvl1 ? 80 : 20}" w:type="dxa"/>
                  <w:left w:w="0" w:type="dxa"/>
                  <w:bottom w:w="40" w:type="dxa"/>
                  <w:right w:w="0" w:type="dxa"/>
                </w:tcMar>
              </w:tcPr>
              <w:p>
                <w:pPr>
                  <w:spacing w:before="0" w:after="0" w:line="276" w:lineRule="auto"/>
                  <w:jc w:val="right"/>
                </w:pPr>
                <w:r>
                  <w:rPr>
                    <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                    ${boldTag}
                    <w:sz w:val="24"/>
                    <w:szCs w:val="24"/>
                  </w:rPr>
                  <w:t>${escapeXml(item.page)}</w:t>
                </w:r>
              </w:p>
            </w:tc>
          </w:tr>`;
      });

      return `<w:tbl>
        <w:tblPr>
          <w:tblW w:w="7840" w:type="dxa"/>
          <w:tblBorders>
            <w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            <w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            <w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            <w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            <w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>
            <w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>
          </w:tblBorders>
        </w:tblPr>
        <w:tblGrid>
          <w:gridCol w:w="7120"/>
          <w:gridCol w:w="720"/>
        </w:tblGrid>
        ${rowsXml}
      </w:tbl>`;
    }

    function replaceParagraphByTag(xmlStr, tagLiteral, replacementXml) {
      const escapedTag = tagLiteral.replace('<', '&lt;').replace('>', '&gt;');
      const regex = new RegExp('<w:p\\b[^>]*>(?:(?!<\\/w:p>)[\\s\\S])*?' + escapedTag + '(?:(?!<\\/w:p>)[\\s\\S])*?<\\/w:p>', 'g');
      return xmlStr.replace(regex, replacementXml);
    }

    const authors = data.penulis || [];
    const inlineTags = {
      '&lt;Judul&gt;': escapeXml(data.judul || ''),
      '&lt;MataKuliah&gt;': escapeXml(data.mataKuliah || ''),
      '&lt;Dosen&gt;': escapeXml(data.dosen || ''),
      '&lt;Kelompok&gt;': escapeXml(data.kelompok || ''),
      '&lt;Fakultas&gt;': escapeXml((data.fakultas || '').toUpperCase()),
      '&lt;Prodi&gt;': escapeXml((data.prodi || '').toUpperCase()),
      '&lt;Kota&gt;': escapeXml((data.kota || 'JEMBER').toUpperCase()),
      '&lt;BulanTahun&gt;': escapeXml((data.bulanTahun || '').toUpperCase())
    };

    for (let i = 0; i < 10; i++) {
      const idx = i + 1;
      inlineTags['&lt;Nama' + idx + '&gt;'] = escapeXml(authors[i] ? (authors[i].nama || '') : '');
      inlineTags['&lt;Nim' + idx + '&gt;'] = escapeXml(authors[i] ? (authors[i].nim || '') : '');
    }

    Object.keys(inlineTags).forEach(k => {
      docXml = docXml.split(k).join(inlineTags[k]);
    });

    docXml = replaceParagraphByTag(docXml, '<Kata Pengantar>', buildParagraphsBlockXml(data.kataPengantar || '', 0));
    docXml = replaceParagraphByTag(docXml, '<KataPengantar>', buildParagraphsBlockXml(data.kataPengantar || '', 0));
    docXml = replaceParagraphByTag(docXml, '<DaftarIsi>', buildTocTableXml(layout.tocEntries));
    docXml = replaceParagraphByTag(docXml, '<LatarBelakang>', buildParagraphsBlockXml(data.latarBelakang || '', 0));
    docXml = replaceParagraphByTag(docXml, '<RumusanMasalah>', buildListBlockXml(data.rumusanMasalah || [], true));

    if (data.useTujuan && data.tujuanPenulisan && data.tujuanPenulisan.length > 0) {
      docXml = replaceParagraphByTag(docXml, '<TujuanPenulisan>', buildListBlockXml(data.tujuanPenulisan, true));
    } else {
      const rmHeadingRegex = /<w:p\b[^>]*>(?:(?!<\/w:p>)[\s\S])*?Tujuan Penulisan(?:(?!<\/w:p>)[\s\S])*?<\/w:p>/g;
      docXml = docXml.replace(rmHeadingRegex, '');
      docXml = replaceParagraphByTag(docXml, '<TujuanPenulisan>', '');
    }

    docXml = replaceParagraphByTag(docXml, '<Pembahasan>', buildBab2BlockXml(data.pembahasan || []));

    const kesimpulanHeadingXml = `<w:p><w:pPr><w:spacing w:before="160" w:after="80" w:line="360" w:lineRule="auto"/><w:ind w:left="0" w:firstLine="0"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>A. Kesimpulan</w:t></w:r></w:p>`;
    docXml = replaceParagraphByTag(docXml, '<Kesimpulan>', kesimpulanHeadingXml + buildParagraphsBlockXml(data.kesimpulan || '', 0));

    if (data.useSaran && data.saran && data.saran.trim() !== '') {
      const saranHeadingXml = `<w:p><w:pPr><w:spacing w:before="160" w:after="80" w:line="360" w:lineRule="auto"/><w:ind w:left="0" w:firstLine="0"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>B. Saran</w:t></w:r></w:p>`;
      docXml = replaceParagraphByTag(docXml, '<Saran>', saranHeadingXml + buildParagraphsBlockXml(data.saran, 0));
    } else {
      docXml = replaceParagraphByTag(docXml, '<Saran>', '');
    }

    docXml = replaceParagraphByTag(docXml, '<DaftarPustaka>', buildBibliographyBlockXml(data.daftarPustaka || []));

    let secIdx = 0;
    docXml = docXml.replace(/<w:sectPr\b[^>]*>[\s\S]*?<\/w:sectPr>/g, () => {
      secIdx++;
      const mar = `<w:pgSz w:w="11906" w:h="16838" w:code="9"/><w:pgMar w:top="2268" w:right="1701" w:bottom="1701" w:left="2268" w:header="720" w:footer="709" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/>`;
      if (secIdx === 1) {
        return `<w:sectPr><w:headerReference w:type="default" r:id="rId13"/><w:footerReference w:type="default" r:id="rId12"/>${mar}</w:sectPr>`;
      }
      if (secIdx === 2) {
        return `<w:sectPr><w:headerReference w:type="default" r:id="rId13"/><w:footerReference w:type="default" r:id="rId9"/><w:pgNumType w:fmt="lowerRoman" w:start="1"/>${mar}</w:sectPr>`;
      }
      if (secIdx === 3) {
        return `<w:sectPr><w:headerReference w:type="default" r:id="rId13"/><w:footerReference w:type="default" r:id="rId10"/><w:pgNumType w:fmt="lowerRoman"/>${mar}</w:sectPr>`;
      }
      if (secIdx === 4) {
        return `<w:sectPr><w:headerReference w:type="default" r:id="rId11"/><w:footerReference w:type="default" r:id="rId12"/><w:headerReference w:type="first" r:id="rId13"/><w:footerReference w:type="first" r:id="rId14"/><w:pgNumType w:fmt="decimal" w:start="1"/><w:titlePg/>${mar}</w:sectPr>`;
      }
      return `<w:sectPr><w:headerReference w:type="default" r:id="rId11"/><w:footerReference w:type="default" r:id="rId12"/><w:headerReference w:type="first" r:id="rId13"/><w:footerReference w:type="first" r:id="rId14"/><w:pgNumType w:fmt="decimal"/><w:titlePg/>${mar}</w:sectPr>`;
    });

    zip.file('word/document.xml', docXml);

    let footnotesXml = await zip.file('word/footnotes.xml').async('string');
    let extraFnXml = '';
    footnoteEntries.forEach(item => {
      extraFnXml += `<w:footnote w:id="${item.id}"><w:p><w:pPr><w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/><w:ind w:left="0" w:firstLine="720"/><w:jc w:val="both"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:vertAlign w:val="superscript"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:footnoteRef/></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve"> ${escapeXml(item.text)}</w:t></w:r></w:p></w:footnote>`;
    });
    footnotesXml = footnotesXml.replace('</w:footnotes>', extraFnXml + '</w:footnotes>');
    zip.file('word/footnotes.xml', footnotesXml);

    const footerCenterPageXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
      <w:fldSimple w:instr="PAGE"/>
    </w:r>
  </w:p>
</w:ftr>`;

    const footerEmptyXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p/>
</w:ftr>`;

    const headerRightPageXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:jc w:val="right"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
      <w:fldSimple w:instr="PAGE"/>
    </w:r>
  </w:p>
</w:hdr>`;

    const headerEmptyXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p/>
</w:hdr>`;

    zip.file('word/footer1.xml', footerCenterPageXml);
    zip.file('word/footer2.xml', footerCenterPageXml);
    zip.file('word/footer3.xml', footerEmptyXml);
    zip.file('word/footer4.xml', footerCenterPageXml);
    zip.file('word/header1.xml', headerRightPageXml);
    zip.file('word/header2.xml', headerEmptyXml);

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
