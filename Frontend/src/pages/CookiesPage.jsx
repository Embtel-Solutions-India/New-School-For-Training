import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";

const sections = [
  {
    id: "what",
    title: "What Are Cookies?",
    content:
      "Cookies are small text files stored on your device when you visit a website. They help websites remember information about your visit, such as your login status, preferences, and browsing activity, making your experience faster and more personalized.",
  },
  {
    id: "types",
    title: "Types of Cookies We Use",
    content:
      "We use essential cookies (required for the platform to function), functional cookies (to remember your preferences such as language and theme), analytics cookies (to understand how users interact with our platform), and performance cookies (to improve load times and reliability).",
  },
  {
    id: "purpose",
    title: "How We Use Cookies",
    content:
      "Cookies allow us to keep you logged in between sessions, remember your course progress, provide a personalized learning experience, analyze platform usage to improve our services, and deliver relevant content and course recommendations.",
  },
  {
    id: "third-party",
    title: "Third-Party Cookies",
    content:
      "Some features on our platform may use cookies from trusted third-party services including Google Analytics for usage analytics, Stripe for secure payment processing, and embedded video providers. These third parties have their own privacy and cookie policies.",
  },
  {
    id: "control",
    title: "Managing Your Cookies",
    content:
      "You can control and delete cookies through your browser settings. Most browsers allow you to refuse cookies entirely or delete existing ones. Note that disabling certain cookies may affect your ability to use some features of the platform, including staying logged in.",
  },
  {
    id: "updates",
    title: "Updates to This Policy",
    content:
      "We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our services. We will notify you of significant changes by updating the date at the top of this page. Continued use of the platform constitutes acceptance of the updated policy.",
  },
];

const CookiesPage = () => {
  const [active, setActive] = useState(sections[0].id);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      sections.forEach((section) => {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) setActive(section.id);
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-28 sm:pt-32 pb-10 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white text-center">
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.25em] text-green-700 font-semibold">
          Legal Center
        </p>
        <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold">
          Cookie Policy
        </h1>
        <p className="mt-5 text-gray-500 max-w-2xl mx-auto">
          Learn how we use cookies and similar technologies to improve your
          experience on our platform.
        </p>
        <p className="mt-4 text-sm text-gray-400">Last updated: May 2026</p>
      </section>

      {/* MAIN */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-10 lg:gap-16">
          {/* SIDEBAR */}
          <div className="hidden md:block">
            <div className="sticky top-28 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-5">On this page</h3>
              <div className="flex flex-col gap-2">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`text-left px-4 py-2 rounded-lg transition text-sm ${
                      active === s.id ? "bg-green-700 text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="space-y-12 sm:space-y-20 min-w-0 mt-10 md:mt-0">
            {sections.map((s) => (
              <div key={s.id} id={s.id} className="scroll-mt-32">
                <h2 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6">{s.title}</h2>
                <p className="text-gray-600 leading-7 sm:leading-8 text-base sm:text-lg">{s.content}</p>
              </div>
            ))}

            {/* CTA */}
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-10">
              <h3 className="text-2xl font-bold">Questions About Cookies?</h3>
              <p className="text-gray-500 mt-3">
                If you have any questions about our use of cookies, please reach
                out to our support team.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/contact")}
                  className="px-6 py-3 rounded-lg bg-green-700 text-white hover:bg-orange-400 hover:text-black transition"
                >
                  Contact Support
                </button>
                <button
                  onClick={() => navigate("/privacy")}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CookiesPage;
