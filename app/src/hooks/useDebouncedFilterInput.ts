import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { type FilterKey, parseFilters, withFilter } from "@/utils/searchQuery";

export const FILTER_INPUT_DEBOUNCE_MS = 600;

export interface DebouncedFilterInput {
  value: string;
  change: (value: string) => void;
  clear: () => void;
}

export function useDebouncedFilterInput(name: FilterKey): DebouncedFilterInput {
  const [searchParams, setSearchParams] = useSearchParams();
  const inUrl = parseFilters(searchParams)[name] ?? "";
  const [value, setValue] = useState(inUrl);
  const applied = useRef(inUrl);

  useEffect(() => {
    if (inUrl !== applied.current) {
      applied.current = inUrl;
      setValue(inUrl);
    }
  }, [inUrl]);

  useEffect(() => {
    if (value === applied.current) return;

    const timer = setTimeout(() => {
      applied.current = value;
      setSearchParams((current) => withFilter(current, name, value));
    }, FILTER_INPUT_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [name, value, setSearchParams]);

  return {
    value,
    change: setValue,
    clear: () => {
      applied.current = "";
      setValue("");
    },
  };
}
