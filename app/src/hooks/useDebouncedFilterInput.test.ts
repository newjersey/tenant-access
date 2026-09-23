import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FILTER_INPUT_DEBOUNCE_MS, useDebouncedFilterInput } from "@/hooks/useDebouncedFilterInput";

const renderAt = (url: string) =>
  renderHook(
    () => ({
      input: useDebouncedFilterInput("maxRent"),
      navigate: useNavigate(),
      ...useLocation(),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(MemoryRouter, { initialEntries: [url] }, children),
    },
  );

const stopTyping = () => act(() => vi.advanceTimersByTimeAsync(FILTER_INPUT_DEBOUNCE_MS));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedFilterInput", () => {
  it("writes to the URL once typing stops, not once per keystroke", async () => {
    const { result } = renderAt("/search?location=Newark&page=3");

    act(() => result.current.input.change("1"));
    act(() => result.current.input.change("12"));
    expect(result.current.search).toBe("?location=Newark&page=3");

    await stopTyping();
    expect(result.current.search).toBe("?location=Newark&maxRent=12");
  });

  it("follows the URL when the figure is dropped somewhere else", async () => {
    const { result } = renderAt("/search?maxRent=1200");

    act(() => result.current.input.change("95"));
    await stopTyping();
    expect(result.current.search).toBe("?maxRent=95");

    act(() => result.current.navigate("/search"));
    expect(result.current.input.value).toBe("");
  });

  it("forgets a figure still being typed when it is cleared", async () => {
    const { result } = renderAt("/search?location=Newark");

    act(() => result.current.input.change("1200"));
    act(() => result.current.input.clear());
    await stopTyping();

    expect(result.current.input.value).toBe("");
    expect(result.current.search).toBe("?location=Newark");
  });
});
