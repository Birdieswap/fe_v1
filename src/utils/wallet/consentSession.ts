const DONE_KEYS = "__CONSENT_DONE_FOR_KEY__";
const BLOCK_FLAG = "__CONSENT_BLOCKED_UNTIL_SIGN__";

export function addConsentDoneKey(key: string) {
  try {
    const raw = sessionStorage.getItem(DONE_KEYS);
    const obj = raw ? (JSON.parse(raw) as Record<string, true>) : {};
    obj[key] = true;
    sessionStorage.setItem(DONE_KEYS, JSON.stringify(obj));
  } catch {}
}

export function hasConsentDoneKey(key: string): boolean {
  try {
    const raw = sessionStorage.getItem(DONE_KEYS);
    const obj = raw ? (JSON.parse(raw) as Record<string, true>) : {};
    return !!obj[key];
  } catch {
    return false;
  }
}

export function clearConsentDoneKey(key: string) {
  try {
    const raw = sessionStorage.getItem(DONE_KEYS);
    if (!raw) return;
    const obj = JSON.parse(raw) as Record<string, true>;
    if (obj[key]) {
      delete obj[key];
      sessionStorage.setItem(DONE_KEYS, JSON.stringify(obj));
    }
  } catch {}
}

export function setSoftBlock() {
  try {
    sessionStorage.setItem(BLOCK_FLAG, "1");
  } catch {}
}

export function clearSoftBlock() {
  try {
    sessionStorage.removeItem(BLOCK_FLAG);
  } catch {}
}

export function isSoftBlocked(): boolean {
  try {
    return sessionStorage.getItem(BLOCK_FLAG) === "1";
  } catch {
    return false;
  }
}