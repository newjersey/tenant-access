import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/* biome-ignore lint/suspicious/noConsole: jsdom has not implemented <search>
so react-dom reports the correct element as an "unknown" tag
when running tests unless suppressed like this.
Real browsers support it (including Playwright). */
const originalError = console.error;
console.error = (...args: Parameters<typeof console.error>) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("The tag <%s> is unrecognized") &&
    args[1] === "search"
  ) {
    return;
  }
  originalError(...args);
};

const mediaQueryLists = new Map<string, MediaQueryList>();

window.matchMedia = (media: string): MediaQueryList => {
  let list = mediaQueryLists.get(media);

  if (!list) {
    list = Object.assign(new EventTarget(), {
      media,
      matches: false,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    }) as unknown as MediaQueryList;
    mediaQueryLists.set(media, list);
  }

  return list;
};

afterEach(() => {
  cleanup();
});
