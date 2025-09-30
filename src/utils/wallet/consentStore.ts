
import type { Consent } from "@/types/consent";

type KVLike = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<unknown>;
};

export interface ConsentStore {
  getLatest(address: string): Promise<Consent | null>;
  save(consent: Consent): Promise<void>;
}

// ---------- InMemory (디폴트: 로컬 개발) ----------
class MemoryConsentStore implements ConsentStore {
  private mem = new Map<string, Consent>();
  async getLatest(address: string): Promise<Consent | null> {
    return this.mem.get(address.toLowerCase()) ?? null;
  }
  async save(c: Consent): Promise<void> {
    this.mem.set(c.address.toLowerCase(), c);
  }
}

// ---------- KV(환경변수 있으면 사용) ----------
class KVConsentStore implements ConsentStore {
  private kv: any;
  constructor(kv: any) { this.kv = kv; }
  key(addr: string) { return `consent:latest:${addr.toLowerCase()}`; }
  async getLatest(address: string): Promise<Consent | null> {
    const json = await this.kv.get(this.key(address));
    if (!json) return null;
    try { return JSON.parse(json) as Consent; } catch { return null; }
  }
  async save(c: Consent): Promise<void> {
    await this.kv.set(this.key(c.address), JSON.stringify(c));
  }
}

// ---------- 팩토리 (런타임 자동 선택) ----------
let _store: ConsentStore | null = null;

export async function getConsentStore(): Promise<ConsentStore> {
  if (_store) return _store;

  const hasKV =
    !!process.env.KV_REST_API_URL &&
    !!process.env.KV_REST_API_TOKEN;

  if (hasKV) {
    try {
      // mod 타입은 our shim 덕분에 최소 보장
      const mod = await import("@vercel/kv");
      if (mod?.kv) {
        _store = new KVConsentStore(mod.kv as any);
        return _store;
      }
    } catch {
      // fall through to memory
    }
  }
  // fallback: 메모리
  _store = new MemoryConsentStore();
  return _store;
}
