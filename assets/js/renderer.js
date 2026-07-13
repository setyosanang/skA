
// ===========================================================
// RENDERER — mengubah data step menjadi HTML. Tidak tahu
// Supabase, tidak tahu id datang dari mana.
// ===========================================================

import { qs, el, escapeHTML } from './utils.js';

function findActorColor(actorName, actors) {
    const found = actors.find((a) => a.nama === actorName);
    return found ? found.warna : 'var(--primary)';
}

function normalizeStatusKey(value) {
    return String(value ?? '').trim().toLowerCase();
}

function resolveStatusMeta(status, config) {
    const key = normalizeStatusKey(status);
    const legend = config?.statusLegend || {};
    if (!key) return null;
    return legend[key] ? { key, ...legend[key] } : null;
}

function applyHeaderStatus(statusMeta, rawStatus) {
    const statusLabel = qs('#status-label');
    const statusDot = qs('#status-dot');
    if (!statusLabel || !statusDot) return;

    statusDot.className = 'status-dot';

    if (!statusMeta) {
        statusLabel.textContent = rawStatus ? 'Status tidak dikenal' : 'Status tidak tersedia';
        statusDot.classList.add('unknown');
        return;
    }

    statusLabel.textContent = statusMeta.label || statusMeta.key;
    statusDot.classList.add(statusMeta.className || statusMeta.key.replace(/\s+/g, '-'));
}

function buildDots(steps, currentId) {
    const wrap = el('div', 'step-dots');
    const currentIndex = steps.findIndex((s) => s.id === currentId);
    steps.forEach((s, i) => {
        const dot = el('span', 'step-dot' + (s.gaya === 'spesial' ? ' spesial' : ''));
        if (i === currentIndex) dot.classList.add('active');
        else if (i < currentIndex) dot.classList.add('done');
        wrap.appendChild(dot);
    });
    return wrap;
}

export function renderStep(step, { actors, index, total, steps, config }) {
    const stage = qs('#board-stage');
    if (!stage) return;

    const isSpesial = step.gaya === 'spesial';
    stage.classList.toggle('spesial', isSpesial);

    const old = qs('.board-content', stage);
    if (old) old.classList.add('leaving');

    const content = el('div', 'board-content');
    const statusMeta = resolveStatusMeta(step.status, config);

    if (isSpesial) {
        content.appendChild(el('span', 'board-flag', 'Tahap Penting'));
    }

    const title = el('h2', 'board-title', escapeHTML(step.judul));
    const desc = el('p', 'board-desc', escapeHTML(step.deskripsi || ''));

    const meta = el('div', 'board-meta');

    const actorBadge = el('span', 'badge');
    actorBadge.innerHTML = `<span class="dot" style="background:${findActorColor(step.aktor, actors)}"></span><span class="badge-actor">${escapeHTML(step.aktor || '-')}</span>`;
    meta.appendChild(actorBadge);

    if (statusMeta) {
        meta.appendChild(el('span', `badge status-badge status-${statusMeta.className || statusMeta.key.replace(/\s+/g, '-')}`, escapeHTML(statusMeta.label || statusMeta.key)));
    } else if (step.status) {
        console.error(`[renderer.js] Status tidak dikenal pada step ${step.id}: ${step.status}`);
    }

    if (step.pasal) {
        meta.appendChild(el('span', 'badge', escapeHTML(step.pasal)));
    }
    if (step.durasi) {
        meta.appendChild(el('span', 'badge', `⏱ ${escapeHTML(step.durasi)}`));
    }

    content.append(title, desc, meta);

    if (Array.isArray(step.lampiran) && step.lampiran.length) {
        const attach = el('div', 'attachments');
        step.lampiran.forEach((item) => attach.appendChild(el('span', 'attachment-item', escapeHTML(item))));
        content.appendChild(attach);
    }

    const dotsWrap = el('div', 'board-meta');
    dotsWrap.style.marginTop = '1.5rem';
    dotsWrap.appendChild(buildDots(steps, step.id));
    content.appendChild(dotsWrap);

    stage.style.setProperty('--progress', `${((index + 1) / total) * 100}%`);
    stage.appendChild(content);

    if (old) setTimeout(() => old.remove(), 260);

    applyHeaderStatus(statusMeta, step.status);
}

export function renderEmptyState({ totalSteps }) {
    const stage = qs('#board-stage');
    if (!stage) return;

    stage.classList.remove('spesial');

    const old = qs('.board-content', stage);
    if (old) old.remove();

    const content = el('div', 'board-content');
    content.appendChild(el('div', 'board-eyebrow', 'Data Sidang'));
    content.appendChild(el('h2', 'board-title', 'Tahap Tidak Ditemukan'));
    content.appendChild(el('p', 'board-desc', `Data tahap belum dapat ditampilkan. Periksa workflow.json atau current_step. Total ${totalSteps} tahap terdaftar.`));
    stage.style.setProperty('--progress', '0%');
    stage.appendChild(content);

    const statusLabel = qs('#status-label');
    if (statusLabel) {
        statusLabel.textContent = 'Status tidak tersedia';
        qs('#status-dot')?.classList.remove('live', 'waiting', 'pending', 'batal');
        qs('#status-dot')?.classList.add('unknown');
    }
}
