/*
 * ═══════════════════════════════════════════════════════════
 *  SITE ACCESS — change MODE here when the site is ready
 * ═══════════════════════════════════════════════════════════
 *
 * FULL        develop/test everything
 * PRERELEASE  homepage + player; Track 1 only; hidden layers dark (live)
 * UNLOCKED    full site for every visitor (no code required)
 *
 * In PRERELEASE, a visitor who already unlocked on this browser
 * is treated as UNLOCKED. Verification is plugged in via
 * SiteAccess.setVerifier(fn) — do not put real codes in this file.
 */

window.SiteAccess = (() => {
  const MODE = 'PRERELEASE';
  const STORAGE_KEY = 'wc-site-access';

  function configuredMode() {
    return MODE;
  }

  function readPersistedUnlock() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'unlocked';
    } catch {
      return false;
    }
  }

  function persistUnlock() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'unlocked');
    } catch {
      /* ignore quota / private mode */
    }
  }

  function mode() {
    if (MODE === 'FULL' || MODE === 'UNLOCKED') return MODE;
    if (readPersistedUnlock()) return 'UNLOCKED';
    return 'PRERELEASE';
  }

  function isOpen() {
    const current = mode();
    return current === 'FULL' || current === 'UNLOCKED';
  }

  function allows(feature) {
    if (isOpen()) return true;
    return feature === 'home' || feature === 'player' || feature === 'unlock';
  }

  function canPlayTrack(index) {
    if (isOpen()) return true;
    return Number(index) === 0;
  }

  const UNLOCK_HASH = 'c4ec6eceba5cbb8a0fcb87814000c76014735d15272644c01286704fc70ca2e5';

  function normalizeCode(code) {
    return String(code || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  async function hashCode(code) {
    const data = new TextEncoder().encode(normalizeCode(code));
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  let verifier = async function verifyAccessCode(code) {
    const hash = await hashCode(code);
    return { ok: hash === UNLOCK_HASH };
  };

  function setVerifier(fn) {
    if (typeof fn === 'function') verifier = fn;
  }

  async function submitCode(code) {
    const result = await verifier(String(code || '').trim());
    if (result && result.ok) persistUnlock();
    return result || { ok: false };
  }

  return {
    configuredMode,
    mode,
    isOpen,
    allows,
    canPlayTrack,
    setVerifier,
    submitCode,
    isUnlocked: readPersistedUnlock
  };
})();
