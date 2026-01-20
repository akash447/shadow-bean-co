// Brand Colors
export const Colors = {
    // Primary brand colors from design
    darkBrown: '#1c0d02',
    oliveGreen: '#4f5130',
    cream: '#f7f3ed',

    // Extended palette
    white: '#ffffff',
    black: '#000000',

    // UI states
    light: {
        text: '#1c0d02',
        textSecondary: '#4f5130',
        background: '#f7f3ed',
        tint: '#4f5130',
        tabIconDefault: '#687076',
        tabIconSelected: '#1c0d02',
        border: '#e0dcd6',
        card: '#ffffff',
        // Brand colors mapped for Light Mode
        darkBrown: '#1c0d02',
        oliveGreen: '#4f5130',
        cream: '#f7f3ed',
    },
    dark: {
        text: '#f7f3ed',
        textSecondary: '#c4c0ba',
        background: '#1c0d02',
        tint: '#f7f3ed',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: '#f7f3ed',
        border: '#3a3a3a',
        card: '#2a2a2a',
        // Brand colors mapped for Dark Mode (Inverted for visibility)
        darkBrown: '#f7f3ed', // Becomes light in dark mode for contrast
        oliveGreen: '#8f916b', // Lighter olive for visibility
        cream: '#1c0d02', // Becomes dark in dark mode
    },
};

// Typography - matching design fonts
export const Typography = {
    heading: 'Agdasima',
    body: 'Montserrat',
};

export default Colors;
