import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type MugState = 'idle' | 'watching' | 'shy' | 'happy' | 'sad';

interface CoffeeMugProps {
    state: MugState;
    lookAt?: { x: number; y: number };
    size?: 'large' | 'small';
}

export default function CoffeeMug({ state, lookAt = { x: 0, y: 0 }, size = 'large' }: CoffeeMugProps) {
    const [isBlinking, setIsBlinking] = useState(false);

    useEffect(() => {
        if (state === 'shy') return;
        const interval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 120);
        }, 2500 + Math.random() * 2000);
        return () => clearInterval(interval);
    }, [state]);

    const dim = size === 'large' ? 260 : 130;
    const maxOffset = size === 'large' ? 8 : 4;
    const pupilX = Math.max(-maxOffset, Math.min(maxOffset, lookAt.x * maxOffset));
    const pupilY = Math.max(-maxOffset, Math.min(maxOffset, lookAt.y * maxOffset));

    // Rick & Morty-style color palette
    const mugBody = '#E8F4F8';       // Light blue-white (like the reference)
    const mugShadow = '#C8DDE8';     // Slightly darker for depth
    const mugOutline = '#2D2D2D';    // Dark outline (R&M style thick lines)
    const coffeeColor = '#3D1C02';   // Very dark coffee
    const coffeeFoam = '#6B3A1F';    // Lighter coffee foam
    const armColor = '#D0E8F0';      // Slightly blue-tinted arms
    const legColor = '#D0E8F0';
    const toothColor = '#FFFFF0';    // Off-white teeth
    const eyeWhite = '#FFFFFF';
    const pupilColor = '#1A1A1A';
    const steamColor = '#B0C8D8';

    // Body animation per state - typed properly for framer-motion
    const getBodyAnim = () => {
        if (state === 'idle') return { y: [0, -4, 0] as number[], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } };
        if (state === 'watching') return { rotate: lookAt.x * 4, transition: { type: 'spring' as const, stiffness: 80, damping: 12 } };
        if (state === 'happy') return { y: [0, -18, 0, -10, 0] as number[], transition: { duration: 0.5, repeat: 2, ease: 'easeInOut' as const } };
        if (state === 'sad') return { y: [0, 4, 0] as number[], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const } };
        if (state === 'shy') return { y: 6, transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const } };
        return {};
    };

    return (
        <motion.svg
            viewBox="0 0 260 300"
            width={dim}
            height={dim}
            style={{ overflow: 'visible' }}
            animate={getBodyAnim()}
        >
            {/* ===== STEAM ===== */}
            {state !== 'sad' && (
                <motion.g
                    animate={{ y: [0, -8, 0], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <path d="M 100 55 Q 95 42, 100 30 Q 105 18, 100 8" fill="none" stroke={steamColor} strokeWidth="4" strokeLinecap="round" />
                    <path d="M 120 55 Q 115 40, 120 26 Q 125 12, 120 2" fill="none" stroke={steamColor} strokeWidth="4" strokeLinecap="round" />
                    <path d="M 140 55 Q 135 42, 140 30 Q 145 18, 140 8" fill="none" stroke={steamColor} strokeWidth="4" strokeLinecap="round" />
                </motion.g>
            )}

            {/* ===== MUG HANDLE ===== */}
            <path
                d="M 195 110 C 230 110, 240 130, 240 150 C 240 170, 230 190, 195 190"
                fill="none"
                stroke={mugOutline}
                strokeWidth="16"
                strokeLinecap="round"
            />
            <path
                d="M 195 110 C 222 110, 230 130, 230 150 C 230 170, 222 190, 195 190"
                fill="none"
                stroke={mugShadow}
                strokeWidth="8"
                strokeLinecap="round"
            />

            {/* ===== MUG BODY ===== */}
            {/* Outer body with thick R&M outline */}
            <rect x="55" y="65" width="150" height="175" rx="18" ry="18" fill={mugOutline} />
            <rect x="60" y="70" width="140" height="165" rx="14" ry="14" fill={mugBody} />

            {/* Shadow on right side */}
            <rect x="170" y="70" width="30" height="165" rx="0" ry="0" fill={mugShadow} />
            <rect x="170" y="70" width="30" height="165" rx="14" ry="14" fill={mugShadow} />

            {/* ===== COFFEE INSIDE (top of mug) ===== */}
            <ellipse cx="130" cy="75" rx="68" ry="14" fill={mugOutline} />
            <ellipse cx="130" cy="72" rx="65" ry="12" fill={coffeeColor} />
            {/* Coffee foam swirl */}
            <ellipse cx="130" cy="72" rx="40" ry="7" fill={coffeeFoam} opacity="0.6" />
            <path d="M 105 70 Q 130 66, 155 70" fill="none" stroke={coffeeFoam} strokeWidth="3" strokeLinecap="round" opacity="0.8" />

            {/* ===== EYES ===== */}
            <AnimatePresence>
                {state !== 'shy' && (
                    <motion.g
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    >
                        {/* Left Eye - big googly R&M style */}
                        {/* Eye socket */}
                        <ellipse cx="105" cy="145" rx="26" ry={isBlinking ? 3 : 30} fill={mugOutline} />
                        <ellipse cx="105" cy="145" rx="23" ry={isBlinking ? 2 : 27} fill={eyeWhite} />
                        {/* Pupil */}
                        <motion.ellipse
                            cx="105" cy="145"
                            rx="10" ry={isBlinking ? 1 : 14}
                            fill={pupilColor}
                            animate={{ cx: 105 + pupilX, cy: 145 + pupilY }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />
                        {/* Glint */}
                        <motion.circle
                            cx="110" cy="137" r="4" fill="#FFF"
                            animate={{ cx: 110 + pupilX, cy: 137 + pupilY }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />
                        {/* Small glint */}
                        <motion.circle
                            cx="100" cy="153" r="2" fill="#FFF" opacity="0.7"
                            animate={{ cx: 100 + pupilX, cy: 153 + pupilY }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />

                        {/* Right Eye */}
                        <ellipse cx="160" cy="145" rx="26" ry={isBlinking ? 3 : 30} fill={mugOutline} />
                        <ellipse cx="160" cy="145" rx="23" ry={isBlinking ? 2 : 27} fill={eyeWhite} />
                        <motion.ellipse
                            cx="160" cy="145"
                            rx="10" ry={isBlinking ? 1 : 14}
                            fill={pupilColor}
                            animate={{ cx: 160 + pupilX, cy: 145 + pupilY }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />
                        <motion.circle
                            cx="165" cy="137" r="4" fill="#FFF"
                            animate={{ cx: 165 + pupilX, cy: 137 + pupilY }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />
                        <motion.circle
                            cx="155" cy="153" r="2" fill="#FFF" opacity="0.7"
                            animate={{ cx: 155 + pupilX, cy: 153 + pupilY }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />
                    </motion.g>
                )}
            </AnimatePresence>

            {/* ===== SHY: Hands covering eyes ===== */}
            {state === 'shy' && (
                <motion.g
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    {/* Left hand covering left eye */}
                    <ellipse cx="105" cy="145" rx="28" ry="22" fill={armColor} stroke={mugOutline} strokeWidth="2" />
                    {/* Right hand covering right eye */}
                    <ellipse cx="160" cy="145" rx="28" ry="22" fill={armColor} stroke={mugOutline} strokeWidth="2" />
                    {/* Fingers */}
                    <path d="M 82 138 Q 78 130, 82 125" fill="none" stroke={mugOutline} strokeWidth="2" strokeLinecap="round" />
                    <path d="M 90 132 Q 87 122, 92 118" fill="none" stroke={mugOutline} strokeWidth="2" strokeLinecap="round" />
                    <path d="M 138 138 Q 134 130, 138 125" fill="none" stroke={mugOutline} strokeWidth="2" strokeLinecap="round" />
                    <path d="M 146 132 Q 143 122, 148 118" fill="none" stroke={mugOutline} strokeWidth="2" strokeLinecap="round" />
                </motion.g>
            )}

            {/* ===== MOUTH ===== */}
            <motion.path
                d={
                    state === 'happy'
                        ? 'M 98 195 Q 130 220, 162 195'   // Big open smile
                        : state === 'sad'
                            ? 'M 100 205 Q 130 192, 160 205' // Frown
                            : 'M 102 198 Q 130 212, 158 198' // Neutral smile
                }
                fill={state === 'happy' ? '#1A0A00' : 'none'}
                stroke={mugOutline}
                strokeWidth="3"
                strokeLinecap="round"
                animate={{
                    d: state === 'happy'
                        ? 'M 98 195 Q 130 220, 162 195'
                        : state === 'sad'
                            ? 'M 100 205 Q 130 192, 160 205'
                            : 'M 102 198 Q 130 212, 158 198'
                }}
                transition={{ type: 'spring', stiffness: 120 }}
            />

            {/* Buck teeth (always visible except sad) */}
            {state !== 'sad' && (
                <g>
                    <rect x="116" y="198" width="14" height="14" rx="2" fill={toothColor} stroke={mugOutline} strokeWidth="1.5" />
                    <rect x="131" y="198" width="14" height="14" rx="2" fill={toothColor} stroke={mugOutline} strokeWidth="1.5" />
                    <line x1="130" y1="198" x2="130" y2="212" stroke={mugOutline} strokeWidth="1" />
                </g>
            )}

            {/* Coffee drip on chin (R&M detail) */}
            <path d="M 128 212 Q 130 220, 128 226" fill="none" stroke={coffeeFoam} strokeWidth="3" strokeLinecap="round" />

            {/* ===== ARMS ===== */}
            {state === 'happy' ? (
                <motion.g
                    animate={{ rotate: [-10, 10, -10] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    style={{ originX: '130px', originY: '200px' }}
                >
                    {/* Left arm raised */}
                    <motion.path
                        d="M 65 175 Q 30 155, 20 130"
                        fill="none" stroke={mugOutline} strokeWidth="14" strokeLinecap="round"
                    />
                    <motion.path
                        d="M 65 175 Q 30 155, 20 130"
                        fill="none" stroke={armColor} strokeWidth="10" strokeLinecap="round"
                    />
                    {/* Left hand */}
                    <circle cx="18" cy="126" r="12" fill={armColor} stroke={mugOutline} strokeWidth="2" />

                    {/* Right arm raised */}
                    <motion.path
                        d="M 195 175 Q 230 155, 240 130"
                        fill="none" stroke={mugOutline} strokeWidth="14" strokeLinecap="round"
                    />
                    <motion.path
                        d="M 195 175 Q 230 155, 240 130"
                        fill="none" stroke={armColor} strokeWidth="10" strokeLinecap="round"
                    />
                    {/* Right hand */}
                    <circle cx="242" cy="126" r="12" fill={armColor} stroke={mugOutline} strokeWidth="2" />
                </motion.g>
            ) : (
                <>
                    {/* Left arm out to side */}
                    <path d="M 62 180 Q 30 185, 18 200" fill="none" stroke={mugOutline} strokeWidth="14" strokeLinecap="round" />
                    <path d="M 62 180 Q 30 185, 18 200" fill="none" stroke={armColor} strokeWidth="10" strokeLinecap="round" />
                    <circle cx="14" cy="203" r="12" fill={armColor} stroke={mugOutline} strokeWidth="2" />

                    {/* Right arm out to side */}
                    <path d="M 198 180 Q 230 185, 242 200" fill="none" stroke={mugOutline} strokeWidth="14" strokeLinecap="round" />
                    <path d="M 198 180 Q 230 185, 242 200" fill="none" stroke={armColor} strokeWidth="10" strokeLinecap="round" />
                    <circle cx="246" cy="203" r="12" fill={armColor} stroke={mugOutline} strokeWidth="2" />
                </>
            )}

            {/* ===== LEGS ===== */}
            {/* Left leg */}
            <path d="M 100 238 Q 95 255, 88 268" fill="none" stroke={mugOutline} strokeWidth="14" strokeLinecap="round" />
            <path d="M 100 238 Q 95 255, 88 268" fill="none" stroke={legColor} strokeWidth="10" strokeLinecap="round" />
            {/* Left foot */}
            <ellipse cx="84" cy="272" rx="16" ry="8" fill={legColor} stroke={mugOutline} strokeWidth="2" />

            {/* Right leg */}
            <path d="M 160 238 Q 165 255, 172 268" fill="none" stroke={mugOutline} strokeWidth="14" strokeLinecap="round" />
            <path d="M 160 238 Q 165 255, 172 268" fill="none" stroke={legColor} strokeWidth="10" strokeLinecap="round" />
            {/* Right foot */}
            <ellipse cx="176" cy="272" rx="16" ry="8" fill={legColor} stroke={mugOutline} strokeWidth="2" />

        </motion.svg>
    );
}
