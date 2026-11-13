import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Hero3D } from "./hero-3d";

const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => reducedMotion.value };
});

describe("Hero3D Accessibility & prefers-reduced-motion (#92)", () => {
  beforeEach(() => {
    reducedMotion.value = false;
    vi.clearAllMocks();
  });

  it("renders with 3D perspective and keyframe styles when reduced motion is not preferred", () => {
    reducedMotion.value = false;

    const { container } = render(<Hero3D />);

    // Check title and headline
    expect(screen.getByText("Your GitHub,")).toBeInTheDocument();
    expect(screen.getByText("Gamified")).toBeInTheDocument();

    // Check that CSS <style> contains prefers-reduced-motion media queries
    const styleTag = container.querySelector("style");
    expect(styleTag).not.toBeNull();
    const cssContent = styleTag?.textContent || "";

    expect(cssContent).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(cssContent).toContain("@media (prefers-reduced-motion: reduce)");
    expect(cssContent).toContain(".hero-dashboard { animation: hero-float");
    expect(cssContent).toContain("animation: none !important");
    expect(cssContent).toContain("transform: none !important");

    // Main 3D dashboard container should have perspective
    const rightContainer = container.querySelector('[style*="perspective: 1200px"]');
    expect(rightContainer).not.toBeNull();

    const dashboard = container.querySelector(".hero-dashboard");
    expect(dashboard).toHaveStyle("transform-style: preserve-3d");

    // Floating particles should be present
    const particles = container.querySelectorAll(".hero-particle");
    expect(particles.length).toBeGreaterThan(0);
  });

  it("locks cards in neutral static alignment and hides particles when reduced motion is preferred", () => {
    reducedMotion.value = true;

    const { container } = render(<Hero3D />);

    // Content should remain readable and intact
    expect(screen.getByText("Your GitHub,")).toBeInTheDocument();
    expect(screen.getByText("Gamified")).toBeInTheDocument();
    expect(screen.getByText("CodePulse Analytics")).toBeInTheDocument();

    // Right container should disable 3D perspective
    const rightContainer = container.querySelector('[style*="perspective: none"]');
    expect(rightContainer).not.toBeNull();

    // Main dashboard card should disable 3D transformStyle
    const dashboard = container.querySelector(".hero-dashboard");
    expect(dashboard).toHaveStyle("transform-style: flat");

    // Floating particles should be completely omitted from the DOM
    const particles = container.querySelectorAll(".hero-particle");
    expect(particles.length).toBe(0);
  });
});
