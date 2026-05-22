import { Button } from "@mui/material";
import Hero from "../components/About/AboutHero";
import NavBar from "../components/Common/NavBar";
import AboutIntro from "../components/About/AboutIntro";
import WhatWeOffer from "../components/About/WhatWeOffer";
// import ProcessSection from "../components/About/ProcessSection";
import WhyChooseUs from "../components/About/WhyChooseUs";
import FinalCTA from "../components/About/FinalCTA";
import AboutGallery from "../components/About/AboutGallery";
import Footer from "../components/Common/Footer";

const AboutPage = () => {
  return (
    <div className="bg-white text-black">
      {/* Navigation */}
      <NavBar />
      <Hero />
      <AboutIntro />
      <WhatWeOffer />
      <AboutGallery />
      {/* <ProcessSection /> */}
      <WhyChooseUs />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default AboutPage;
