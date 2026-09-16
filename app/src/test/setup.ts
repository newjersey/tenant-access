import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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
