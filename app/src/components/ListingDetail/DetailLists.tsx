import Icon from "@/components/Icon/Icon";
import type { Fact } from "@/utils/listingDetails";

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="usa-list usa-list--unstyled listing-detail__checklist">
      {[...new Set(items)].map((item) => (
        <li key={item}>
          <Icon icon="check" size="3" class="text-success-darker" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="listing-detail__facts">
      {facts.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            {Array.isArray(value) ? (
              <ul className="usa-list">
                {value.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
