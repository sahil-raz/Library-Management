import { SystemConfig } from '../models/SystemConfig.js';

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  description: string;
  supportEmail?: string;
  supportPhone?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'Libr',
  siteTagline: 'Multi-Library & Study Center Management',
  description: 'Production-Ready Mobile-First Multi-Library Management SaaS & Study Space Platform',
  supportEmail: 'support@libr.com',
};

const SITE_SETTINGS_KEY = 'platform_site_settings';

/**
 * Retrieves the platform-wide site branding and settings
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const config = await SystemConfig.findOne({ key: SITE_SETTINGS_KEY });
  if (!config || !config.value) {
    return DEFAULT_SITE_SETTINGS;
  }
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...config.value,
  };
}

/**
 * Updates site branding and settings (Super Admin only)
 */
export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSiteSettings();
  const updated: SiteSettings = {
    ...current,
    ...settings,
    siteName: (settings.siteName || current.siteName).trim(),
    siteTagline: (settings.siteTagline || current.siteTagline).trim(),
    description: (settings.description || current.description).trim(),
  };

  await SystemConfig.findOneAndUpdate(
    { key: SITE_SETTINGS_KEY },
    { key: SITE_SETTINGS_KEY, value: updated },
    { upsert: true, new: true }
  );

  return updated;
}
