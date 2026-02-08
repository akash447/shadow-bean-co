import React, { useState, useEffect } from 'react';
import { Image, ImageProps, ImageStyle, StyleProp, View, ActivityIndicator, Platform } from 'react-native';

// CloudFront CDN base URL (replaces Supabase storage)
const CLOUDFRONT_BASE_URL = 'https://media.shadowbeanco.net';

// Only import AsyncStorage on native platforms
let AsyncStorage: any = null;
if (Platform.OS !== 'web') {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

// Cache expiration: 24 hours
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

interface CDNImageProps extends Omit<ImageProps, 'source'> {
    remoteKey: string;
    defaultSource: any; // require('...')
    style?: StyleProp<ImageStyle>;
    showLoading?: boolean;
}

export const CDNImage: React.FC<CDNImageProps> = ({
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
        try {
            // Skip cache on web (AsyncStorage may not work reliably)
            if (Platform.OS !== 'web' && AsyncStorage) {
                // 1. Check local cache first and display immediately
                const cachedData = await AsyncStorage.getItem(`img_cache_${remoteKey}`);
                if (cachedData) {
                    const { url, timestamp } = JSON.parse(cachedData);
                    // valid for 24 hours purely for "offline" fallback
                    if (url && (Date.now() - timestamp) < CACHE_EXPIRY) {
                        setUri(url);
                        setLoading(false);
                        return;
                    }
                }
            }

            // 2. Build CloudFront CDN URL
            const cdnUrl = `${CLOUDFRONT_BASE_URL}/${remoteKey}`;
            setUri(cdnUrl);

            // Cache on native
            if (Platform.OS !== 'web' && AsyncStorage) {
                await AsyncStorage.setItem(`img_cache_${remoteKey}`, JSON.stringify({
                    url: cdnUrl,
                    timestamp: Date.now(),
                }));
            }
        } catch (err) {
            console.error(`[CDNImage] Error loading ${remoteKey}:`, err);
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
export const useCDNImage = (remoteKey: string, defaultSource: any) => {
    const [source, setSource] = useState<any>(defaultSource);

    useEffect(() => {
        const load = async () => {
            try {
                // Skip cache on web (AsyncStorage may not work reliably)
                if (Platform.OS !== 'web' && AsyncStorage) {
                    const cachedData = await AsyncStorage.getItem(`img_cache_${remoteKey}`);
                    if (cachedData) {
                        const { url, timestamp } = JSON.parse(cachedData);
                        if (url && (Date.now() - timestamp) < CACHE_EXPIRY) {
                            setSource({ uri: url });
                            return;
                        }
                    }
                }

                // Build CloudFront CDN URL
                const cdnUrl = `${CLOUDFRONT_BASE_URL}/${remoteKey}`;
                setSource({ uri: cdnUrl });

                // Only cache on native
                if (Platform.OS !== 'web' && AsyncStorage) {
                    AsyncStorage.setItem(`img_cache_${remoteKey}`, JSON.stringify({
                        url: cdnUrl,
                        timestamp: Date.now(),
                    }));
                }
            } catch (error) {
                // ignore - keep default source
            }
        };
        load();
    }, [remoteKey]);

    return source;
};
