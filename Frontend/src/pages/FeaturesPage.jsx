import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";
import Features from "../components/Home/Features";
import { useNavigate } from "react-router-dom";

const FeaturesPage = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-28 sm:pt-32 pb-10 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white text-center">
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.25em] text-green-700 font-semibold">
          Platform Features
        </p>
        <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold">
          Everything You Need to Succeed
        </h1>
        <p className="mt-5 text-gray-500 max-w-2xl mx-auto">
          Discover the tools, resources, and support systems that make SFT the
          most effective platform for launching your tech career.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate("/courses")}
            className="px-7 py-3.5 rounded-full bg-green-700 text-white font-semibold hover:bg-orange-500 hover:text-black transition-all duration-300"
          >
            Explore Courses
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-7 py-3.5 rounded-full border border-gray-300 text-gray-800 font-semibold hover:border-orange-400 hover:text-orange-500 transition-all duration-300"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <Features />

      {/* BOTTOM CTA */}
      <section className="py-14 px-4 sm:px-6 bg-gray-50 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Ready to experience these features?
        </h2>
        <p className="mt-4 text-gray-500 max-w-xl mx-auto">
          Join thousands of learners already building real-world skills on SFT.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="mt-8 px-8 py-4 rounded-2xl bg-green-700 text-white font-semibold hover:bg-orange-500 hover:text-black transition-all duration-300"
        >
          Start for Free
        </button>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
