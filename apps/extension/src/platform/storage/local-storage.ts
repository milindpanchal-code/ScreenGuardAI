type StorageValue = unknown;

function hasChromeStorage(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

export const localStorageAdapter = {
  async get<T>(key: string, fallback: T): Promise<T> {
    if (hasChromeStorage()) {
      const result = await chrome.storage.local.get(key);
      return key in result ? (result[key] as T) : fallback;
    }

    const item = window.localStorage.getItem(key);
    if (item === null) {
      return fallback;
    }

    try {
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  },

  async set(key: string, value: StorageValue): Promise<void> {
    if (hasChromeStorage()) {
      await chrome.storage.local.set({ [key]: value });
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key: string): Promise<void> {
    if (hasChromeStorage()) {
      await chrome.storage.local.remove(key);
      return;
    }

    window.localStorage.removeItem(key);
  },

  async getBoolean(key: string, fallback: boolean): Promise<boolean> {
    const value = await this.get<unknown>(key, fallback);
    return typeof value === "boolean" ? value : fallback;
  }
};
