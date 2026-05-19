import { useEffect, useState } from "react";
import Footer from "./Footer";
import Navbar from "./NavBar";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    id: "collect",
    title: "Information We Collect",
    content:
      "We collect personal information such as your name, email address, phone number, and course preferences when you register or contact us.",
  },
  {
    id: "usage",
    title: "How We Use Your Information",
    content:
      "Your information helps us provide learning services, course access, support, updates, and platform improvements.",
  },
  {
    id: "security",
    title: "Data Protection",
    content:
      "We use industry-standard technologies and secure systems to protect your information from unauthorized access.",
  },
  {
    id: "cookies",
    title: "Cookies",
    content:
      "Cookies help improve user experience, analyze website traffic, and remember preferences.",
  },
  {
    id: "thirdparty",
    title: "Third-Party Services",
    content:
      "We may use trusted third-party providers for analytics, communication, and payments.",
  },
  {
    id: "contact",
    title: "Contact Us",
    content:
      "If you have questions regarding this Privacy Policy, please contact our support team.",
  },
];

const PrivacyPolicy = () => {
  const [active, setActive] = useState(sections[0].id);
    const navigate = useNavigate();

  // 🔥 Active section tracking
  useEffect(() => {
    const handleScroll = () => {
      sections.forEach((section) => {
        const el = document.getElementById(section.id);

        if (el) {
          const rect = el.getBoundingClientRect();

          if (rect.top <= 120 && rect.bottom >= 120) {
            setActive(section.id);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    
    <div className="bg-white text-gray-900 overflow-x-hidden">

        <Navbar/>

      {/* HERO */}
      <section className="relative pt-28 sm:pt-32 pb-10 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white text-center">

        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.25em] text-green-700 font-semibold">
          Legal Center
        </p>

        <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold">
          Privacy Policy
        </h1>

        <p className="mt-5 text-gray-500 max-w-2xl mx-auto">
          Learn how we collect, use, and protect your information while using our platform.
        </p>

        <p className="mt-4 text-sm text-gray-400">
          Last updated: July 2026
        </p>

      </section>

      {/* MAIN */}
      <section className="px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr] gap-10 lg:gap-16">

          {/* SIDEBAR */}
          <div className="hidden md:block">

            <div className="sticky top-28 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">

              <h3 className="font-semibold text-gray-900 mb-5">
                On this page
              </h3>

              <div className="flex flex-col gap-2">

                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollTo(section.id)}
                    className={`text-left px-4 py-2 rounded-lg transition text-sm ${
                      active === section.id
                        ? "bg-green-700 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}

              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="space-y-12 sm:space-y-20 min-w-0">

            {sections.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="scroll-mt-32"
              >

                <h2 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6">
                  {section.title}
                </h2>

                <p className="text-gray-600 leading-7 sm:leading-8 text-base sm:text-lg">
                  {section.content}
                </p>

              </div>
            ))}

            {/* CTA */}
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-10">

              <h3 className="text-2xl font-bold">
                Questions About Privacy?
              </h3>

              <p className="text-gray-500 mt-3">
                Reach out to our support team for any questions regarding your data or account privacy.
              </p>

              <button className="mt-6 px-6 py-3 rounded-lg bg-green-700 text-white hover:bg-orange-400 hover:text-black transition" onClick={() => navigate("/contact")}>
                Contact Support
              </button>

            </div>

          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
};

export default PrivacyPolicy;
