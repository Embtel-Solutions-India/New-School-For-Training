import Navbar from "../components/Common/NavBar";
import Hero from "../components/Home/Hero";
import HeroBanner from "../components/Home/HeroBanner";
import CourseShowcase from "../components/Home/CourseShowcase";
import Features from "../components/Home/Features";
import Testimonials from "../components/Home/Testimonials";
import Pricing from "../components/Home/Pricing";
import FAQ from "../components/Home/FAQ";
import CTA from "../components/Home/CTA";
import Footer from "../components/Common/Footer";
import TechStackSlider from "../components/Home/TechStackSlider";


const Home = () => {
  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <HeroBanner />
      <CourseShowcase />
      <TechStackSlider />
      <Features />
      <Testimonials />
      <Pricing/>
      <FAQ/>
      <CTA/>
      <Footer/>
    </div>
  );
};

export default Home;
