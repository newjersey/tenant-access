import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FILTER_KEYS, type FilterKey } from "@/utils/searchQuery";

export function useSearchUpdates() {
  const [, setSearchParams] = useSearchParams();

  return useMemo(() => {
    const change = (changes: Record<string, string | null>) =>
      setSearchParams((current) => {
        const params = new URLSearchParams(current);

        for (const [key, value] of Object.entries({ ...changes, page: null })) {
          if (value) {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        }

        return params;
      });

    return {
      setLocation: (location: string | null) => change({ location }),
      setSort: (sort: string) => change({ sort }),
      setFilter: (name: FilterKey, value: string) => change({ [name]: value }),
      clearFilter: (name: FilterKey) => change({ [name]: null }),
      clearFilters: () => change(Object.fromEntries(FILTER_KEYS.map((key) => [key, null]))),
    };
  }, [setSearchParams]);
}
