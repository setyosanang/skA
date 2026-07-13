// ===========================================================
// UTILS — helper murni, tidak tahu apa-apa soal Supabase/workflow
// ===========================================================

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

export async function fetchJSON(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Gagal memuat ${path} (${res.status})`);
    return res.json();
}

export function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
}

export function escapeHTML(str = '') {
    return str.replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/**
 * Resolve URL file di assets/data/ relatif terhadap lokasi modul JS
 * (bukan terhadap halaman HTML), supaya path selalu benar baik dipanggil
 * dari index.html (root) maupun admin/admin.html (subfolder).
 */
export function dataURL(filename) {
    return new URL(`../data/${filename}`, import.meta.url).href;
}
