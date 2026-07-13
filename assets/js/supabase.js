// ===========================================================
// SUPABASE — satu-satunya file yang tahu cara terkoneksi ke Supabase.
// Modul lain hanya memakai getClient()/getConfig(), tidak pernah
// membaca config.json langsung.
// ===========================================================

import { fetchJSON, dataURL } from './utils.js';

let client = null;
let config = null;

export async function getConfig() {
    if (!config) config = await fetchJSON(dataURL('config.json'));
    return config;
}

/**
 * Mengembalikan instance Supabase client (singleton).
 * Membutuhkan script CDN @supabase/supabase-js sudah dimuat
 * sehingga tersedia sebagai window.supabase.
 */
export async function getClient() {
    if (client) return client;
    const cfg = await getConfig();

    if (cfg.supabaseUrl.includes('PLACEHOLDER') || cfg.supabaseAnonKey.includes('PLACEHOLDER')) {
        console.warn('[supabase.js] config.json masih berisi placeholder. Isi supabaseUrl & supabaseAnonKey.');
    }

    if (!window.supabase) {
        throw new Error('Library @supabase/supabase-js belum dimuat. Cek tag <script> CDN di HTML.');
    }

    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return client;
}
