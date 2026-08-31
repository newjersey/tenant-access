import { ComboBox, type ComboBoxOption } from "@trussworks/react-uswds";
import content from "@/data/content/en/common.json";
import cities from "@/data/locations/cities.json";
import counties from "@/data/locations/counties.json";

 const options: ComboBoxOption[] = [
  ...counties.map((county) => ({ value: `${county} County`, label: `${county} County` })),
  ...cities.map((city) => ({ value: city, label: city })),
];

interface LocationComboBoxProps {
  id: string;
  defaultValue?: string;
  onChange: (location: string | undefined) => void;
}

function LocationComboBox({ id, defaultValue, onChange }: LocationComboBoxProps) {
  return (
    <ComboBox
      id={id}
      name="location"
      options={options}
      defaultValue={defaultValue}
      onChange={onChange}
      noResults={content.locationComboBox.noResults}
    />
  );
}

export default LocationComboBox;
