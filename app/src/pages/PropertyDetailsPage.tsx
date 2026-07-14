import { Splide, SplideSlide } from "@splidejs/react-splide";
import { Link } from "react-router-dom";

function PropertyDetailsPage() {
  return (
    <div>
      <Link to="/search" className="usa-button usa-button--unstyled">
        <svg className="usa-icon" aria-hidden="true" focusable="false" role="img">
          <use href="/images/sprite.svg#arrow_back"></use>
        </svg>
        Return to listings
      </Link>

      <div role="alert" className="usa-alert usa-alert--warning usa-alert--slim">
        <div className="usa-alert__body">
          <p className="usa-alert__text">This property is income restricted.</p>
        </div>
      </div>

      <div role="alert" className="usa-alert usa-alert--info usa-alert--slim">
        <div className="usa-alert__body">
          <p className="usa-alert__text">This property has a waiting list.</p>
        </div>
      </div>

      <div className="grid-container">
        <div className="grid-row grid-gap">
          <div className="tablet:grid-col-7">
            <h1 className="display-flex flex-align-center">Clifton Main Mews</h1>

            <h2>Basic information</h2>

            <ul className="usa-list">
              <li>
                <strong>Address</strong>: 988 Main Ave, Clifton, NJ
              </li>
              <li>
                <strong>Rent</strong>: $877/month
              </li>
              <li>
                <strong>Deposit</strong>: $877
              </li>
              <li>1 Bed • 1 Bath • Apartments</li>
              <li>700 sq.ft. • Built 2017 (approx.)</li>
            </ul>

            <h2>Requirements</h2>

            <ul className="usa-list">
              <li>One Year Lease</li>
              <li>Utilities Included: Water, Sewer, Trash Pickup</li>
              <li>No Application Fee Application Fee</li>
              <li>Background Check Policy</li>
            </ul>

            <table className="usa-table">
              <tr>
                <th scope="row">
                  <strong>Contact</strong>
                </th>
                <td>
                  Fern Spinazzola
                  <br />
                  Regan Development Corp., Property Manager or Realtor
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <strong>Phone</strong>
                </th>
                <td>914-693-6613</td>
              </tr>
              <tr>
                <th scope="row">
                  <strong>Fax</strong>
                </th>
                <td>833-954-0003</td>
              </tr>
              <tr>
                <th scope="row">
                  <strong>Email</strong>
                </th>
                <td>rentals@regandevelopment.com</td>
              </tr>
              <tr>
                <th scope="row">
                  <strong>Physical address</strong>
                </th>
                <td>1055 Saw Mill River Road, Suite 204, Ardsley, NY 10502</td>
              </tr>
            </table>

            <table className="usa-table">
              <caption>Basic features</caption>
              <tr>
                <th scope="row">
                  <strong>Example</strong>
                </th>
                <td>Example</td>
              </tr>
            </table>

            <table className="usa-table">
              <caption>Utilities</caption>
              <tr>
                <th scope="row">
                  <strong>Example</strong>
                </th>
                <td>Example</td>
              </tr>
            </table>

            <table className="usa-table">
              <caption>Accessibility</caption>
              <tr>
                <th scope="row">
                  <strong>Example</strong>
                </th>
                <td>Example</td>
              </tr>
            </table>

            <table className="usa-table">
              <caption>Safety</caption>
              <tr>
                <th scope="row">
                  <strong>Example</strong>
                </th>
                <td>Example</td>
              </tr>
            </table>

            <table className="usa-table">
              <caption>Nearby services</caption>
              <tr>
                <th scope="row">
                  <strong>Example</strong>
                </th>
                <td>Example</td>
              </tr>
            </table>

            <table className="usa-table">
              <caption>Comments</caption>
              <tr>
                <th scope="row">
                  <strong>Example</strong>
                </th>
                <td>Example</td>
              </tr>
            </table>
          </div>

          <div className="tablet:grid-col padding-top-3">
            <Splide aria-label="My Favorite Images">
              <SplideSlide>
                <img src="https://placehold.co/500x500" alt="500 x 500 placeholder" />
              </SplideSlide>
              <SplideSlide>
                <img src="https://placehold.co/500x500" alt="500 x 500 placeholder" />
              </SplideSlide>
              <SplideSlide>
                <img src="https://placehold.co/500x500" alt="500 x 500 placeholder" />
              </SplideSlide>
              <SplideSlide>
                <img src="https://placehold.co/500x500" alt="500 x 500 placeholder" />
              </SplideSlide>
            </Splide>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetailsPage;
