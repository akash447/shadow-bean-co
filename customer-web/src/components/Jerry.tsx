import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type JerryState = 'idle' | 'watching' | 'shy' | 'happy' | 'sad';

interface JerryProps {
    state: JerryState;
    lookAt?: { x: number; y: number };
    size?: 'large' | 'small';
}

export default function Jerry({ state, lookAt = { x: 0, y: 0 }, size = 'large' }: JerryProps) {
    const [isBlinking, setIsBlinking] = useState(false);

    useEffect(() => {
        if (state === 'shy') return;
        const interval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 150);
        }, 3000 + Math.random() * 2000);
        return () => clearInterval(interval);
    }, [state]);

    const dim = size === 'large' ? 260 : 130;
    const maxOffset = size === 'large' ? 10 : 5;
    const pupilX = Math.max(-maxOffset, Math.min(maxOffset, lookAt.x * maxOffset));
    const pupilY = Math.max(-maxOffset, Math.min(maxOffset, lookAt.y * maxOffset));

    // Jerry Color Palette
    const fur = '#A0522D';     // Sienna brown

    const earInner = '#FFB6C1'; // Light pink
    const muzzle = '#F5DEB3';   // Wheat/Beige
    const nose = '#000000';
    const pupil = '#000000';
    const cheese = '#FFD700';   // Gold
    const cheeseHoles = '#DAA520'; // GoldenRod

    return (
        <motion.svg
            viewBox="0 0 240 280"
            width={dim}
            height={dim}
            style={{ overflow: 'visible' }}
            animate={
                state === 'idle'
                    ? { rotate: [0, -1, 0, 1, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }
                    : state === 'watching'
                        ? { rotate: lookAt.x * 3, transition: { type: 'spring', stiffness: 80, damping: 12 } }
                        : state === 'happy'
                            ? { y: [0, -15, 0], transition: { duration: 0.4, repeat: 2, ease: 'easeInOut' } }
                            : state === 'sad'
                                ? { y: [0, 5, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
                                : state === 'shy'
                                    ? { y: 10, rotate: [0, -2, 2, 0], transition: { duration: 1, repeat: Infinity } }
                                    : {}
            }
        >
            {/* ===== EARS ===== */}
            {/* Left Ear */}
            <circle cx="50" cy="70" r="45" fill={fur} />
            <circle cx="50" cy="70" r="28" fill={earInner} />

            {/* Right Ear */}
            <circle cx="190" cy="70" r="45" fill={fur} />
            <circle cx="190" cy="70" r="28" fill={earInner} />

            {/* ===== HEAD/BODY ===== */}
            {/* Main Head Shape - rounded but slightly wider at cheeks */}
            <motion.path
                d="M 60 100 C 60 50, 180 50, 180 100 C 195 130, 200 160, 180 190 C 160 210, 80 210, 60 190 C 40 160, 45 130, 60 100 Z"
                fill={fur}
            />

            {/* Muzzle/Belly Area */}
            <ellipse cx="120" cy="165" rx="55" ry="40" fill={muzzle} />

            {/* ===== HAIR TUFT ===== */}
            <path d="M 115 55 Q 120 40, 125 55" fill="none" stroke={fur} strokeWidth="3" />
            <path d="M 120 52 Q 130 35, 135 55" fill="none" stroke={fur} strokeWidth="3" />

            {/* ===== EYES ===== */}
            <AnimatePresence>
                {state !== 'shy' && (
                    <motion.g
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    >
                        {/* Left Eye */}
                        <ellipse cx="95" cy="115" rx="22" ry={isBlinking ? 2 : 28} fill="#FFF" stroke="#000" strokeWidth="1" />
                        <motion.ellipse
                            cx="95" cy="115" rx="8" ry={isBlinking ? 1 : 12}
                            fill={pupil}
                            animate={{
                                cx: 95 + pupilX,
                                cy: 115 + pupilY,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />
                        {/* Glint */}
                        <motion.circle
                            cx="98" cy="108" r="3" fill="#FFF"
                            animate={{ cx: 98 + pupilX, cy: 108 + pupilY }}
                        />

                        {/* Right Eye */}
                        <ellipse cx="145" cy="115" rx="22" ry={isBlinking ? 2 : 28} fill="#FFF" stroke="#000" strokeWidth="1" />
                        <motion.ellipse
                            cx="145" cy="115" rx="8" ry={isBlinking ? 1 : 12}
                            fill={pupil}
                            animate={{
                                cx: 145 + pupilX,
                                cy: 115 + pupilY,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />
                        {/* Glint */}
                        <motion.circle
                            cx="148" cy="108" r="3" fill="#FFF"
                            animate={{ cx: 148 + pupilX, cy: 108 + pupilY }}
                        />
                    </motion.g>
                )}
            </AnimatePresence>

            {/* ===== SHY COVERING EYES ===== */}
            {state === 'shy' && (
                <motion.g
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    {/* Paws covering eyes */}
                    <ellipse cx="90" cy="115" rx="25" ry="20" fill={fur} stroke="#000" strokeWidth="0.5" />
                    <ellipse cx="150" cy="115" rx="25" ry="20" fill={fur} stroke="#000" strokeWidth="0.5" />
                </motion.g>
            )}

            {/* ===== NOSE ===== */}
            <ellipse cx="120" cy="155" rx="12" ry="8" fill={nose} />
            {/* Whiskers */}
            <path d="M 70 160 L 40 155" stroke="#000" strokeWidth="1" />
            <path d="M 70 165 L 40 170" stroke="#000" strokeWidth="1" />
            <path d="M 170 160 L 200 155" stroke="#000" strokeWidth="1" />
            <path d="M 170 165 L 200 170" stroke="#000" strokeWidth="1" />

            {/* ===== MOUTH ===== */}
            <motion.path
                d="M 100 175 Q 120 190, 140 175"
                fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round"
                animate={{
                    d: state === 'happy'
                        ? "M 90 170 Q 120 200, 150 170" // Big smile
                        : state === 'sad'
                            ? "M 100 185 Q 120 175, 140 185" // Frown
                            : "M 100 175 Q 120 190, 140 175" // Normal smile
                }}
            />
            {state === 'happy' && (
                <path d="M 115 170 L 125 170 L 125 180 L 115 180 Z" fill="#FFF" /> // Teeth
            )}

            {/* ===== ARMS / CHEESE ===== */}
            {state === 'happy' ? (
                <motion.g
                    animate={{ y: [0, -5, 0], rotate: [-5, 5, -5] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                >
                    {/* Holding Cheese */}
                    <path d="M 160 190 L 200 180 L 200 210 L 170 220 Z" fill={cheese} stroke="#DAA520" strokeWidth="1" />
                    <circle cx="180" cy="195" r="3" fill={cheeseHoles} />
                    <circle cx="190" cy="205" r="4" fill={cheeseHoles} />
                    <ellipse cx="160" cy="200" rx="15" ry="10" fill={fur} /> {/* Paw holding cheese */}
                </motion.g>
            ) : (
                <>
                    {/* Arms down */}
                    <ellipse cx="70" cy="200" rx="15" ry="30" fill={fur} transform="rotate(30 70 200)" />
                    <ellipse cx="170" cy="200" rx="15" ry="30" fill={fur} transform="rotate(-30 170 200)" />

                    {/* Paws */}
                    <circle cx="60" cy="225" r="10" fill={muzzle} />
                    <circle cx="180" cy="225" r="10" fill={muzzle} />
                </>
            )}

        </motion.svg>
    );
}
