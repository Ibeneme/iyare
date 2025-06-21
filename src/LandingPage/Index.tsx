import AboutUs from "./AboutUs/AboutUs";
import FAQPage from "./FAQs/FAQPage";
import Hero from "./Hero/Hero";
import HomeFooter from "./HomeFooter/HomeFooter";


const Index = () => {
  return (
    <div style={{ backgroundColor: "white" }}>
      <Hero />
      <AboutUs />
      <FAQPage />
      <HomeFooter />
    </div>
  );
};

export default Index;
