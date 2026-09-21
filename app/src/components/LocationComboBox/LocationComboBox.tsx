import { memo } from "react";
import { ComboBox, type ComboBoxOption } from "@trussworks/react-uswds";
import "@/components/LocationComboBox/LocationComboBox.css";
import content from "@/data/content/en/common.json";
import citiesByCounty from "@/data/locations/cities-by-county.json";

export function locationOptions(byCounty: Record<string, string[]>): ComboBoxOption[] {
  return Object.entries(byCounty).flatMap(([county, cities]) => [
    { value: `${county} County`, label: `${county} County` },
    ...cities.map((city) => ({ value: city, label: city })),
  ]);
}

const ALL_LOCATIONS = locationOptions(citiesByCounty);

interface LocationComboBoxProps {
  id: string;
  defaultValue?: string;
  onChange: (location: string | undefined) => void;
  options?: ComboBoxOption[]; // can override options for tests
}

const LocationComboBox = memo(function LocationComboBox({
  id,
  defaultValue,
  onChange,
  options = ALL_LOCATIONS,
}: LocationComboBoxProps) {
  return (
    <ComboBox
      id={id}
      className="njhmf-location-combo-box"
      name="location"
      options={options}
      defaultValue={defaultValue}
      onChange={onChange}
      noResults={content.locationComboBox.noResults}
      inputProps={{ placeholder: content.locationComboBox.placeholder }}
    />
  );
});

export default LocationComboBox;
