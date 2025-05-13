import AboutUs from "./AboutUs/AboutUs";
import FAQPage from "./FAQs/FAQPage";
import Hero from "./Hero/Hero";
import Footer from "./footer/Footer";

const Index = () => {
  return (
    <div style={{ backgroundColor: "white" }}>
      <Hero />
      <AboutUs />
      <FAQPage />
      <Footer />
    </div>
  );
};

export default Index;
