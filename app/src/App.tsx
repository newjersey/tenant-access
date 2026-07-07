import { Outlet } from "react-router-dom";
import Banner from "@/components/Banner/Banner";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import Identifier from "@/components/Identifier/Identifier";

function App() {
  return (
    <>
      <Banner />
      <Header />
      <main>
        <section className="grid-container usa-section">
          <Outlet />
        </section>
      </main>

      <footer role="contentinfo">
        <Footer />
        <Identifier />
      </footer>
    </>
  );
}

export default App;
