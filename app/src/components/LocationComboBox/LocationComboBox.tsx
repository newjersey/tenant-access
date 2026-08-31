import { ComboBox, type ComboBoxOption } from "@trussworks/react-uswds";
import "@/components/LocationComboBox/LocationComboBox.css";
import content from "@/data/content/en/common.json";
import citiesByCounty from "@/data/locations/cities-by-county.json";

const options: ComboBoxOption[] = Object.entries(citiesByCounty).flatMap(([county, cities]) => [
  { value: `${county} County`, label: `${county} County` },
  ...cities.map((city) => ({ value: city, label: city })),
]);

interface LocationComboBoxProps {
  id: string;
  defaultValue?: string;
  onChange: (location: string | undefined) => void;
}

function LocationComboBox({ id, defaultValue, onChange }: LocationComboBoxProps) {
  return (
    <ComboBox
      id={id}
      className="njhmf-location-combo-box"
      name="location"
      options={options}
      defaultValue={defaultValue}
      onChange={onChange}
      noResults={content.locationComboBox.noResults}
    />
  );
}

export default LocationComboBox;
