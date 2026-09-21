import { ComboBox, type ComboBoxOption } from "@trussworks/react-uswds";
import { memo } from "react";
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
}

const LocationComboBox = memo(function LocationComboBox({
  id,
  defaultValue,
  onChange,
}: LocationComboBoxProps) {
  return (
    <ComboBox
      id={id}
      className="njhmf-location-combo-box"
      name="location"
      options={ALL_LOCATIONS}
      defaultValue={defaultValue}
      onChange={onChange}
      noResults={content.locationComboBox.noResults}
      inputProps={{ placeholder: content.locationComboBox.placeholder }}
    />
  );
});

export default LocationComboBox;
