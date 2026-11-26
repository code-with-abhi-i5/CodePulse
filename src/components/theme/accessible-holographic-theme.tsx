"use client";

import React, { useEffect, useRef } from "react";
import { Check, X, BookOpen, Eye, Keyboard } from "lucide-react";
import {
  ACCESSIBLE_THEME_PALETTES,
  AccessibleThemeMode,
  AccessibleThemeProvider,
  computeWcagContrastRatio,
  formatBionicReadingComment,
  useAccessibleTheme,
} from "./theme-provider";
import "../../styles/accessibility.css";

export interface StatusIndicatorItem {
  id: string;
  label: string;
  passed: boolean;
}

export interface AccessibleHolographicThemeProps {
  codeSample?: string;
  commentSample?: string;
  statusItems?: StatusIndicatorItem[];
  onShortcutTriggered?: (shortcut: string) => void;
}

const DEFAULT_STATUS_ITEMS: StatusIndicatorItem[] = [
  { id: "test-1", label: "Boundary Overflow Guard", passed: true },
  { id: "test-2", label: "Null Pointer Check", passed: false },
];

const AccessibleThemeInner: React.FC<AccessibleHolographicThemeProps> = ({
  codeSample = "// Check boundary inputs before array indexing\nexport function safeGet(arr: number[], idx: number): number {\n  return idx >= 0 && idx < arr.length ? arr[idx] : -1;\n}",
  commentSample = "Verify binary search invariants across empty and single-element arrays.",
  statusItems = DEFAULT_STATUS_ITEMS,
  onShortcutTriggered,
}) => {
  const {
    mode,
    palette,
    bionicReadingEnabled,
    setMode,
    toggleBionicReading,
  } = useAccessibleTheme();

  const rootRef = useRef<HTMLDivElement | null>(null);

  const normalRatio = computeWcagContrastRatio(palette.backgroundHex, palette.foregroundHex);
  const largeRatio = computeWcagContrastRatio(palette.backgroundHex, palette.largeTextHex);

  // Keyboard shortcuts: Alt+1..4 for modes, Alt+B for Bionic Reading
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const modeKeys: Record<string, AccessibleThemeMode> = {
        "1": "high-contrast-cyberpunk",
        "2": "colorblind-deuteranopia-protanopia",
        "3": "colorblind-tritanopia",
        "4": "opendyslexic-reading",
      };
      if (modeKeys[e.key]) {
        e.preventDefault();
        setMode(modeKeys[e.key]);
        onShortcutTriggered?.(`Alt+${e.key}`);
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleBionicReading();
        onShortcutTriggered?.("Alt+B");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setMode, toggleBionicReading, onShortcutTriggered]);

  const bionicTokens = formatBionicReadingComment(commentSample);

  return (
    <section
      ref={rootRef}
      data-testid="accessible-holographic-theme-shell"
      data-theme-mode={mode}
      data-wcag-aaa-compliant={String(normalRatio >= 7 && largeRatio >= 4.5)}
      style={{
        backgroundColor: palette.backgroundHex,
        color: palette.foregroundHex,
        fontFamily: palette.monacoFontFamily,
        letterSpacing: palette.letterSpacing,
        lineHeight: palette.lineHeight,
      }}
      className="space-y-5 rounded-2xl border-2 border-yellow-400/70 p-6 transition-colors"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-current/20 pb-4">
        <div>
          <h1
            data-testid="accessible-theme-heading"
            style={{ color: palette.largeTextHex }}
            className="text-2xl font-extrabold"
          >
            {palette.label} — WCAG 2.2 AAA
          </h1>
          <p data-testid="contrast-ratio-readout" className="text-sm font-medium">
            Normal Text Contrast: {normalRatio}:1 (≥7:1) · Large Text Contrast: {largeRatio}:1 (≥4.5:1)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="toggle-bionic-reading-btn"
            aria-pressed={bionicReadingEnabled}
            onClick={toggleBionicReading}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-yellow-400 px-3 py-1.5 text-sm font-bold focus-visible:ring-4 focus-visible:ring-yellow-400"
          >
            <BookOpen className="h-4 w-4" />
            Bionic Reading: {bionicReadingEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* 4 Specialized Mode Selector Buttons */}
      <div role="group" aria-label="Accessibility Theme Modes" className="flex flex-wrap gap-2">
        {(Object.keys(ACCESSIBLE_THEME_PALETTES) as AccessibleThemeMode[]).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              data-testid={`theme-mode-${m}`}
              aria-pressed={active}
              onClick={() => setMode(m)}
              className={`rounded-lg border-2 px-3 py-1.5 text-sm font-bold focus-visible:ring-4 focus-visible:ring-yellow-400 ${
                active ? "border-yellow-400 underline" : "border-current/40"
              }`}
            >
              {ACCESSIBLE_THEME_PALETTES[m].label}
            </button>
          );
        })}
      </div>

      {/* Bionic Reading Comment Box */}
      <div
        data-testid="bionic-comment-box"
        data-bionic-active={String(bionicReadingEnabled)}
        className="rounded-xl border border-current/30 p-4 text-base"
      >
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase">
          <Eye className="h-4 w-4" />
          <span>Code Comment Comprehension</span>
        </div>
        <p data-testid="bionic-comment-text">
          {bionicReadingEnabled
            ? bionicTokens.map((tok, idx) => (
                <React.Fragment key={idx}>
                  {tok.lead && <strong className="bionic-word-lead">{tok.lead}</strong>}
                  <span>{tok.rest}</span>
                </React.Fragment>
              ))
            : commentSample}
        </p>
      </div>

      {/* Monaco Editor Typography & Spacing Surface */}
      <div className="rounded-xl border border-current/30 p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase">
          <span>Monaco Editor Surface</span>
          <span data-testid="monaco-font-spec" className="font-mono">
            {palette.monacoFontFamily} · line-height {palette.lineHeight}
          </span>
        </div>
        <pre
          data-testid="monaco-accessible-code"
          style={{
            fontFamily: palette.monacoFontFamily,
            letterSpacing: palette.letterSpacing,
            lineHeight: palette.lineHeight,
          }}
          className="monaco-accessible-editor overflow-x-auto rounded-lg border border-current/20 p-3 text-sm"
        >
          {codeSample}
        </pre>
      </div>

      {/* Status Indicators (Checkmark vs Cross in Colorblind Modes) */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase">
          <Keyboard className="h-4 w-4" />
          <span>Assertion Status Indicators (Alt+1..4 Mode, Alt+B Bionic)</span>
        </div>
        <ul className="space-y-1.5">
          {statusItems.map((item) => (
            <li
              key={item.id}
              data-testid={`status-item-${item.id}`}
              className="flex items-center gap-2 rounded-lg border border-current/25 px-3 py-2 text-sm font-semibold"
            >
              {palette.useGeometricShapeIndicators ? (
                item.passed ? (
                  <Check
                    data-testid={`shape-check-${item.id}`}
                    aria-label="Passed (Checkmark)"
                    className="h-4 w-4 stroke-[3]"
                  />
                ) : (
                  <X
                    data-testid={`shape-cross-${item.id}`}
                    aria-label="Failed (Cross)"
                    className="h-4 w-4 stroke-[3]"
                  />
                )
              ) : (
                <span
                  data-testid={`dot-indicator-${item.id}`}
                  className={`inline-block h-3 w-3 rounded-full ${
                    item.passed ? "bg-emerald-400" : "bg-rose-500"
                  }`}
                />
              )}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export const AccessibleHolographicTheme: React.FC<
  AccessibleHolographicThemeProps & {
    defaultMode?: AccessibleThemeMode;
    defaultBionicReading?: boolean;
  }
> = ({ defaultMode, defaultBionicReading, ...props }) => {
  return (
    <AccessibleThemeProvider
      defaultMode={defaultMode}
      defaultBionicReading={defaultBionicReading}
    >
      <AccessibleThemeInner {...props} />
    </AccessibleThemeProvider>
  );
};

export default AccessibleHolographicTheme;
