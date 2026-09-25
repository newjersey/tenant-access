import type { ChangeEvent } from "react";
import type { DebouncedFilterInput } from "@/hooks/useDebouncedFilterInput";
import { DOLLAR_AMOUNT_DIGITS, type FilterKey, wholeDollars } from "@/utils/searchQuery";

interface AmountFilterProps {
  name: FilterKey;
  label: string;
  input: DebouncedFilterInput;
}

function AmountFilter({ name, label, input }: AmountFilterProps) {
  const id = `filter-${name}`;

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    input.change(wholeDollars(event.target.value));
  };

  return (
    <>
      <label className="usa-label" htmlFor={id}>
        {label}
      </label>
      <div className="usa-input-group usa-input-group--sm margin-top-1">
        <div className="usa-input-prefix" aria-hidden="true">
          $
        </div>
        <input
          className="usa-input"
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={DOLLAR_AMOUNT_DIGITS}
          value={input.value}
          onChange={change}
        />
      </div>
    </>
  );
}

export default AmountFilter;
