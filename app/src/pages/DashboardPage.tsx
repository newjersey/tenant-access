import { Link } from "react-router-dom";
import content from "@/data/content/en/dashboard.json";

function DashboardPage() {
  return (
    <div>
      <h1 className="display-flex flex-align-center">{content.heading}</h1>

      <Link to="/dashboard/new" className="usa-button">
        {content.createListingButton}
      </Link>

      <table className="usa-table width-full">
        <thead>
          <tr>
            <th>{content.tableHeaders.id}</th>
            <th>{content.tableHeaders.listingName}</th>
            <th>{content.tableHeaders.status}</th>
            <th>{content.tableHeaders.action}</th>
          </tr>
        </thead>
        <tbody>
          {/* Example listing row */}
          <tr>
            <td>203</td>
            <td>221 King Street, Trenton, NJ 08608</td>
            <td>Active</td>
            <td>
              <Link to="/dashboard/203" aria-label="Update 221 King Street, Trenton, NJ 08608">
                Update
              </Link>
            </td>
          </tr>
          <tr>
            <td>234</td>
            <td>123 Sesame Street, Newark, NJ 07102</td>
            <td>Active</td>
            <td>
              <Link to="/dashboard/234" aria-label="Update 123 Sesame Street, Newark, NJ 07102">
                Update
              </Link>
            </td>
          </tr>
          <tr>
            <td>2843</td>
            <td>02 Shady Lane, Point Pleasant, NJ 08340</td>
            <td>Removed</td>
            <td>
              <Link
                to="/dashboard/2843"
                aria-label="Update 02 Shady Lane, Point Pleasant, NJ 08340"
              >
                Update
              </Link>
            </td>
          </tr>
          <tr>
            <td>9385</td>
            <td>14 Aspen Drive, North Caldwell, NJ 07001</td>
            <td>Active</td>
            <td>
              <Link
                to="/dashboard/9385"
                aria-label="Update 14 Aspen Drive, North Caldwell, NJ 07001"
              >
                Update
              </Link>
            </td>
          </tr>
        </tbody>
      </table>

      <Link to="/dashboard/new" className="usa-button">
        {content.createListingButton}
      </Link>
    </div>
  );
}

export default DashboardPage;
