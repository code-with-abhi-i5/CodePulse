import { describe, it, expect, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-sans" }),
  JetBrains_Mono: () => ({ variable: "--font-geist-mono" }),
}));

import { APP_NAME, APP_DESCRIPTION } from "./constants";
import { metadata } from "@/app/layout";

describe("Project Rebranding (#69)", () => {
  it("should have APP_NAME set to CodePulse in constants", () => {
    expect(APP_NAME).toBe("CodePulse");
  });

  it("should describe CodePulse platform in APP_DESCRIPTION", () => {
    expect(APP_DESCRIPTION).toContain("GitHub Developer Analytics");
  });

  it("should configure root layout metadata with CodePulse title template", () => {
    expect(metadata.title).toEqual({
      template: "%s | CodePulse",
      default: "CodePulse — GitHub Developer Analytics & Gamification Platform",
    });
  });

  it("should configure OpenGraph metadata with CodePulse siteName", () => {
    expect(metadata.openGraph).toMatchObject({
      title: "CodePulse — GitHub Developer Analytics & Gamification",
      siteName: "CodePulse",
    });
  });

  it("should configure authors metadata with CodePulse", () => {
    expect(metadata.authors).toEqual([{ name: "CodePulse" }]);
  });
});
