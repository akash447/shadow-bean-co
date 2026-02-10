import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { YetiState } from './Yeti';

interface YetiContextType {
  state: YetiState;
  lookAt: { x: number; y: number };
  setYetiState: (state: YetiState) => void;
  setLookAt: (pos: { x: number; y: number }) => void;
  trackInputCursor: (e: React.ChangeEvent<HTMLInputElement>, inputRef: HTMLInputElement | null) => void;
}

const YetiContext = createContext<YetiContextType | undefined>(undefined);

export function YetiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<YetiState>('idle');
  const [lookAt, setLookAtState] = useState({ x: 0, y: 0 });

  const setYetiState = useCallback((s: YetiState) => setState(s), []);
  const setLookAt = useCallback((pos: { x: number; y: number }) => setLookAtState(pos), []);

  // Convert text cursor position in an input to a normalized -1..1 lookAt value
  const trackInputCursor = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, inputRef: HTMLInputElement | null) => {
      if (!inputRef) return;
      const rect = inputRef.getBoundingClientRect();
      // Estimate cursor X position based on text length and character width
      const charWidth = 8;
      const textWidth = e.target.value.length * charWidth;
      const cursorX = Math.min(textWidth, rect.width);
      // Normalize to -1..1 relative to center of input
      const normalizedX = ((cursorX / rect.width) * 2 - 1) * 0.8;
      setLookAtState({ x: normalizedX, y: 0.2 });
    },
    []
  );

  return (
    <YetiContext.Provider value={{ state, lookAt, setYetiState, setLookAt, trackInputCursor }}>
      {children}
    </YetiContext.Provider>
  );
}

export function useYeti() {
  const context = useContext(YetiContext);
  if (!context) throw new Error('useYeti must be used within a YetiProvider');
  return context;
}

export default YetiContext;
