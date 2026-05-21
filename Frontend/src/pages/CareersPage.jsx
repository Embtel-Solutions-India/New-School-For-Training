import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";

const sections = [
  {
    id: "why",
    title: "Why Work at SFT?",
    content:
      "At School For Training, we are passionate about education and technology. We believe in empowering both our students and our team members. Working here means making a real impact on thousands of learners every day while growing in a collaborative, mission-driven environment.",
  },
  {
    id: "culture",
    title: "Our Culture",
    content:
      "We foster a culture of continuous learning, innovation, and inclusivity. Our team is made up of educators, technologists, and career coaches who care deeply about student outcomes. We support remote-friendly work, flexible schedules, and professional development for every team member.",
  },
  {
    id: "openings",
    title: "Current Openings",
    content:
      "We are always looking for talented educators, software engineers, UX designers, content creators, and student success coaches. While specific roles vary, we welcome proactive applications from passionate individuals who share our mission to make quality education accessible.",
  },
  {
    id: "apply",
    title: "How to Apply",
    content:
      "Interested in joining our team? Send your resume and a brief introduction to careers@schoolfortraining.com. Tell us about your experience, what excites you about our mission, and how you can contribute. We review every application personally.",
  },
  {
    id: "benefits",
    title: "Benefits & Perks",
    content:
      "Our team members enjoy competitive compensation, remote-friendly policies, professional development budgets, free access to all SFT courses, health-focused work culture, and the satisfaction of building something that truly matters to students and communities.",
  },
];

const CareersPage = () => {
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
          Join Our Team
        </p>
        <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold">
          Careers at SFT
        </h1>
        <p className="mt-5 text-gray-500 max-w-2xl mx-auto">
          Help us build the future of career-focused education. We are looking
          for passionate people who want to make a real difference.
        </p>
        <p className="mt-4 text-sm text-gray-400">
          We are a growing team on a mission to empower 100,000+ learners
        </p>
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
              <h3 className="text-2xl font-bold">Ready to Apply?</h3>
              <p className="text-gray-500 mt-3">
                Reach out to us directly or visit our contact page to start the
                conversation.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="mailto:careers@schoolfortraining.com"
                  className="px-6 py-3 rounded-lg bg-green-700 text-white font-semibold hover:bg-orange-400 hover:text-black transition"
                >
                  Email Us
                </a>
                <button
                  onClick={() => navigate("/contact")}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
                >
                  Contact Page
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

export default CareersPage;
