export const RESULT_CAP = 1001;
const MAX_PAGE = 50;
const PAGE_SIZE = 20;

/** USWDS shows at most seven page-number slots before collapsing the middle into overflow. */
const MAX_SLOTS = 7;

export type PaginationSlot = number | "overflow-start" | "overflow-end";

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, offset) => from + offset);

export function lastPageOf(total: number): number {
  return total >= RESULT_CAP ? MAX_PAGE : Math.max(1, Math.ceil(total / PAGE_SIZE));
}

function boundedSlots(page: number, lastPage: number): PaginationSlot[] {
  if (lastPage <= MAX_SLOTS) {
    return range(1, lastPage);
  }

  if (page <= 4) {
    return [...range(1, 5), "overflow-end", lastPage];
  }

  if (page >= lastPage - 3) {
    return [1, "overflow-start", ...range(lastPage - 4, lastPage)];
  }

  return [1, "overflow-start", ...range(page - 1, page + 1), "overflow-end", lastPage];
}

function unboundedSlots(page: number): PaginationSlot[] {
  const highest = Math.min(Math.max(page + 1, 5), MAX_PAGE);
  const head: PaginationSlot[] =
    page <= 4 ? range(1, highest) : [1, "overflow-start", ...range(page - 1, highest)];

  return highest < MAX_PAGE ? [...head, "overflow-end"] : head;
}

export function paginationSlots(page: number, total: number): PaginationSlot[] {
  return total >= RESULT_CAP
    ? unboundedSlots(page)
    : boundedSlots(page, lastPageOf(total));
}
