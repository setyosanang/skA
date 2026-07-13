// ===========================================================
// REALTIME — satu-satunya modul yang subscribe ke Supabase
// Realtime. Hanya peduli pada perubahan current_step/status.
// ===========================================================

import { getClient, getConfig } from './supabase.js';

let pollTimer = null;

export async function fetchCurrentState() {
    const client = await getClient();
    const cfg = await getConfig();
    const { data, error } = await client
        .from(cfg.table.sessionState)
        .select('current_step, status, session_name, updated_at')
        .eq('id', cfg.sessionId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * subscribe(onChange) — onChange dipanggil setiap kali current_step
 * atau status berubah. Juga memasang polling ringan sebagai jaring
 * pengaman bila koneksi realtime terputus.
 */
export async function subscribe(onChange) {
    const client = await getClient();
    const cfg = await getConfig();

    const channel = client
        .channel(`session_state_${cfg.sessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: cfg.table.sessionState,
                filter: `id=eq.${cfg.sessionId}`
            },
            (payload) => onChange(payload.new)
        )
        .subscribe();

    startFallbackPolling(onChange);

    return () => {
        client.removeChannel(channel);
        stopFallbackPolling();
    };
}

function startFallbackPolling(onChange) {
    stopFallbackPolling();
    pollTimer = setInterval(async () => {
        try {
            const data = await fetchCurrentState();
            if (data) onChange(data);
        } catch (_) { /* diam saja, biarkan realtime yang utama */ }
    }, 8000);
}

function stopFallbackPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
}
