import { Link } from "react-router-dom";
import content from "@/data/content/en/home.json";

function HomePage() {
  return (
    <div>
      <h1>{content.heading}</h1>
      <p>Hello App</p>
      <Link to="/signin">Go to signin</Link>
    </div>
  );
}

export default HomePage;
