import { Link } from "react-router-dom";
import content from "@/data/content/en/createlisting.json";

function CreateListingPage() {
  return (
    <div>
      <h1>{content.heading}</h1>
      <p>
        <Link to="/dashboard" className="usa-button usa-button--unstyled">
          {content.returnToDashboard}
        </Link>
      </p>

      <form className="usa-form usa-form--large">
        <fieldset className="usa-fieldset">
          <legend className="usa-legend font-heading-lg text-bold">Location</legend>

          <label htmlFor="mailing-address-1" className="usa-label">
            Street address 1
          </label>
          <input
            id="mailing-address-1"
            name="mailing-address-1"
            type="text"
            className="usa-input "
            required
          />

          <label htmlFor="mailing-address-2" className="usa-label ">
            Street address 2 <span className="usa-hint">(optional)</span>
          </label>
          <input
            id="mailing-address-2"
            name="mailing-address-2"
            type="text"
            className="usa-input "
          />

          <div className="grid-row grid-gap">
            <div className="mobile-lg:grid-col-8">
              <label htmlFor="city" className="usa-label ">
                City
              </label>
              <input id="city" name="city" type="text" className="usa-input " required />
            </div>
            <div className="mobile-lg:grid-col-4">
              <label htmlFor="state" className="usa-label ">
                State
              </label>
              <select id="state" name="state" className="usa-select" required>
                <option value="" selected disabled>
                  Select
                </option>
                <option value="NJ">New Jersey</option>
              </select>
            </div>
          </div>

          <label htmlFor="zip" className="usa-label ">
            ZIP
          </label>
          <input
            id="zip"
            name="zip"
            type="text"
            pattern="[0-9]{5}(-[0-9]{4})?"
            className="usa-input usa-input--medium "
            required
          />
        </fieldset>

        <div className="usa-form-group">
          <fieldset className="usa-fieldset">
            <legend className="usa-legend font-heading-lg text-bold">Property details</legend>

            <div className="usa-form-group ">
              <fieldset className="usa-fieldset">
                <legend className="usa-legend ">Pets allowed</legend>

                <div id="with-hint-input-hint" className="usa-hint">
                  Are pets allowed in the property?
                </div>
                <div className="usa-checkbox ">
                  <input
                    type="checkbox"
                    name="checkbox-group"
                    value="checkbox1"
                    className="usa-checkbox__input"
                    id="pets1"
                  />
                  <label className="usa-checkbox__label" htmlFor="pets1">
                    Dogs
                  </label>
                </div>
                <div className="usa-checkbox ">
                  <input
                    type="checkbox"
                    name="checkbox-group"
                    value="checkbox2"
                    className="usa-checkbox__input"
                    id="pets2"
                  />
                  <label className="usa-checkbox__label" htmlFor="pets2">
                    Cats
                  </label>
                </div>
                <div className="usa-checkbox ">
                  <input
                    type="checkbox"
                    name="checkbox-group"
                    value="checkbox3"
                    className="usa-checkbox__input"
                    id="pets3"
                  />
                  <label className="usa-checkbox__label" htmlFor="pets3">
                    No pets
                  </label>
                </div>
              </fieldset>
            </div>
          </fieldset>
        </div>

        <button type="submit" className="usa-button">
          Create Listing
        </button>
      </form>
    </div>
  );
}

export default CreateListingPage;
