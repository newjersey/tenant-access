import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SCRIPT_SRC = "https://www.nj.gov/nj/design/js/translate-widget.js";

let TranslateWidget: typeof import("./TranslateWidget").default;

function makeWidget(currentLanguage = "en") {
  return {
    init: vi.fn(),
    translateFullPage: vi.fn().mockResolvedValue(undefined),
    currentLanguage,
    currentURL: "",
    cachedInputJson: { stale: true },
    cachedNodeMap: { stale: true },
    config: { defaultLanguage: "en", supportedLanguages: {} },
  };
}

function widgetScripts() {
  return document.head.querySelectorAll<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
}

async function fireScript(type: "load" | "error") {
  await act(async () => {
    widgetScripts()[0].dispatchEvent(new Event(type));
  });
}

function renderInRoot() {
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  return render(<TranslateWidget />, { container: root });
}

async function mutateRoot() {
  await act(async () => {
    document.getElementById("root")?.appendChild(document.createElement("span"));
  });
}

beforeEach(async () => {
  vi.resetModules();
  ({ default: TranslateWidget } = await import("./TranslateWidget"));
});

afterEach(() => {
  vi.useRealTimers();
  for (const script of widgetScripts()) script.remove();
  delete window.NJTranslateWidget;
  localStorage.clear();
});

describe("TranslateWidget", () => {
  it("renders the widget container and the disclaimer link", () => {
    const { container } = render(<TranslateWidget />);

    expect(container.querySelector("#translate-widget-container")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://www.nj.gov/nj/about/translator/",
    );
  });

  it("loads the NJ translate script only once across mounts", () => {
    render(<TranslateWidget />);
    render(<TranslateWidget />);

    expect(widgetScripts()).toHaveLength(1);
  });

  it("restricts the offered languages and initializes the widget once the script loads", async () => {
    const widget = makeWidget();
    window.NJTranslateWidget = widget;
    render(<TranslateWidget />);

    await fireScript("load");

    expect(widget.init).toHaveBeenCalledOnce();
    expect(Object.keys(widget.config.supportedLanguages)).toEqual([
      "en",
      "es",
      "pt",
      "ko",
      "gu",
      "zh",
      "zh-TW",
      "ht",
      "ar",
    ]);
  });

  it("does not re-initialize when the widget has already rendered into the container", async () => {
    const widget = makeWidget();
    window.NJTranslateWidget = widget;
    const { container } = render(<TranslateWidget />);
    container
      .querySelector("#translate-widget-container")
      ?.appendChild(document.createElement("select"));

    await fireScript("load");

    expect(widget.init).not.toHaveBeenCalled();
  });

  it("renders nothing when the script fails to load", async () => {
    const { container } = render(<TranslateWidget />);

    await fireScript("error");

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the script loads without defining the widget", async () => {
    const { container } = render(<TranslateWidget />);

    await fireScript("load");

    expect(container).toBeEmptyDOMElement();
  });

  it("does nothing if unmounted before the script loads", async () => {
    const widget = makeWidget();
    window.NJTranslateWidget = widget;
    const { unmount } = render(<TranslateWidget />);
    unmount();

    await fireScript("load");

    expect(widget.init).not.toHaveBeenCalled();
  });

  it("ignores a load failure that arrives after unmount", async () => {
    const { unmount } = render(<TranslateWidget />);
    unmount();

    await expect(fireScript("error")).resolves.toBeUndefined();
  });

  describe("retranslating after the page changes", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("re-runs the active translation against the new content, debounced", async () => {
      const widget = makeWidget("es");
      window.NJTranslateWidget = widget;
      renderInRoot();
      await fireScript("load");

      await mutateRoot();
      await mutateRoot();
      vi.advanceTimersByTime(499);
      expect(widget.translateFullPage).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(widget.translateFullPage.mock.calls).toEqual([["en"], ["es"]]);
      expect(widget.cachedInputJson).toBeNull();
      expect(widget.cachedNodeMap).toBeNull();
      expect(widget.currentURL).toBe(window.location.href);
    });
  });
});
