// ===========================================================
// ADMIN — tombol dashboard Majelis. Hanya mengubah angka
// current_step di Supabase, tidak pernah menyimpan isi sidang.
// ===========================================================

import { getClient, getConfig } from './supabase.js';
import { requireAuth, logout } from './auth.js';
import { loadWorkflow, getSteps } from './engine.js';
import { subscribe, fetchCurrentState } from './realtime.js';
import { qs, qsa, el, escapeHTML } from './utils.js';

let steps = [];
let currentId = 0;
let confirmAction = null;

function stepIndexById(id) {
    return steps.findIndex((s) => s.id === id);
}

function getStartIndex() {
    return steps.findIndex((s) => s.id > 0);
}

async function writeState(patch) {
    const client = await getClient();
    const cfg = await getConfig();
    const { error } = await client
        .from(cfg.table.sessionState)
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', cfg.sessionId);
    if (error) alert('Gagal memperbarui state: ' + error.message);
}

async function goToStep(targetId) {
    if (targetId === 0) {
        await writeState({ current_step: 0, status: 'waiting' });
        return;
    }

    await writeState({ current_step: targetId, status: 'active' });
}

async function goMulai() {
    const startIdx = getStartIndex();
    if (startIdx === -1) return;
    await goToStep(steps[startIdx].id);
}

async function goSebelumnya() {
    const idx = stepIndexById(currentId);
    if (idx <= 0) return;
    await goToStep(steps[idx - 1].id);
}

async function goLanjut() {
    const idx = stepIndexById(currentId);
    if (idx === -1) return goMulai();
    if (idx >= steps.length - 1) return;
    await goToStep(steps[idx + 1].id);
}

async function goSelesai() {
    if (!steps.length) return;
    await writeState({ current_step: steps[steps.length - 1].id, status: 'done' });
}

function askConfirm(title, desc, action) {
    confirmAction = action;
    qs('#dialog-title').textContent = title;
    qs('#dialog-desc').textContent = desc;
    qs('#dialog-overlay').removeAttribute('hidden');
}

function closeDialog() {
    qs('#dialog-overlay').setAttribute('hidden', '');
    confirmAction = null;
}

function renderStepList() {
    const list = qs('#step-list');
    qsa('.step-row', list).forEach((row) => row.remove());
    steps.forEach((s, i) => {
        const classes = ['step-row'];
        if (s.id === currentId) classes.push('active');
        if (s.gaya === 'spesial') classes.push('spesial');
        const row = el('div', classes.join(' '));
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.title = 'Klik untuk lompat ke node ini';
        row.innerHTML = `<span class="num">${i + 1}</span><span class="judul">${escapeHTML(s.judul)}</span><span class="aktor">${escapeHTML(s.aktor || '')}</span>`;

        const jump = async () => {
            if (s.id === currentId) return;
            await goToStep(s.id);
        };

        row.addEventListener('click', jump);
        row.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                jump();
            }
        });

        list.appendChild(row);
    });
}

function renderControlPanel() {
    const idx = stepIndexById(currentId);
    const step = idx >= 0 ? steps[idx] : null;
    const startIdx = getStartIndex();

    const tag = step && step.gaya === 'spesial' ? '<span class="tag-spesial">Penting</span>' : '';
    qs('#current-label').innerHTML = `<span>${step ? 'Node aktif' : 'Belum Dimulai'}</span>${tag}`;
    qs('#current-title').textContent = step ? step.judul : 'Sidang belum dimulai';

    qs('#btn-sebelumnya').disabled = idx <= 0;
    qs('#btn-lanjut').disabled = idx === -1 ? false : idx >= steps.length - 1;
    qs('#btn-mulai').disabled = startIdx === -1 || idx === startIdx;
}

function onStateChange(state) {
    currentId = state?.current_step ?? 0;
    renderControlPanel();
    renderStepList();
}

function wireButtons() {
    qs('#btn-mulai').addEventListener('click', goMulai);
    qs('#btn-sebelumnya').addEventListener('click', goSebelumnya);
    qs('#btn-lanjut').addEventListener('click', goLanjut);
    qs('#btn-selesai').addEventListener('click', () =>
        askConfirm('Selesaikan Sidang?', 'Tahap akan langsung berpindah ke tahap terakhir dan status ditandai selesai.', goSelesai));
    qs('#btn-reset').addEventListener('click', () =>
        askConfirm('Reset Sidang?', 'current_step akan dikembalikan ke tahap 0. Tindakan ini tidak menghapus workflow.json.', () => writeState({ current_step: 0, status: 'waiting' })));

    qs('#dialog-cancel').addEventListener('click', closeDialog);
    qs('#dialog-confirm').addEventListener('click', async () => {
        if (confirmAction) await confirmAction();
        closeDialog();
    });

    qs('#btn-logout').addEventListener('click', async () => {
        await logout();
        window.location.href = '../login.html';
    });
}

async function init() {
    const session = await requireAuth();
    if (!session) return;

    qs('#who-label').textContent = session.user.email;

    await loadWorkflow();
    steps = getSteps();
    renderStepList();

    try {
        const initial = await fetchCurrentState();
        onStateChange(initial);
    } catch (err) {
        console.warn('[admin.js] Gagal mengambil state awal:', err.message);
    }

    wireButtons();
    await subscribe(onStateChange);
}

init();
