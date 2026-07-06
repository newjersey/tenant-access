import Banner from "@/components/Banner/Banner";
import Footer from "@/components/Footer/Footer";
import Identifier from "@/components/Identifier/Identifier";

function App() {
  return (
    <>
      <Banner />
      <main>Hello App</main>
      <footer role="contentinfo">
        <Footer />
        <Identifier />
      </footer>
    </>
  );
}

export default App;
