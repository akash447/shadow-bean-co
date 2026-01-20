import React from 'react';
import { Image, ImageProps, Platform, StyleSheet, ImageStyle } from 'react-native';

interface UniversalImageProps extends ImageProps {
    className?: string; // Support for NativeWind if needed, though we use style mostly
}

export function UniversalImage({ source, style, resizeMode, className, ...props }: UniversalImageProps) {
    if (Platform.OS === 'web' && typeof source === 'object' && source !== null && 'uri' in source) {
        // Web Implementation: Use standard <img> tag
        // We need to flatten the style to get dimensions if they are in the style object
        const flatStyle = StyleSheet.flatten(style) || {};
        const { width, height, tintColor, ...restStyle } = flatStyle as any;

        // Construct CSS style
        const cssStyle: any = {
            objectFit: resizeMode === 'contain' ? 'contain' : resizeMode === 'cover' ? 'cover' : 'fill',
            width: width,
            height: height,
            ...restStyle, // This might include non-standard web props, but React usually handles/ignores them
        };

        // Handle tintColor for web using CSS filter
        // If tintColor is white (#fff or white), apply brightness filter to make icon white
        if (tintColor === '#fff' || tintColor === '#ffffff' || tintColor === 'white') {
            cssStyle.filter = 'brightness(0) invert(1)';
        }

        return (
            <img
                src={(source as any).uri}
                className={className}
                style={cssStyle}
                alt="asset"
            />
        );
    }

    // Native Implementation: Standard Image
    return <Image source={source} style={style} resizeMode={resizeMode} className={className} {...props} />;
}
