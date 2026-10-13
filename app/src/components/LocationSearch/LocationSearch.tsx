import LocationComboBox from "@/components/LocationComboBox/LocationComboBox";
import content from "@/data/content/en/common.json";
import { ZIP_DIGITS } from "@/utils/searchQuery";

interface LocationSearchProps {
  id: string;
  label: string;
  defaultLocation?: string;
  zip: string;
  nearby: boolean;
  onLocationChange: (location: string | undefined) => void;
  onZipChange: (zip: string) => void;
  onNearbyChange: (nearby: boolean) => void;
}

const zipDigits = (raw: string): string => raw.replace(/\D/g, "").slice(0, ZIP_DIGITS);

function LocationSearch({
  id,
  label,
  defaultLocation,
  zip,
  nearby,
  onLocationChange,
  onZipChange,
  onNearbyChange,
}: LocationSearchProps) {
  return (
    <>
      <label className="usa-label" htmlFor={id}>
        {label}
      </label>
      <LocationComboBox id={id} defaultValue={defaultLocation} onChange={onLocationChange} />

      <p className="text-bold margin-top-2 margin-bottom-0">{content.locationSearch.or}</p>

      <label className="usa-label margin-top-1" htmlFor={`${id}-zip`}>
        {content.locationSearch.zip}
      </label>
      <input
        className="usa-input usa-input--small"
        id={`${id}-zip`}
        name="zip"
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        pattern="[0-9]{5}"
        maxLength={ZIP_DIGITS}
        value={zip}
        onChange={(event) => onZipChange(zipDigits(event.target.value))}
      />

      <div className="usa-checkbox margin-top-2">
        <input
          className="usa-checkbox__input"
          id={`${id}-nearby`}
          type="checkbox"
          name="nearby"
          checked={nearby}
          onChange={(event) => onNearbyChange(event.target.checked)}
        />
        <label className="usa-checkbox__label" htmlFor={`${id}-nearby`}>
          {content.locationSearch.nearby}
        </label>
      </div>
    </>
  );
}

export default LocationSearch;
