import { Outlet } from "react-router-dom";
import Banner from "@/components/Banner/Banner";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import Identifier from "@/components/Identifier/Identifier";
import usePageTracking from "@/hooks/usePageTracking";

function App() {
  usePageTracking();
  return (
    <>
      <Banner />
      <Header />
      <main>
        <Outlet />
      </main>

      <footer role="contentinfo">
        <Footer />
        <Identifier />
      </footer>
    </>
  );
}

export default App;
