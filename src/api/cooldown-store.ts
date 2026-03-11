export interface CooldownState {
  key: string;
  retryAt: number;
}

function parseRetryAfter(retryAfter: string | null | undefined) {
  if (!retryAfter) {
    return 0;
  }

  const asSeconds = Number.parseInt(retryAfter, 10);
  if (!Number.isNaN(asSeconds)) {
    return Math.max(asSeconds, 0) * 1000;
  }

  const asDate = Date.parse(retryAfter);
  if (Number.isNaN(asDate)) {
    return 0;
  }

  return Math.max(asDate - Date.now(), 0);
}

class CooldownStore {
  private readonly entries = new Map<string, number>();

  set(key: string, waitMs: number) {
    if (!key || waitMs <= 0) {
      return;
    }

    this.entries.set(key, Date.now() + waitMs);
  }

  captureRetryAfter(key: string, retryAfterHeader: string | null | undefined) {
    const waitMs = parseRetryAfter(retryAfterHeader);
    this.set(key, waitMs);
  }

  getRemainingMs(key: string) {
    const retryAt = this.entries.get(key);
    if (!retryAt) {
      return 0;
    }

    const remaining = retryAt - Date.now();
    if (remaining <= 0) {
      this.entries.delete(key);
      return 0;
    }

    return remaining;
  }

  getState(key: string): CooldownState | null {
    const retryAt = this.entries.get(key);
    if (!retryAt) {
      return null;
    }

    if (retryAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return { key, retryAt };
  }

  clear() {
    this.entries.clear();
  }
}

export const cooldownStore = new CooldownStore();
