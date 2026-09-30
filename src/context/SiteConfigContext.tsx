import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';

export interface SiteSettingsData {
  siteName: string;
  siteTagline: string;
  description: string;
  supportEmail?: string;
  supportPhone?: string;
}

interface SiteConfigContextType {
  siteName: string;
  siteTagline: string;
  description: string;
  settings: SiteSettingsData;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettingsData>) => Promise<SiteSettingsData>;
}

const defaultData: SiteSettingsData = {
  siteName: 'Libr',
  siteTagline: 'Multi-Library & Study Center Management',
  description: 'Production-Ready Mobile-First Multi-Library Management SaaS & Study Space Platform',
  supportEmail: 'support@libr.com',
};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettingsData>(() => {
    // Attempt fast local cache hydration to prevent flash of default name
    try {
      const cached = localStorage.getItem('libr_site_settings');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return defaultData;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; settings: SiteSettingsData }>('/public/site-settings');
      if (res.success && res.settings) {
        setSettings(res.settings);
        try {
          localStorage.setItem('libr_site_settings', JSON.stringify(res.settings));
        } catch (_) {}
      }
    } catch (err) {
      console.error('Failed to fetch public site settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<SiteSettingsData>): Promise<SiteSettingsData> => {
    const res = await api.put<{ success: boolean; settings: SiteSettingsData }>(
      '/superadmin/site-settings',
      newSettings
    );
    if (res.success && res.settings) {
      setSettings(res.settings);
      try {
        localStorage.setItem('libr_site_settings', JSON.stringify(res.settings));
      } catch (_) {}
      return res.settings;
    }
    throw new Error('Failed to update platform settings');
  };

  return (
    <SiteConfigContext.Provider
      value={{
        siteName: settings.siteName || 'Libr',
        siteTagline: settings.siteTagline || 'Library Management',
        description: settings.description || defaultData.description,
        settings,
        isLoading,
        refreshSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
};

export function useSiteConfig(): SiteConfigContextType {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
}
