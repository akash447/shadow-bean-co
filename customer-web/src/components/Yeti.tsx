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

  useEffect(() => {
    if (state === 'shy') return;
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [state]);

  const dim = size === 'large' ? 260 : 130;
  const maxOffset = size === 'large' ? 8 : 4;
  const pupilX = Math.max(-maxOffset, Math.min(maxOffset, lookAt.x * maxOffset));
  const pupilY = Math.max(-maxOffset, Math.min(maxOffset, lookAt.y * maxOffset));

  // Blue Yeti color palette
  const body = '#6BA4CC';
  const bodyLight = '#7DB8DC';
  const belly = '#D0E6F5';
  const accent = '#4E8AAF';
  const horn = '#C0DCF0';
  const pad = '#4E8AAF';
  const nose = '#405A6B';
  const pupil = '#1E2D3A';
  const mouth = '#405A6B';
  const blush = '#BFA0D4';
  const cup = '#4f5130';
  const coffee = '#3e2723';

  return (
    <motion.svg
      viewBox="0 0 240 280"
      width={dim}
      height={dim}
      style={{ overflow: 'visible' }}
      animate={
        state === 'idle'
          ? { rotate: [0, -0.4, 0, 0.4, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }
          : state === 'watching'
            ? { rotate: lookAt.x * 2, transition: { type: 'spring', stiffness: 80, damping: 12 } }
            : state === 'happy'
              ? { y: [0, -14, 0], transition: { duration: 0.5, repeat: 2, ease: 'easeInOut' } }
              : state === 'sad'
                ? { y: [0, 4, 0], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }
                : state === 'shy'
                  ? { rotate: [0, -0.3, 0.3, 0], transition: { duration: 1, repeat: Infinity } }
                  : {}
      }
    >
      {/* ===== BODY — big chunky round shape ===== */}
      <motion.ellipse
        cx="120" cy="158"
        rx="88" ry="92"
        fill={body}
        animate={
          state === 'idle'
            ? { ry: [92, 94, 92], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }
            : state === 'sad'
              ? { ry: 97, transition: { duration: 0.5 } }
              : { ry: 92 }
        }
      />

      {/* Belly */}
      <ellipse cx="120" cy="175" rx="58" ry="58" fill={belly} opacity="0.6" />

      {/* Fur texture wisps */}
      <ellipse cx="72" cy="135" rx="8" ry="3" fill={accent} opacity="0.12" transform="rotate(-20 72 135)" />
      <ellipse cx="168" cy="140" rx="8" ry="3" fill={accent} opacity="0.12" transform="rotate(20 168 140)" />
      <ellipse cx="90" cy="200" rx="7" ry="2.5" fill={accent} opacity="0.08" transform="rotate(-10 90 200)" />
      <ellipse cx="150" cy="195" rx="7" ry="2.5" fill={accent} opacity="0.08" transform="rotate(10 150 195)" />

      {/* ===== FUR CROWN — fluffy head top ===== */}
      <motion.g
        animate={
          state === 'happy'
            ? { rotate: [0, -3, 3, 0], transition: { duration: 0.4, repeat: 3 } }
            : {}
        }
        style={{ transformOrigin: '120px 72px' }}
      >
        <circle cx="96" cy="78" r="18" fill={body} />
        <circle cx="120" cy="68" r="22" fill={body} />
        <circle cx="144" cy="78" r="18" fill={body} />
        <circle cx="82" cy="88" r="14" fill={body} />
        <circle cx="158" cy="88" r="14" fill={body} />
        {/* Extra fluff on top */}
        <circle cx="108" cy="60" r="12" fill={bodyLight} opacity="0.5" />
        <circle cx="132" cy="60" r="12" fill={bodyLight} opacity="0.5" />
      </motion.g>

      {/* ===== HORNS — small ice-blue ===== */}
      <path d="M 102 72 L 90 44 Q 96 38, 108 66" fill={horn} stroke={accent} strokeWidth="0.8" />
      <path d="M 138 72 L 150 44 Q 144 38, 132 66" fill={horn} stroke={accent} strokeWidth="0.8" />
      <ellipse cx="92" cy="46" rx="3" ry="2" fill="#fff" opacity="0.4" />
      <ellipse cx="148" cy="46" rx="3" ry="2" fill="#fff" opacity="0.4" />

      {/* ===== EYEBROWS — bushy, expressive ===== */}
      <motion.path
        d="M 76 108 Q 93 97, 110 107"
        fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round"
        animate={{
          d: state === 'sad'
            ? 'M 76 104 Q 93 112, 110 104'
            : state === 'happy'
              ? 'M 76 108 Q 93 93, 110 107'
              : 'M 76 108 Q 93 97, 110 107',
        }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        d="M 130 107 Q 147 97, 164 108"
        fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round"
        animate={{
          d: state === 'sad'
            ? 'M 130 104 Q 147 112, 164 104'
            : state === 'happy'
              ? 'M 130 107 Q 147 93, 164 108'
              : 'M 130 107 Q 147 97, 164 108',
        }}
        transition={{ duration: 0.3 }}
      />

      {/* ===== EYES — big and expressive ===== */}
      <AnimatePresence>
        {state !== 'shy' && (
          <motion.g
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            {/* Left eye */}
            <motion.ellipse
              cx="93" cy="126"
              rx="21" ry={isBlinking ? 2 : 19}
              fill="#fff" stroke={accent} strokeWidth="1.5"
              animate={{ ry: isBlinking ? 2 : 19 }}
              transition={{ duration: 0.08 }}
            />
            <motion.circle
              cx={93} cy={128} r="9.5"
              fill={pupil}
              animate={{
                cx: 93 + pupilX,
                cy: 128 + pupilY,
                opacity: isBlinking ? 0 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
            <motion.circle
              cx={93} cy={128} r="3.5"
              fill="#fff"
              animate={{
                cx: 97 + pupilX * 0.6,
                cy: 123 + pupilY * 0.6,
                opacity: isBlinking ? 0 : 0.9,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />

            {/* Right eye */}
            <motion.ellipse
              cx="147" cy="126"
              rx="21" ry={isBlinking ? 2 : 19}
              fill="#fff" stroke={accent} strokeWidth="1.5"
              animate={{ ry: isBlinking ? 2 : 19 }}
              transition={{ duration: 0.08 }}
            />
            <motion.circle
              cx={147} cy={128} r="9.5"
              fill={pupil}
              animate={{
                cx: 147 + pupilX,
                cy: 128 + pupilY,
                opacity: isBlinking ? 0 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
            <motion.circle
              cx={147} cy={128} r="3.5"
              fill="#fff"
              animate={{
                cx: 151 + pupilX * 0.6,
                cy: 123 + pupilY * 0.6,
                opacity: isBlinking ? 0 : 0.9,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* ===== SHY STATE — paws over eyes + blush ===== */}
      {state === 'shy' && (
        <motion.g
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {/* Left paw */}
          <ellipse cx="93" cy="126" rx="27" ry="22" fill={body} stroke={accent} strokeWidth="1.2" />
          <circle cx="82" cy="120" r="6" fill={pad} opacity="0.45" />
          <circle cx="93" cy="117" r="5.5" fill={pad} opacity="0.45" />
          <circle cx="104" cy="120" r="5" fill={pad} opacity="0.45" />

          {/* Right paw */}
          <ellipse cx="147" cy="126" rx="27" ry="22" fill={body} stroke={accent} strokeWidth="1.2" />
          <circle cx="136" cy="120" r="5" fill={pad} opacity="0.45" />
          <circle cx="147" cy="117" r="5.5" fill={pad} opacity="0.45" />
          <circle cx="158" cy="120" r="6" fill={pad} opacity="0.45" />

          {/* Blush peeking below paws */}
          <circle cx="75" cy="146" r="11" fill={blush} opacity="0.35" />
          <circle cx="165" cy="146" r="11" fill={blush} opacity="0.35" />
        </motion.g>
      )}

      {/* ===== NOSE ===== */}
      <ellipse cx="120" cy="153" rx="11" ry="7" fill={nose} />
      <ellipse cx="117" cy="150" rx="3.5" ry="2" fill="#5A7585" opacity="0.5" />

      {/* ===== MOUTH ===== */}
      <motion.path
        d={
          state === 'happy'
            ? 'M 102 165 Q 120 185, 138 165'
            : state === 'sad'
              ? 'M 106 172 Q 120 162, 134 172'
              : 'M 107 166 Q 120 177, 133 166'
        }
        fill="none"
        stroke={mouth}
        strokeWidth="2.8"
        strokeLinecap="round"
        animate={{
          d: state === 'happy'
            ? 'M 102 165 Q 120 185, 138 165'
            : state === 'sad'
              ? 'M 106 172 Q 120 162, 134 172'
              : 'M 107 166 Q 120 177, 133 166',
        }}
        transition={{ duration: 0.3 }}
      />
      {/* Happy open mouth fill */}
      {state === 'happy' && (
        <motion.path
          d="M 102 165 Q 120 185, 138 165"
          fill="#3A5060"
          opacity="0.3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
        />
      )}

      {/* ===== LEFT ARM/PAW ===== */}
      <motion.g
        animate={
          state === 'shy' ? { y: -35, x: 18 } : { y: 0, x: 0 }
        }
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <ellipse cx="38" cy="188" rx="22" ry="16" fill={body} transform="rotate(-15 38 188)" />
        <circle cx="26" cy="183" r="5.5" fill={pad} opacity="0.4" />
        <circle cx="35" cy="179" r="5" fill={pad} opacity="0.4" />
        <circle cx="44" cy="181" r="4.5" fill={pad} opacity="0.4" />
      </motion.g>

      {/* ===== RIGHT ARM/PAW + COFFEE CUP ===== */}
      <motion.g
        animate={
          state === 'happy'
            ? { rotate: [-5, -22, -5], y: [0, -10, 0], transition: { duration: 0.6, repeat: 2 } }
            : state === 'shy'
              ? { y: -35, x: -18 }
              : state === 'sad'
                ? { rotate: 6, y: 6 }
                : { rotate: 0, y: 0 }
        }
        style={{ transformOrigin: '202px 188px' }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <ellipse cx="202" cy="188" rx="22" ry="16" fill={body} transform="rotate(15 202 188)" />
        <circle cx="196" cy="181" r="4.5" fill={pad} opacity="0.4" />
        <circle cx="205" cy="179" r="5" fill={pad} opacity="0.4" />
        <circle cx="214" cy="183" r="5.5" fill={pad} opacity="0.4" />

        {/* Coffee cup */}
        <rect x="188" y="170" width="28" height="22" rx="4" fill={cup} />
        <rect x="192" y="174" width="20" height="7" rx="2" fill={coffee} />
        <path d="M 216 176 Q 227 183, 216 191" fill="none" stroke={cup} strokeWidth="3.5" strokeLinecap="round" />

        {/* Steam */}
        <motion.g
          animate={{ opacity: [0.25, 0.65, 0.25], y: [0, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M 198 168 Q 195 159, 200 152" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5" />
          <path d="M 206 168 Q 209 157, 205 150" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.4" />
          <path d="M 213 169 Q 215 161, 212 155" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.3" />
        </motion.g>
      </motion.g>

      {/* ===== FEET WITH TOE BEANS ===== */}
      <g>
        {/* Left foot */}
        <ellipse cx="88" cy="248" rx="28" ry="12" fill={body} />
        <ellipse cx="88" cy="250" rx="18" ry="7" fill={pad} opacity="0.25" />
        <circle cx="76" cy="244" r="5.5" fill={pad} opacity="0.35" />
        <circle cx="87" cy="242" r="6" fill={pad} opacity="0.35" />
        <circle cx="98" cy="244" r="5.5" fill={pad} opacity="0.35" />

        {/* Right foot */}
        <ellipse cx="152" cy="248" rx="28" ry="12" fill={body} />
        <ellipse cx="152" cy="250" rx="18" ry="7" fill={pad} opacity="0.25" />
        <circle cx="142" cy="244" r="5.5" fill={pad} opacity="0.35" />
        <circle cx="153" cy="242" r="6" fill={pad} opacity="0.35" />
        <circle cx="164" cy="244" r="5.5" fill={pad} opacity="0.35" />
      </g>

      {/* ===== HAPPY SPARKLES ===== */}
      {state === 'happy' && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <motion.text x="20" y="55" fontSize="22"
            animate={{ opacity: [0, 1, 0], y: [55, 32], scale: [0.5, 1.3] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4 }}
          >
            ✨
          </motion.text>
          <motion.text x="205" y="50" fontSize="22"
            animate={{ opacity: [0, 1, 0], y: [50, 28], scale: [0.5, 1.3] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.6, delay: 0.3 }}
          >
            ✨
          </motion.text>
          <motion.text x="48" y="38" fontSize="16"
            animate={{ opacity: [0, 1, 0], y: [38, 18] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.8, delay: 0.6 }}
          >
            ☕
          </motion.text>
        </motion.g>
      )}
    </motion.svg>
  );
}
