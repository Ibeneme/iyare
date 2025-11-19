//import AboutUs from "./AboutUs/AboutUs";
import FAQPage from "./FAQs/FAQPage";
import Hero from "./Hero/Hero";
import HomeLessonsSection from "./Hero/NewSectionA";
import LessonsDigitalizedSection from "./Hero/NewSectionB";
import YareOpsSection from "./Hero/YareOpsSection";
import TestimonialsCarousel from "./Testimonials/Testimonials";

const Index = () => {
  return (
    <div style={{ backgroundColor: "white", marginTop: -64 }}>
      <Hero />
      <HomeLessonsSection />
      <YareOpsSection />
      <LessonsDigitalizedSection />
      <TestimonialsCarousel />
      {/* <AboutUs /> */}
      <FAQPage />
      {/* <HomeFooter /> */}
    </div>
  );
};

export default Index;
