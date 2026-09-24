import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function loadAnalytics() {
  return import("./analytics");
}

// gtag pushes to window.dataLayer in tests
function gtagCalls(command: string): unknown[][] {
  const dataLayer = window.dataLayer ?? [];
  return dataLayer
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter(([name]) => name === command);
}

beforeEach(() => {
  vi.resetModules();
  document.head.innerHTML = "";
  Reflect.set(window, "dataLayer", undefined);
  Reflect.set(window, "gtag", undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function loadedGtagScripts(): NodeListOf<HTMLScriptElement> {
  return document.head.querySelectorAll<HTMLScriptElement>(
    'script[src*="googletagmanager.com/gtag/js"]',
  );
}

describe("analytics", () => {
  describe("when VITE_GA_MEASUREMENT_ID is unset", () => {
    it("does not load gtag.js or install the stub", async () => {
      vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
      const { initAnalytics, trackPageView } = await loadAnalytics();

      initAnalytics();
      trackPageView("/search");

      expect(loadedGtagScripts()).toHaveLength(0);
      expect(window.gtag).toBeUndefined();
      expect(window.dataLayer).toBeUndefined();
    });
  });

  describe("when VITE_GA_MEASUREMENT_ID is set", () => {
    const MEASUREMENT_ID = "G-TEST123";

    beforeEach(() => {
      vi.stubEnv("VITE_GA_MEASUREMENT_ID", MEASUREMENT_ID);
    });

    it("loads gtag.js for the configured property exactly once", async () => {
      const { initAnalytics } = await loadAnalytics();

      initAnalytics();
      initAnalytics(); // no effect if called second time

      const scripts = loadedGtagScripts();
      expect(scripts).toHaveLength(1);
      expect(scripts[0].src).toContain(`id=${MEASUREMENT_ID}`);
    });

    it("configures GA4 with the automatic page_view disabled", async () => {
      const { initAnalytics } = await loadAnalytics();

      initAnalytics();

      const [configCall] = gtagCalls("config");
      expect(configCall).toEqual([
        "config",
        MEASUREMENT_ID,
        expect.objectContaining({ send_page_view: false }),
      ]);
    });

    it("pushes a page_view event carrying the given path", async () => {
      const { initAnalytics, trackPageView } = await loadAnalytics();

      initAnalytics();
      trackPageView("/search?location=Newark&bathroom=2");

      const [pageViewCall] = gtagCalls("event");
      expect(pageViewCall).toEqual([
        "event",
        "page_view",
        expect.objectContaining({ page_path: "/search?location=Newark&bathroom=2" }),
      ]);
    });

    it("does not push a page_view before gtag is initialized", async () => {
      const { trackPageView } = await loadAnalytics();

      trackPageView("/search");

      expect(window.dataLayer).toBeUndefined();
    });
  });
});
