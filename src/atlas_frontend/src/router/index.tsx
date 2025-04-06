import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import Footer from "../components/Footer.tsx";
import Navbar from "../components/Navbar/index.tsx";
import Home from "../components/Home/index.tsx";

export default () => {
  return (
    <BrowserRouter>
      <div className="relative">
        <Navbar />
        <main>
          <Routes>{<Route path="/" element={<Home />} />}</Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};
