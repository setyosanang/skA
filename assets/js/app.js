
// ===========================================================
// APP — entry point halaman publik. Menyatukan engine + realtime.
// ===========================================================

import { loadWorkflow, render, getCurrentId } from './engine.js';
import { subscribe, fetchCurrentState } from './realtime.js';
import { Storage } from './storage.js';

function applyState(state) {
    if (!state) return;
    const nextId = state.current_step ?? 0;
    if (nextId === getCurrentId()) return; // hindari render ulang yang sama
    Storage.set('lastState', state);
    render(nextId);
}

async function init() {
    await loadWorkflow();

    // Tampilkan cache lokal dulu (jika ada) agar tidak kosong saat memuat
    const cached = Storage.get('lastState');
    if (cached) render(cached.current_step ?? 0);
    else render(0);

    try {
        const initial = await fetchCurrentState();
        applyState(initial);
    } catch (err) {
        console.warn('[app.js] Gagal mengambil state awal:', err.message);
    }

    try {
        await subscribe(applyState);
    } catch (err) {
        console.warn('[app.js] Realtime tidak aktif:', err.message);
    }
}

init();
