// ===========================================================
// AUTH — login & penjagaan akses admin lewat Supabase Auth.
// ===========================================================

import { getClient } from './supabase.js';

export async function login(email, password) {
    const client = await getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function logout() {
    const client = await getClient();
    await client.auth.signOut();
}

export async function getSession() {
    const client = await getClient();
    const { data } = await client.auth.getSession();
    return data.session;
}

/**
 * requireAuth() — panggil di admin.html. Redirect ke login.html
 * jika belum login.
 */
export async function requireAuth(redirectTo = '../login.html') {
    const session = await getSession();
    if (!session) {
        window.location.href = redirectTo;
        return null;
    }
    return session;
}
