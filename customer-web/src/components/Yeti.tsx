import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type YetiState = 'idle' | 'watching' | 'shy' | 'happy' | 'sad';

interface YetiProps {
  state: YetiState;
  lookAt?: { x: number; y: number };
  size?: 'large' | 'small';
}

export default function Yeti({ state, lookAt = { x: 0, y: 0 }, size = 'large' }: YetiProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Periodic blink in idle/watching states
  useEffect(() => {
    if (state === 'shy') return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [state]);

  const dim = size === 'large' ? 220 : 120;

  // Clamp pupil offset for eye tracking
  const maxOffset = size === 'large' ? 6 : 3;
  const pupilX = Math.max(-maxOffset, Math.min(maxOffset, lookAt.x * maxOffset));
  const pupilY = Math.max(-maxOffset, Math.min(maxOffset, lookAt.y * maxOffset));

  const bodyColor = '#d4a574';   // warm brown fur
  const bellyColor = '#f5e6d3';  // lighter cream belly
  const eyeWhite = '#fff';
  const pupilColor = '#1c0d02';
  const mouthColor = '#8B4513';
  const cupColor = '#4f5130';
  const cupCoffee = '#3e2723';

  return (
    <motion.svg
      viewBox="0 0 200 220"
      width={dim}
      height={dim}
      style={{ overflow: 'visible' }}
      animate={
        state === 'happy'
          ? { y: [0, -12, 0], transition: { duration: 0.5, repeat: 2, ease: 'easeInOut' } }
          : state === 'sad'
            ? { y: [0, 4, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
            : {}
      }
    >
      {/* Body - round furry shape */}
      <motion.ellipse
        cx="100"
        cy="130"
        rx="70"
        ry="78"
        fill={bodyColor}
        animate={
          state === 'idle'
            ? { ry: [78, 80, 78], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }
            : state === 'sad'
              ? { ry: 82, transition: { duration: 0.5 } }
              : { ry: 78 }
        }
      />

      {/* Belly */}
      <ellipse cx="100" cy="145" rx="45" ry="50" fill={bellyColor} opacity="0.7" />

      {/* Fur tufts on top */}
      <motion.g
        animate={
          state === 'happy'
            ? { rotate: [0, -3, 3, 0], transition: { duration: 0.4, repeat: 3 } }
            : {}
        }
        style={{ transformOrigin: '100px 60px' }}
      >
        <ellipse cx="80" cy="58" rx="12" ry="8" fill={bodyColor} transform="rotate(-20 80 58)" />
        <ellipse cx="100" cy="52" rx="10" ry="9" fill={bodyColor} />
        <ellipse cx="120" cy="58" rx="12" ry="8" fill={bodyColor} transform="rotate(20 120 58)" />
      </motion.g>

      {/* ---- EYES ---- */}
      <AnimatePresence>
        {state !== 'shy' && (
          <motion.g
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {/* Left eye white */}
            <motion.ellipse
              cx="78"
              cy="105"
              rx="18"
              ry={isBlinking ? 2 : 16}
              fill={eyeWhite}
              stroke="#c4956a"
              strokeWidth="1.5"
              animate={{ ry: isBlinking ? 2 : 16 }}
              transition={{ duration: 0.08 }}
            />
            {/* Left pupil */}
            <motion.circle
              cx={78}
              cy={105}
              r="7"
              fill={pupilColor}
              animate={{
                cx: 78 + pupilX,
                cy: 105 + pupilY,
                opacity: isBlinking ? 0 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
            {/* Left pupil highlight */}
            <motion.circle
              cx={78}
              cy={105}
              r="2.5"
              fill="#fff"
              animate={{
                cx: 81 + pupilX,
                cy: 101 + pupilY,
                opacity: isBlinking ? 0 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />

            {/* Right eye white */}
            <motion.ellipse
              cx="122"
              cy="105"
              rx="18"
              ry={isBlinking ? 2 : 16}
              fill={eyeWhite}
              stroke="#c4956a"
              strokeWidth="1.5"
              animate={{ ry: isBlinking ? 2 : 16 }}
              transition={{ duration: 0.08 }}
            />
            {/* Right pupil */}
            <motion.circle
              cx={122}
              cy={105}
              r="7"
              fill={pupilColor}
              animate={{
                cx: 122 + pupilX,
                cy: 105 + pupilY,
                opacity: isBlinking ? 0 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
            {/* Right pupil highlight */}
            <motion.circle
              cx={122}
              cy={105}
              r="2.5"
              fill="#fff"
              animate={{
                cx: 125 + pupilX,
                cy: 101 + pupilY,
                opacity: isBlinking ? 0 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Shy state: hands covering eyes */}
      {state === 'shy' && (
        <motion.g
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {/* Left paw covering left eye */}
          <ellipse cx="78" cy="105" rx="22" ry="18" fill={bodyColor} stroke="#c4956a" strokeWidth="1" />
          <ellipse cx="70" cy="100" rx="7" ry="6" fill="#c4956a" opacity="0.5" />
          <ellipse cx="82" cy="98" rx="6" ry="5" fill="#c4956a" opacity="0.5" />

          {/* Right paw covering right eye */}
          <ellipse cx="122" cy="105" rx="22" ry="18" fill={bodyColor} stroke="#c4956a" strokeWidth="1" />
          <ellipse cx="114" cy="100" rx="7" ry="6" fill="#c4956a" opacity="0.5" />
          <ellipse cx="126" cy="98" rx="6" ry="5" fill="#c4956a" opacity="0.5" />

          {/* Blush spots peeking out */}
          <circle cx="68" cy="120" r="8" fill="#e8a0a0" opacity="0.5" />
          <circle cx="132" cy="120" r="8" fill="#e8a0a0" opacity="0.5" />
        </motion.g>
      )}

      {/* Nose */}
      <ellipse cx="100" cy="125" rx="8" ry="5" fill={mouthColor} />
      <ellipse cx="98" cy="123" rx="2" ry="1.5" fill="#a0522d" opacity="0.6" />

      {/* Mouth */}
      <motion.path
        d={
          state === 'happy'
            ? 'M 88 135 Q 100 150, 112 135'     // big smile
            : state === 'sad'
              ? 'M 88 140 Q 100 132, 112 140'    // frown
              : 'M 90 136 Q 100 143, 110 136'    // gentle smile
        }
        fill="none"
        stroke={mouthColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        animate={{
          d: state === 'happy'
            ? 'M 88 135 Q 100 150, 112 135'
            : state === 'sad'
              ? 'M 88 140 Q 100 132, 112 140'
              : 'M 90 136 Q 100 143, 110 136',
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Left arm/paw */}
      <motion.g
        animate={
          state === 'shy'
            ? { y: -30, x: 10 }
            : { y: 0, x: 0 }
        }
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <ellipse cx="38" cy="155" rx="15" ry="12" fill={bodyColor} transform="rotate(-15 38 155)" />
      </motion.g>

      {/* Right arm/paw + coffee cup */}
      <motion.g
        animate={
          state === 'happy'
            ? { rotate: [-5, -20, -5], y: [0, -8, 0], transition: { duration: 0.6, repeat: 2 } }
            : state === 'shy'
              ? { y: -30, x: -10 }
              : state === 'sad'
                ? { rotate: 5, y: 5 }
                : { rotate: 0, y: 0 }
        }
        style={{ transformOrigin: '162px 155px' }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <ellipse cx="162" cy="155" rx="15" ry="12" fill={bodyColor} transform="rotate(15 162 155)" />

        {/* Coffee cup */}
        <rect x="152" y="140" width="22" height="18" rx="3" fill={cupColor} />
        <rect x="155" y="143" width="16" height="6" rx="2" fill={cupCoffee} />
        {/* Cup handle */}
        <path d="M 174 145 Q 182 150, 174 157" fill="none" stroke={cupColor} strokeWidth="3" strokeLinecap="round" />

        {/* Steam from cup */}
        <motion.g
          animate={{ opacity: [0.3, 0.7, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M 160 138 Q 158 132, 162 128" fill="none" stroke="#c4956a" strokeWidth="1.5" opacity="0.5" />
          <path d="M 166 138 Q 168 130, 164 126" fill="none" stroke="#c4956a" strokeWidth="1.5" opacity="0.4" />
        </motion.g>
      </motion.g>

      {/* Feet */}
      <ellipse cx="78" cy="205" rx="20" ry="8" fill={bodyColor} />
      <ellipse cx="122" cy="205" rx="20" ry="8" fill={bodyColor} />

      {/* Happy sparkles */}
      {state === 'happy' && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.text x="30" y="70" fontSize="16"
            animate={{ opacity: [0, 1, 0], y: [70, 55], scale: [0.5, 1.2] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
          >
            ✨
          </motion.text>
          <motion.text x="160" y="65" fontSize="16"
            animate={{ opacity: [0, 1, 0], y: [65, 50], scale: [0.5, 1.2] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.8, delay: 0.3 }}
          >
            ✨
          </motion.text>
          <motion.text x="45" y="50" fontSize="12"
            animate={{ opacity: [0, 1, 0], y: [50, 35] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1, delay: 0.6 }}
          >
            ☕
          </motion.text>
        </motion.g>
      )}
    </motion.svg>
  );
}
