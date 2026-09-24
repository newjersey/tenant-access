type GtagArg = string | Date | Record<string, unknown>;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: GtagArg[]) => void;
  }
}

let initialized = false;

export function initAnalytics(): void {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (initialized || !measurementId) {
    return;
  }
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false,
    debug_mode: import.meta.env.DEV,
  });
}

export function trackPageView(path: string): void {
  if (!import.meta.env.VITE_GA_MEASUREMENT_ID || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
