
// ===========================================================
// ENGINE — satu tugas: terima id, cari di workflow.json, suruh
// renderer menampilkannya. Engine TIDAK tahu isi sidang dan
// TIDAK tahu Supabase.
// ===========================================================

import { fetchJSON, dataURL } from './utils.js';
import { renderStep, renderEmptyState } from './renderer.js';

let workflow = null;
let actors = null;
let settings = null;
let config = null;
let currentId = null;
let statusValidationLogged = false;

function normalizeStatusKey(value) {
    return String(value ?? '').trim().toLowerCase();
}

function validateWorkflowStatuses() {
    if (!workflow || !config || statusValidationLogged) return;

    const legend = config.statusLegend || {};
    const unknown = [];

    (workflow.steps || []).forEach((step) => {
        const key = normalizeStatusKey(step.status);
        if (!key) return;
        if (!legend[key]) {
            unknown.push(`step ${step.id} (${step.judul}): "${step.status}"`);
        }
    });

    if (unknown.length) {
        console.error('[engine.js] Status tidak dikenal di workflow.json:', unknown.join(' | '));
    }

    statusValidationLogged = true;
}

export async function loadWorkflow() {
    if (workflow) return workflow;
    [workflow, actors, settings, config] = await Promise.all([
        fetchJSON(dataURL('workflow.json')),
        fetchJSON(dataURL('actors.json')).catch(() => ({ actors: [] })),
        fetchJSON(dataURL('settings.json')).catch(() => ({})),
        fetchJSON(dataURL('config.json')).catch(() => ({}))
    ]);
    validateWorkflowStatuses();
    return workflow;
}

export function getSteps() {
    return workflow ? workflow.steps : [];
}

export function getActors() {
    return actors ? actors.actors : [];
}

export function getConfig() {
    return config || {};
}

export function findStep(id) {
    return getSteps().find((s) => s.id === Number(id)) || null;
}

export function getCurrentId() {
    return currentId;
}

/**
 * render(id) — inti dari engine. null / undefined berarti tidak ada step.
 * Angka 0 valid, karena workflow memang boleh punya step 0.
 */
export function render(id) {
    currentId = id;
    const step = id === null || id === undefined ? null : findStep(id);

    if (!step) {
        renderEmptyState({ totalSteps: getSteps().length, config: getConfig() });
        return;
    }

    const index = getSteps().findIndex((s) => s.id === step.id);
    renderStep(step, {
        actors: getActors(),
        settings: settings || {},
        config: getConfig(),
        index,
        total: getSteps().length,
        steps: getSteps()
    });
}
