import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  BADGE_TIER_ORDER,
  buildBadgeShaderUniforms,
  getBadgeTierConfig,
} from "../../types/badge";
import { HolographicBadgeShader } from "./holographic-badge-shader";

describe("HolographicBadgeShader & Tier Shader Uniform Configuration", () => {
  it("configures distinct metallic palettes, iridescence, and top-tier sparks across all 7 badge tiers", () => {
    const seenPrimary = new Set<string>();

    for (const tier of BADGE_TIER_ORDER) {
      const cfg = getBadgeTierConfig(tier);
      seenPrimary.add(cfg.primaryHex);

      const uniforms = buildBadgeShaderUniforms(tier, [0.4, -0.25], 1.5);
      expect(uniforms.uTilt).toEqual([0.4, -0.25]);
      expect(uniforms.uIridescence).toBeGreaterThan(0);

      if (tier === "Diamond" || tier === "Master" || tier === "Grandmaster") {
        expect(cfg.enableParticleSparks).toBe(true);
        expect(cfg.sparkCount).toBeGreaterThan(0);
        expect(uniforms.uSparkIntensity).toBe(1.0);
      } else {
        expect(cfg.enableParticleSparks).toBe(false);
        expect(uniforms.uSparkIntensity).toBe(0.0);
      }
    }

    expect(seenPrimary.size).toBe(7);
  });

  it("falls back automatically to accessible 2D SVG when WebGL is unavailable or reduced-motion is set", () => {
    render(
      <HolographicBadgeShader
        badge={{
          id: "badge-gm-1",
          title: "Top 1% Architect",
          tier: "Grandmaster",
          percentileLabel: "Top 0.5% Global",
        }}
      />,
    );

    // In JSDOM getContext('webgl') returns null -> automatically activates high-res SVG fallback
    expect(screen.getByTestId("holographic-badge-container").getAttribute("data-render-mode")).toBe(
      "svg-fallback",
    );
    expect(screen.getByTestId("holographic-badge-svg-fallback")).toBeTruthy();
    expect(screen.getByTestId("holographic-tier-sparks").textContent).toContain("32 sparks");
  });

  it("initializes WebGL shader uniforms, responds to pointer/gyroscope tilt, and disposes GL resources on unmount", () => {
    const deleteProgram = vi.fn();
    const deleteShader = vi.fn();
    const deleteBuffer = vi.fn();
    const loseContext = vi.fn();
    const onDispose = vi.fn();

    const mockGl: any = {
      VERTEX_SHADER: 35633,
      FRAGMENT_SHADER: 35632,
      COMPILE_STATUS: 35713,
      LINK_STATUS: 35714,
      ARRAY_BUFFER: 34962,
      STATIC_DRAW: 35044,
      FLOAT: 5126,
      TRIANGLES: 4,
      createShader: vi.fn(() => ({})),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn(() => true),
      deleteShader,
      createProgram: vi.fn(() => ({})),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      deleteProgram,
      useProgram: vi.fn(),
      createBuffer: vi.fn(() => ({})),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      deleteBuffer,
      getAttribLocation: vi.fn(() => 0),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      getUniformLocation: vi.fn(() => ({})),
      viewport: vi.fn(),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      uniform3f: vi.fn(),
      drawArrays: vi.fn(),
      getExtension: vi.fn(() => ({ loseContext })),
    };

    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockGl) as any;

    try {
      const { unmount } = render(
        <HolographicBadgeShader
          badge={{
            id: "badge-diamond-1",
            title: "Diamond Algorithmist",
            tier: "Diamond",
          }}
          onWebglDispose={onDispose}
        />,
      );

      const container = screen.getByTestId("holographic-badge-container");
      expect(container.getAttribute("data-render-mode")).toBe("webgl-shader");

      fireEvent.pointerMove(container, { clientX: 180, clientY: 40 });
      fireEvent(
        window,
        Object.assign(new Event("deviceorientation"), { gamma: 22.5, beta: 60 }),
      );

      unmount();

      expect(deleteBuffer).toHaveBeenCalledTimes(1);
      expect(deleteProgram).toHaveBeenCalledTimes(1);
      expect(deleteShader).toHaveBeenCalledTimes(2);
      expect(loseContext).toHaveBeenCalledTimes(1);
      expect(onDispose).toHaveBeenCalledTimes(1);
    } finally {
      HTMLCanvasElement.prototype.getContext = origGetContext;
    }
  });
});
