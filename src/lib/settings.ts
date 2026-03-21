// User settings stored in localStorage

export interface UserSettings {
  skipDuration: number; // seconds: 5 or 10
  preferredServer: "primary" | "backup";
  subtitlesEnabled: boolean;
  autoPlayNext: boolean;
  animationsReduced: boolean;
}

const SETTINGS_KEY = "otaku_settings";

const defaultSettings: UserSettings = {
  skipDuration: 10,
  preferredServer: "primary",
  subtitlesEnabled: true,
  autoPlayNext: true,
  animationsReduced: false,
};

export function getSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Partial<UserSettings>) {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
