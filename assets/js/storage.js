// ===========================================================
// STORAGE — local cache. Dipakai sebagai fallback saat realtime
// belum menyala / koneksi terputus sebentar.
// ===========================================================

const PREFIX = 'majelis:';

export const Storage = {
    set(key, value) {
        try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (_) {}
    },
    get(key, fallback = null) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (_) { return fallback; }
    },
    remove(key) {
        try { localStorage.removeItem(PREFIX + key); } catch (_) {}
    }
};
