import { Splide, SplideSlide } from "@splidejs/react-splide";
import { Link } from "react-router-dom";
import Alert from "@/components/Alert/Alert";

function PropertyDetailsPage() {
  return (
    <>
      <Link to="/search" className="usa-button usa-button--unstyled">
        <svg className="usa-icon" aria-hidden="true" focusable="false" role="img">
          <use href="/images/sprite.svg#arrow_back"></use>
        </svg>
        Return to listings
      </Link>

      <Alert content="This property is income restricted" type="info" slim />

      <Alert content="This property has a waiting list" type="info" slim />

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

            <table className="usa-table width-full">
              <tbody>
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
                  <td>
                    1055 Saw Mill River Road, Suite 204
                    <br />
                    Ardsley, NY 10502
                  </td>
                </tr>
              </tbody>
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
          {/* .tablet:grid-col*/}
        </div>
        {/* .grid-row*/}

        <div className="grid-row grid-gap border-top margin-top-4 padding-top-4">
          <div className="tablet:grid-col">
            <table className="usa-table width-full">
              <caption>Basic features</caption>
              <tbody>
                <tr>
                  <th scope="row">
                    <strong>Example</strong>
                  </th>
                  <td>Example data for property</td>
                </tr>
              </tbody>
            </table>

            <table className="usa-table width-full">
              <caption>Accessibility</caption>
              <tbody>
                <tr>
                  <th scope="row">
                    <strong>Example</strong>
                  </th>
                  <td>Example data for property</td>
                </tr>
              </tbody>
            </table>

            <table className="usa-table width-full">
              <caption>Safety</caption>
              <tbody>
                <tr>
                  <th scope="row">
                    <strong>Example</strong>
                  </th>
                  <td>Example data for property</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="tablet:grid-col">
            <table className="usa-table width-full">
              <caption>Utilities</caption>
              <tbody>
                <tr>
                  <th scope="row">
                    <strong>Example</strong>
                  </th>
                  <td>Example data for property</td>
                </tr>
              </tbody>
            </table>

            <table className="usa-table width-full">
              <caption>Nearby services</caption>
              <tbody>
                <tr>
                  <th scope="row">
                    <strong>Example</strong>
                  </th>
                  <td>Example data for property</td>
                </tr>
              </tbody>
            </table>

            <table className="usa-table width-full">
              <caption>Comments</caption>
              <tbody>
                <tr>
                  <th scope="row">
                    <strong>Example</strong>
                  </th>
                  <td>Example data for property</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* .grid-container*/}
    </>
  );
}

export default PropertyDetailsPage;
