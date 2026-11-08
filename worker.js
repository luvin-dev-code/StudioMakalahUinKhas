const DEFAULT_TEMPLATE_DOC_ID = '1qRFHkEJK-idMC7i5UyZgI7-ZylCXF13_ITStCwku3y0';
const DEFAULT_AI_API_KEY = 'AQ.Ab8RN6KNqySP0HSaTRE8Zld0jnjwFR_6gclhTc9Zyy6EMK622w';
const ADMIN_PASSWORD = '010506';

const GEMINI_MODEL_OPTIONS = [
  { label: 'Gemini 3.8 Flash', value: 'gemini-3.8-flash' },
  { label: 'Gemini 3.7 Flash', value: 'gemini-3.7-flash' },
  { label: 'Gemini 3.6 Flash', value: 'gemini-3.6-flash' },
  { label: 'Gemini 3.5 Flash-Lite', value: 'gemini-3.5-flash-lite' },
  { label: 'Gemini 3.1 Flash-Lite', value: 'gemini-3.1-flash-lite' },
  { label: 'Gemini 3 Flash Preview', value: 'gemini-3-flash-preview' },
  { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
  { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
  { label: 'Gemini 2.5 Flash-Lite', value: 'gemini-2.5-flash-lite' },
  { label: 'Gemini 2.5 Flash Preview TTS', value: 'gemini-2.5-flash-preview-tts' },
  { label: 'Gemini 2.5 Pro Preview TTS', value: 'gemini-2.5-pro-preview-tts' }
];

const memStore = {
  ADMIN_API_KEYS: JSON.stringify([DEFAULT_AI_API_KEY]),
  ADMIN_ACTIVE_API_KEY: DEFAULT_AI_API_KEY,
  ADMIN_TEMPLATE_DOC_ID: DEFAULT_TEMPLATE_DOC_ID,
  ADMIN_GEMINI_MODEL: 'gemini-2.5-flash',
  ADMIN_MAKALAH_FILES: '[]'
};

async function getStorage(env, key) {
  const kv = env ? (env.MAKALAH_KV || env.KV) : null;
  if (kv) {
    try {
      const val = await kv.get(key);
      if (val !== null) return val;
    } catch (e) {}
  }
  return memStore[key] !== undefined ? memStore[key] : null;
}

async function putStorage(env, key, val) {
  memStore[key] = String(val);
  const kv = env ? (env.MAKALAH_KV || env.KV) : null;
  if (kv) {
    try {
      await kv.put(key, String(val));
    } catch (e) {}
  }
}

async function getSystemConfig(env) {
  let apiKeys = [];
  try {
    const rawKeys = await getStorage(env, 'ADMIN_API_KEYS');
    if (rawKeys) apiKeys = JSON.parse(rawKeys);
  } catch (e) {
    apiKeys = [];
  }
  if (!Array.isArray(apiKeys) || apiKeys.length === 0) {
    apiKeys = [DEFAULT_AI_API_KEY];
    await putStorage(env, 'ADMIN_API_KEYS', JSON.stringify(apiKeys));
  }
  let activeApiKey = await getStorage(env, 'ADMIN_ACTIVE_API_KEY');
  if (!activeApiKey || apiKeys.indexOf(activeApiKey) === -1) {
    activeApiKey = apiKeys[0] || DEFAULT_AI_API_KEY;
    await putStorage(env, 'ADMIN_ACTIVE_API_KEY', activeApiKey);
  }
  const templateDocId = (await getStorage(env, 'ADMIN_TEMPLATE_DOC_ID')) || DEFAULT_TEMPLATE_DOC_ID;
  const activeModel = (await getStorage(env, 'ADMIN_GEMINI_MODEL')) || 'gemini-2.5-flash';
  return {
    apiKeys,
    activeApiKey,
    templateDocId,
    activeModel,
    modelOptions: GEMINI_MODEL_OPTIONS
  };
}

function verifyAdminPassword(pw) {
  if (String(pw || '').trim() !== ADMIN_PASSWORD) {
    throw new Error('Password Admin Panel tidak valid!');
  }
}

async function listMakalahFiles(env) {
  try {
    const raw = await getStorage(env, 'ADMIN_MAKALAH_FILES');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      }
    }
  } catch (e) {}
  return [];
}

async function recordMakalahFile(env, fileObj) {
  try {
    let list = await listMakalahFiles(env);
    list = list.filter(item => item && item.docId !== fileObj.docId);
    list.unshift({
      docId: fileObj.docId,
      fileName: fileObj.fileName,
      createdAt: new Date().toISOString()
    });
    if (list.length > 150) list = list.slice(0, 150);
    await putStorage(env, 'ADMIN_MAKALAH_FILES', JSON.stringify(list));
  } catch (e) {}
}

async function deleteMakalahFile(env, docId) {
  let list = await listMakalahFiles(env);
  list = list.filter(item => item && item.docId !== docId);
  await putStorage(env, 'ADMIN_MAKALAH_FILES', JSON.stringify(list));
  return list;
}

async function getAvailableFlashModel(apiKey) {
  try {
    const listUrl = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey;
    const res = await fetch(listUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        const supported = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.indexOf('generateContent') !== -1);
        const flash3 = supported.find(m => m.name.indexOf('gemini-3') !== -1 && m.name.indexOf('flash') !== -1);
        if (flash3) return flash3.name.replace('models/', '');
        const flash25 = supported.find(m => m.name.indexOf('gemini-2.5-flash') !== -1);
        if (flash25) return flash25.name.replace('models/', '');
        const anyGemini = supported.find(m => m.name.indexOf('gemini') !== -1);
        if (anyGemini) return anyGemini.name.replace('models/', '');
      }
    }
  } catch (e) {}
  return 'gemini-2.5-flash';
}

async function generateSmartContent(env, payload) {
  const sysConfig = await getSystemConfig(env);
  const cleanKey = (sysConfig.activeApiKey || DEFAULT_AI_API_KEY || '').trim();
  if (!cleanKey || cleanKey === 'ISI_DENGAN_API_KEY_ANDA') {
    throw new Error('Konfigurasi API Key AI belum diatur pada Admin Panel.');
  }
  const prompt = `Anda adalah penulis akademik di UIN Kiai Haji Achmad Siddiq (UIN KHAS) Jember.
Buat draf makalah akademik terstruktur berbahasa Indonesia berdasarkan parameter berikut:
Judul Makalah: ${payload.judul}
Mata Kuliah: ${payload.mataKuliah}
Sertakan Tujuan Penulisan: ${payload.useTujuan ? 'Ya' : 'Tidak'}
Sertakan Saran: ${payload.useSaran ? 'Ya' : 'Tidak'}

Aturan Akademik:
1. Bagian Latar Belakang minimal terdiri dari 3 paragraf dengan landasan teoretis dan praktis.
2. Kutipan dalam teks wajib diletakkan di akhir kalimat menggunakan format catatan kaki (footnote) Chicago Manual of Style (CMOS) Edisi ke-17 dengan tag: ^[Nama Depan Nama Belakang, Judul Buku/Jurnal (Kota: Penerbit, Tahun), halaman spesifik.]. Contoh: ^[Achmad Siddiq, Pemikiran Pendidikan Islam (Jember: IAIN Jember Press, 2018), 45.].
3. Di dalam catatan kaki wajib menyebutkan nomor halaman spesifik yang dikutip.
4. Jika kutipan langsung terdiri dari 5 baris atau lebih, awali paragraf dengan [BLOCKQUOTE].
5. Daftar Pustaka wajib menggunakan format Chicago Manual of Style (CMOS) Edisi ke-17 dan wajib mencantumkan rentang halaman untuk bagian buku (bab) atau artikel jurnal (contoh: 40-58).

Kembalikan HANYA JSON murni yang sesuai dengan struktur berikut:
{
  "kataPengantar": "Paragraf kata pengantar dipisahkan dengan \\n",
  "latarBelakang": "Paragraf latar belakang dipisahkan dengan \\n",
  "rumusanMasalah": ["Pertanyaan rumusan masalah 1?", "Pertanyaan rumusan masalah 2?"],
  "tujuanPenulisan": ["Tujuan penulisan 1", "Tujuan penulisan 2"],
  "pembahasan": [
    {
      "judulSub": "Judul sub-bab (tanpa awalan A/B)",
      "isiSub": "Paragraf pengantar sub-bab (opsional)",
      "subPoin": [
        {
          "judulPoin": "Judul anak sub-bab (tanpa awalan 1/2)",
          "isiPoin": "Uraian pembahasan mendalam dilengkapi catatan kaki CMOS Edisi ke-17 di akhir kalimat dengan halaman spesifik ^[...]"
        }
      ]
    }
  ],
  "kesimpulan": "Paragraf kesimpulan dipisahkan dengan \\n",
  "saran": "Paragraf saran dipisahkan dengan \\n",
  "daftarPustaka": ["Nama Belakang, Nama Depan. \\"Judul Bab atau Artikel.\\" Dalam Judul Buku/Jurnal, Nomor Volume (Tahun): rentang halaman. Kota: Penerbit."]
}`;

  const selectedModel = (sysConfig.activeModel || 'gemini-2.5-flash').trim();
  const candidateModels = [
    selectedModel,
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    await getAvailableFlashModel(cleanKey)
  ];
  const uniqueModels = [];
  candidateModels.forEach(m => {
    if (m && uniqueModels.indexOf(m) === -1) uniqueModels.push(m);
  });

  let lastError = 'Gagal menghasilkan konten AI.';
  for (let i = 0; i < uniqueModels.length; i++) {
    const modelName = uniqueModels[i];
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + cleanKey;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4
          }
        })
      });
      const resJson = await response.json();
      if (response.ok && resJson.candidates && resJson.candidates.length > 0) {
        const rawOutput = resJson.candidates[0].content.parts[0].text;
        const cleanedJson = rawOutput.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return JSON.parse(cleanedJson);
      }
      if (resJson.error && resJson.error.message) {
        lastError = resJson.error.message;
      }
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error(lastError);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function errorResponse(err, status = 500) {
  const msg = typeof err === 'string' ? err : (err.message || 'Terjadi kesalahan sistem.');
  return jsonResponse({ error: msg }, status);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const path = url.pathname.replace(/\/api$/, '').replace(/^\/api/, '');

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    if (request.method !== 'POST') {
      return errorResponse('Method Not Allowed', 405);
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    try {
      if (path === '/admin/data') {
        verifyAdminPassword(body.password);
        const config = await getSystemConfig(env);
        const files = await listMakalahFiles(env);
        return jsonResponse({ config, files });
      }

      if (path === '/admin/config') {
        verifyAdminPassword(body.password);
        const newConfig = body.newConfig || {};
        if (Array.isArray(newConfig.apiKeys)) {
          const cleanedKeys = newConfig.apiKeys
            .map(k => String(k || '').trim())
            .filter((k, idx, arr) => k !== '' && arr.indexOf(k) === idx);
          if (cleanedKeys.length === 0) cleanedKeys.push(DEFAULT_AI_API_KEY);
          await putStorage(env, 'ADMIN_API_KEYS', JSON.stringify(cleanedKeys));
        }
        if (newConfig.activeApiKey) {
          const activeKey = String(newConfig.activeApiKey).trim();
          await putStorage(env, 'ADMIN_ACTIVE_API_KEY', activeKey);
          let currentList = [];
          try {
            currentList = JSON.parse((await getStorage(env, 'ADMIN_API_KEYS')) || '[]');
          } catch (e) {
            currentList = [];
          }
          if (currentList.indexOf(activeKey) === -1) {
            currentList.push(activeKey);
            await putStorage(env, 'ADMIN_API_KEYS', JSON.stringify(currentList));
          }
        }
        if (newConfig.templateDocId) {
          await putStorage(env, 'ADMIN_TEMPLATE_DOC_ID', String(newConfig.templateDocId).trim());
        }
        if (newConfig.activeModel) {
          await putStorage(env, 'ADMIN_GEMINI_MODEL', String(newConfig.activeModel).trim());
        }
        return jsonResponse(await getSystemConfig(env));
      }

      if (path === '/admin/apikey/add') {
        verifyAdminPassword(body.password);
        const cleanKey = String(body.newKey || '').trim();
        if (!cleanKey) throw new Error('API Key tidak boleh kosong.');
        const config = await getSystemConfig(env);
        const keys = config.apiKeys || [];
        if (keys.indexOf(cleanKey) === -1) keys.push(cleanKey);
        await putStorage(env, 'ADMIN_API_KEYS', JSON.stringify(keys));
        await putStorage(env, 'ADMIN_ACTIVE_API_KEY', cleanKey);
        return jsonResponse(await getSystemConfig(env));
      }

      if (path === '/admin/apikey/remove') {
        verifyAdminPassword(body.password);
        const targetKey = String(body.targetKey || '').trim();
        const config = await getSystemConfig(env);
        const keys = (config.apiKeys || []).filter(k => k !== targetKey);
        if (keys.length === 0) {
          throw new Error('Minimal harus ada 1 API Key yang tersimpan di dalam daftar.');
        }
        await putStorage(env, 'ADMIN_API_KEYS', JSON.stringify(keys));
        if (config.activeApiKey === targetKey) {
          await putStorage(env, 'ADMIN_ACTIVE_API_KEY', keys[0]);
        }
        return jsonResponse(await getSystemConfig(env));
      }

      if (path === '/admin/files/delete') {
        verifyAdminPassword(body.password);
        const docId = String(body.docId || '').trim();
        if (!docId) throw new Error('ID File tidak valid.');
        const updatedFiles = await deleteMakalahFile(env, docId);
        return jsonResponse(updatedFiles);
      }

      if (path === '/ai/generate') {
        const resData = await generateSmartContent(env, body);
        return jsonResponse(resData);
      }

      if (path === '/makalah/build') {
        const kelompok = String(body.kelompok || 'Kelompok').trim();
        const mk = String(body.mataKuliah || 'Mata Kuliah').trim();
        const fileName = (kelompok + ' ' + mk).trim();
        const docId = 'MAK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const fileObj = {
          docId,
          fileName,
          createdAt: new Date().toISOString()
        };
        await recordMakalahFile(env, fileObj);
        return jsonResponse(fileObj);
      }

      return errorResponse('Endpoint Not Found', 404);
    } catch (err) {
      return errorResponse(err, 500);
    }
  }
};
