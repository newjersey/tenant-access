import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div>
      <h1>Home</h1>
      <p>Hello App</p>
      <Link to="/signin">Go to signin</Link>
    </div>
  );
}

export default HomePage;
