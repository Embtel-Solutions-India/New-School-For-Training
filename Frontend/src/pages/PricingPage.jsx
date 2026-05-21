import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";
import Pricing from "../components/Home/Pricing";
import { useNavigate } from "react-router-dom";

const PricingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-28 sm:pt-32 pb-6 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white text-center">
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.25em] text-green-700 font-semibold">
          Simple Pricing
        </p>
        <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold">
          Choose the Plan That Fits You
        </h1>
        <p className="mt-5 text-gray-500 max-w-2xl mx-auto">
          Flexible plans built for every learner — from beginners exploring tech
          to professionals accelerating their careers.
        </p>
      </section>

      {/* PRICING SECTION */}
      <Pricing />

      {/* FAQ TEASER */}
      <section className="py-14 px-4 sm:px-6 bg-gray-50 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Have questions about pricing?
        </h2>
        <p className="mt-4 text-gray-500 max-w-xl mx-auto">
          Our team is happy to help you choose the right plan for your learning
          goals.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate("/contact")}
            className="px-8 py-4 rounded-2xl bg-green-700 text-white font-semibold hover:bg-orange-500 hover:text-black transition-all duration-300"
          >
            Talk to Us
          </button>
          <button
            onClick={() => navigate("/help")}
            className="px-8 py-4 rounded-2xl bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition-all duration-300"
          >
            Visit Help Center
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
