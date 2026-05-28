export const SETTINGS_TAB_IDS = [
  'profile',
  'notifications',
  'security',
  'api',
  'organization',
] as const;

export type SettingsTabId = (typeof SETTINGS_TAB_IDS)[number];

export function isSettingsTab(value: string): value is SettingsTabId {
  return (SETTINGS_TAB_IDS as readonly string[]).includes(value);
}
