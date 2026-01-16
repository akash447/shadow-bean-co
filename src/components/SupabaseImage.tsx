import React, { useState, useEffect } from 'react';
import { Image, ImageProps, ImageStyle, StyleProp, View, ActivityIndicator } from 'react-native';
import { supabase } from '@/src/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache expiration: 24 hours
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

interface SupabaseImageProps extends Omit<ImageProps, 'source'> {
    remoteKey: string;
    defaultSource: any; // require('...')
    style?: StyleProp<ImageStyle>;
    showLoading?: boolean;
}

export const SupabaseImage: React.FC<SupabaseImageProps> = ({
    remoteKey,
    defaultSource,
    style,
    showLoading = false,
    ...props
}) => {
    const [uri, setUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        loadRemoteImage();
    }, [remoteKey]);

    const loadRemoteImage = async () => {
        let cachedTimestamp = 0;

        try {
            // 1. Check local cache first and display immediately
            const cachedData = await AsyncStorage.getItem(`img_cache_${remoteKey}`);
            if (cachedData) {
                const { url, updatedAt, timestamp } = JSON.parse(cachedData);
                // valid for 24 hours purely for "offline" fallback, but we always revalidate
                if (url) {
                    setUri(url); // Show cached immediately
                    cachedTimestamp = updatedAt ? new Date(updatedAt).getTime() : 0;
                    setLoading(false);
                }
            }

            // 2. Revalidate with Supabase (Background Fetch)
            const { data, error } = await (supabase as any)
                .from('app_assets')
                .select('url, updated_at')
                .eq('key', remoteKey)
                .single();

            if (data?.url) {
                const serverUpdatedAt = data.updated_at ? new Date(data.updated_at).getTime() : Date.now();

                // If server has newer version OR we didn't have a cache
                if (serverUpdatedAt > cachedTimestamp || !cachedTimestamp) {
                    // Append timestamp to bust React Native Image cache
                    const finalUrl = `${data.url}?t=${serverUpdatedAt}`;

                    if (finalUrl !== uri) {
                        setUri(finalUrl);
                        // Update Cache
                        await AsyncStorage.setItem(`img_cache_${remoteKey}`, JSON.stringify({
                            url: finalUrl,
                            updatedAt: data.updated_at || new Date().toISOString(),
                            timestamp: Date.now()
                        }));
                    }
                }
            } else if (!uri) {
                // Only if we didn't have a cached version do we accept "not found"
                console.log(`[SupabaseImage] Key '${remoteKey}' not found, using default.`);
            }
        } catch (err) {
            console.error(`[SupabaseImage] Error loading ${remoteKey}:`, err);
            // If we don't have a URI yet, result to error/default
            if (!uri) setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading && showLoading) {
        return (
            <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="#8B7355" />
            </View>
        );
    }

    // Use remote URI if available, otherwise default source
    const source = uri ? { uri } : defaultSource;

    return (
        <Image
            {...props}
            source={source}
            style={style}
            onError={() => {
                // If remote fails, fallback to default (by clearing URI)
                if (uri) setUri(null);
            }}
        />
    );
};

// Hook version for ImageBackground etc
export const useSupabaseImage = (remoteKey: string, defaultSource: any) => {
    const [source, setSource] = useState<any>(defaultSource);

    useEffect(() => {
        const load = async () => {
            let cachedTimestamp = 0;
            let currentUri = null;

            try {
                // 1. Cache
                const cachedData = await AsyncStorage.getItem(`img_cache_${remoteKey}`);
                if (cachedData) {
                    const { url, updatedAt } = JSON.parse(cachedData);
                    if (url) {
                        setSource({ uri: url });
                        currentUri = url;
                        cachedTimestamp = updatedAt ? new Date(updatedAt).getTime() : 0;
                    }
                }

                // 2. Revalidate
                const { data } = await (supabase as any)
                    .from('app_assets')
                    .select('url, updated_at')
                    .eq('key', remoteKey)
                    .single();

                if (data?.url) {
                    const serverUpdatedAt = data.updated_at ? new Date(data.updated_at).getTime() : Date.now();

                    if (serverUpdatedAt > cachedTimestamp || !cachedTimestamp) {
                        const finalUrl = `${data.url}?t=${serverUpdatedAt}`;
                        if (finalUrl !== currentUri) {
                            setSource({ uri: finalUrl });
                            AsyncStorage.setItem(`img_cache_${remoteKey}`, JSON.stringify({
                                url: finalUrl,
                                updatedAt: data.updated_at || new Date().toISOString(),
                                timestamp: Date.now()
                            }));
                        }
                    }
                }
            } catch (error) {
                // ignore
            }
        };
        load();
    }, [remoteKey]);

    return source;
};
