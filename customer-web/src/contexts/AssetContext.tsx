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

const AssetContext = createContext<AssetContextType>({
  getAssetUrl: (key) => `${MEDIA_CDN}/${key}`,
  assets: [],
  loading: true,
});

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [assetMap, setAssetMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API_URL}/assets`)
      .then(r => r.json())
      .then(data => {
        setAssets(data);
        const map: Record<string, string> = {};
        data.forEach((a: Asset) => { map[a.key] = a.url; });
        setAssetMap(map);
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

export const useAsset = (key: string) => {
  const { getAssetUrl } = useContext(AssetContext);
  return getAssetUrl(key);
};

export const useAssetContext = () => useContext(AssetContext);
