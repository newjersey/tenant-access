import { useEffect } from "react";
import content from "@/data/content/en/common.json";

const SCRIPT_SRC = "https://www.nj.gov/nj/design/js/translate-widget.js";
const CONTAINER_ID = "translate-widget-container";
const DISCLAIMER_URL = "https://www.nj.gov/nj/about/translator/";
const RETRANSLATE_DEBOUNCE_MS = 500;

type NJTranslateWidget = {
  init: () => void;
  translateFullPage: (lang: string) => Promise<void>;
  currentLanguage: string;
  currentURL: string;
  cachedInputJson: unknown;
  cachedNodeMap: unknown;
  config: { defaultLanguage: string };
};

declare global {
  interface Window {
    NJTranslateWidget?: NJTranslateWidget;
  }
}

let loadPromise: Promise<NJTranslateWidget> | null = null;

function loadWidget(): Promise<NJTranslateWidget> {
  loadPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () =>
      window.NJTranslateWidget
        ? resolve(window.NJTranslateWidget)
        : reject(new Error("NJTranslateWidget missing after script load"));
    script.onerror = () => reject(new Error(`Failed to load ${SCRIPT_SRC}`));
    document.head.appendChild(script);
  });
  return loadPromise;
}

// The widget snapshots the DOM once and never refreshes it, which breaks on SPA navigation
// and async results. Restore the old snapshot to English first so persistent chrome
// (header/footer) isn't re-extracted as already-translated "source" text.
function retranslate(widget: NJTranslateWidget) {
  const translated = widget.currentLanguage !== widget.config.defaultLanguage;
  if (translated) void widget.translateFullPage(widget.config.defaultLanguage);
  widget.cachedInputJson = null;
  widget.cachedNodeMap = null;
  widget.currentURL = window.location.href;
  if (translated) void widget.translateFullPage(widget.currentLanguage);
}

const TranslateWidget = () => {
  useEffect(() => {
    let observer: MutationObserver | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    loadWidget()
      .then((widget) => {
        // The script self-inits on DOMContentLoaded if it beat us there; StrictMode also double-mounts.
        if (!document.getElementById(CONTAINER_ID)?.hasChildNodes()) widget.init();

        const root = document.getElementById("root");
        if (!root) return;
        // childList only: the widget writes characterData/attributes, so this can't loop on itself.
        observer = new MutationObserver(() => {
          clearTimeout(timer);
          timer = setTimeout(() => retranslate(widget), RETRANSLATE_DEBOUNCE_MS);
        });
        observer.observe(root, { childList: true, subtree: true });
      })
      .catch((error) => console.error(error));

    return () => {
      observer?.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="njhmf-translate">
      <div id={CONTAINER_ID} />
      <a href={DISCLAIMER_URL} target="_blank" rel="noreferrer" className="font-sans-3xs">
        {content.header.translationDisclaimer}
      </a>
    </div>
  );
};

export default TranslateWidget;
