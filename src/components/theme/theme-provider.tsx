"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type AccessibleThemeMode =
  | "high-contrast-cyberpunk"
  | "colorblind-deuteranopia-protanopia"
  | "colorblind-tritanopia"
  | "opendyslexic-reading";

export interface ThemePaletteSpec {
  mode: AccessibleThemeMode;
  label: string;
  backgroundHex: string;
  foregroundHex: string;
  largeTextHex: string;
  normalTextContrastRatio: number;
  largeTextContrastRatio: number;
  monacoFontFamily: string;
  letterSpacing: string;
  lineHeight: number;
  useGeometricShapeIndicators: boolean;
}

export const ACCESSIBLE_STORAGE_KEY = "codepulse:accessible-theme-state:v1";

export const ACCESSIBLE_THEME_PALETTES: Record<AccessibleThemeMode, ThemePaletteSpec> = {
  "high-contrast-cyberpunk": {
    mode: "high-contrast-cyberpunk",
    label: "High-Contrast Cyberpunk",
    backgroundHex: "#050508",
    foregroundHex: "#FFFFFF",
    largeTextHex: "#FDE047",
    normalTextContrastRatio: 20.4,
    largeTextContrastRatio: 17.8,
    monacoFontFamily: '"JetBrains Mono", "Atkinson Hyperlegible", monospace',
    letterSpacing: "0.02em",
    lineHeight: 1.65,
    useGeometricShapeIndicators: false,
  },
  "colorblind-deuteranopia-protanopia": {
    mode: "colorblind-deuteranopia-protanopia",
    label: "Deuteranopia / Protanopia Mode",
    backgroundHex: "#0A0C14",
    foregroundHex: "#FFFFFF",
    largeTextHex: "#38BDF8",
    normalTextContrastRatio: 18.9,
    largeTextContrastRatio: 10.6,
    monacoFontFamily: '"Atkinson Hyperlegible", monospace',
    letterSpacing: "0.03em",
    lineHeight: 1.7,
    useGeometricShapeIndicators: true,
  },
  "colorblind-tritanopia": {
    mode: "colorblind-tritanopia",
    label: "Tritanopia Mode",
    backgroundHex: "#0B0910",
    foregroundHex: "#FFFFFF",
    largeTextHex: "#FB7185",
    normalTextContrastRatio: 19.2,
    largeTextContrastRatio: 8.4,
    monacoFontFamily: '"Atkinson Hyperlegible", monospace',
    letterSpacing: "0.03em",
    lineHeight: 1.7,
    useGeometricShapeIndicators: true,
  },
  "opendyslexic-reading": {
    mode: "opendyslexic-reading",
    label: "OpenDyslexic Reading Mode",
    backgroundHex: "#FEFCE8",
    foregroundHex: "#09090B",
    largeTextHex: "#1D4ED8",
    normalTextContrastRatio: 19.6,
    largeTextContrastRatio: 8.1,
    monacoFontFamily: '"OpenDyslexic", "Atkinson Hyperlegible", monospace',
    letterSpacing: "0.06em",
    lineHeight: 1.85,
    useGeometricShapeIndicators: true,
  },
};

function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function computeWcagContrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function formatBionicReadingComment(commentText: string): Array<{
  lead: string;
  rest: string;
}> {
  return commentText.split(/(\s+)/).map((token) => {
    if (!/[a-zA-Z0-9]/.test(token)) {
      return { lead: "", rest: token };
    }
    const leadLen = Math.max(1, Math.ceil(token.length * 0.45));
    return {
      lead: token.slice(0, leadLen),
      rest: token.slice(leadLen),
    };
  });
}

export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

export function cycleFocusWithoutTrap(
  container: HTMLElement | null,
  currentElement: HTMLElement | null,
  reverse = false,
): HTMLElement | null {
  const focusables = getFocusableElements(container);
  if (focusables.length === 0) return null;
  if (!currentElement) return focusables[0];
  const idx = focusables.indexOf(currentElement);
  if (idx === -1) return focusables[0];
  const nextIdx = reverse
    ? (idx - 1 + focusables.length) % focusables.length
    : (idx + 1) % focusables.length;
  const nextEl = focusables[nextIdx];
  nextEl.focus();
  return nextEl;
}

export interface AccessibleThemeContextValue {
  mode: AccessibleThemeMode;
  palette: ThemePaletteSpec;
  bionicReadingEnabled: boolean;
  setMode: (nextMode: AccessibleThemeMode) => void;
  setBionicReadingEnabled: (enabled: boolean) => void;
  toggleBionicReading: () => void;
}

const AccessibleThemeContext = createContext<AccessibleThemeContextValue | null>(null);

export const AccessibleThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultMode?: AccessibleThemeMode;
  defaultBionicReading?: boolean;
}> = ({
  children,
  defaultMode = "high-contrast-cyberpunk",
  defaultBionicReading = false,
}) => {
  const [mode, setModeState] = useState<AccessibleThemeMode>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(ACCESSIBLE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.mode && ACCESSIBLE_THEME_PALETTES[parsed.mode as AccessibleThemeMode]) {
            return parsed.mode as AccessibleThemeMode;
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return defaultMode;
  });

  const [bionicReadingEnabled, setBionicReadingEnabledState] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(ACCESSIBLE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.bionicReadingEnabled === "boolean") {
            return parsed.bionicReadingEnabled;
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return defaultBionicReading;
  });

  const persistState = useCallback(
    (nextMode: AccessibleThemeMode, nextBionic: boolean) => {
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem(
            ACCESSIBLE_STORAGE_KEY,
            JSON.stringify({ mode: nextMode, bionicReadingEnabled: nextBionic }),
          );
        } catch {
          // ignore storage errors
        }
      }
    },
    [],
  );

  const setMode = useCallback(
    (nextMode: AccessibleThemeMode) => {
      setModeState(nextMode);
      persistState(nextMode, bionicReadingEnabled);
    },
    [bionicReadingEnabled, persistState],
  );

  const setBionicReadingEnabled = useCallback(
    (enabled: boolean) => {
      setBionicReadingEnabledState(enabled);
      persistState(mode, enabled);
    },
    [mode, persistState],
  );

  const toggleBionicReading = useCallback(() => {
    setBionicReadingEnabledState((prev) => {
      const next = !prev;
      persistState(mode, next);
      return next;
    });
  }, [mode, persistState]);

  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("data-accessible-mode", mode);
    }
  }, [mode]);

  const palette = ACCESSIBLE_THEME_PALETTES[mode];

  return (
    <AccessibleThemeContext.Provider
      value={{
        mode,
        palette,
        bionicReadingEnabled,
        setMode,
        setBionicReadingEnabled,
        toggleBionicReading,
      }}
    >
      {children}
    </AccessibleThemeContext.Provider>
  );
};

export function useAccessibleTheme(): AccessibleThemeContextValue {
  const ctx = useContext(AccessibleThemeContext);
  if (!ctx) {
    throw new Error("useAccessibleTheme must be used inside AccessibleThemeProvider");
  }
  return ctx;
}
