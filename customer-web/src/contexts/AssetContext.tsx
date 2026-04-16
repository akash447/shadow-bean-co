import React, { createContext, useContext, useEffect, useState } from 'react';

interface Asset {
  key: string;
  url: string;
  title: string;
  type: string;
  category: string;
}

interface AssetContextType {
  getAssetUrl: (key: string) => string;
  assets: Asset[];
  loading: boolean;
}

const MEDIA_CDN = 'https://media.shadowbeanco.net';
const API_URL = import.meta.env.VITE_API_URL || 'https://api.shadowbeanco.net';
const ASSET_CACHE_KEY = 'sbc_asset_cache';

// Load from localStorage cache instantly (no network wait)
function getCachedAssetMap(): Record<string, string> {
  try {
    const cached = localStorage.getItem(ASSET_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch { return {}; }
}

const AssetContext = createContext<AssetContextType>({
  getAssetUrl: (key) => `${MEDIA_CDN}/${key}`,
  assets: [],
  loading: false,
});

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetMap, setAssetMap] = useState<Record<string, string>>(getCachedAssetMap);
  // Start as false — cached assets are available immediately
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Refresh from API in background (non-blocking)
    fetch(`${API_URL}/assets`)
      .then(r => r.json())
      .then(data => {
        setAssets(data);
        const map: Record<string, string> = {};
        data.forEach((a: Asset) => { map[a.key] = a.url; });
        setAssetMap(map);
        // Persist to cache for next visit
        try { localStorage.setItem(ASSET_CACHE_KEY, JSON.stringify(map)); } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getAssetUrl = (key: string) => assetMap[key] || `${MEDIA_CDN}/${key}`;

  return (
    <AssetContext.Provider value={{ getAssetUrl, assets, loading }}>
      {children}
    </AssetContext.Provider>
  );
};

// Known images that have WebP versions on CDN
const WEBP_AVAILABLE = new Set([
  'home_hero', 'product_bag', 'coffee_farmer', 'about_hero', 'logo', 'logo_bird',
]);

const toWebP = (key: string): string => {
  const base = key.replace(/\.(png|jpe?g)$/i, '');
  if (WEBP_AVAILABLE.has(base)) return base + '.webp';
  return key;
};

export const useAsset = (key: string) => {
  const { getAssetUrl } = useContext(AssetContext);
  return getAssetUrl(toWebP(key));
};

export const useAssetContext = () => useContext(AssetContext);
