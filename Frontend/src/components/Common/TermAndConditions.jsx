import { useEffect, useState } from "react";
import Footer from "./Footer";
import Navbar from "./NavBar";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content:
      "By accessing or using our platform, services, or training programs, you agree to comply with these Terms & Conditions. If you do not agree with any part of these terms, you should discontinue use of our services immediately.",
  },
  {
    id: "enrollment",
    title: "Course Enrollment",
    content:
      "Students enrolling in any course must provide accurate information during registration. Enrollment is confirmed only after successful payment verification and approval from our team.",
  },
  {
    id: "payments",
    title: "Payments & Fees",
    content:
      "All course fees must be paid according to the selected payment plan. Fees are non-transferable unless explicitly approved by the institute. Late payments may result in temporary suspension of course access.",
  },
  {
    id: "refunds",
    title: "Refund Policy",
    content:
      "Refund requests are reviewed on a case-by-case basis. Refund eligibility depends on course progress, attendance, and the refund request timeline. Administrative charges may apply where necessary.",
  },
  {
    id: "student",
    title: "Student Responsibilities",
    content:
      "Students are expected to maintain professional behavior during live sessions, assignments, and project collaborations. Misconduct, plagiarism, harassment, or misuse of resources may result in suspension or permanent removal.",
  },
  {
    id: "certification",
    title: "Certification",
    content:
      "Certificates are awarded only after successful completion of course requirements, assignments, assessments, and attendance criteria determined by the institute.",
  },
  {
    id: "intellectual",
    title: "Intellectual Property",
    content:
      "All training materials, videos, resources, branding, and course content remain the intellectual property of School For Training. Unauthorized distribution, recording, or reproduction is strictly prohibited.",
  },
  {
    id: "accounts",
    title: "Account Usage",
    content:
      "Users are responsible for maintaining the confidentiality of their accounts and passwords. Sharing account access with others is prohibited and may lead to account termination.",
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content:
      "While we strive to provide accurate and high-quality training, School For Training is not liable for indirect losses, career outcomes, or damages resulting from the use of our services or educational content.",
  },
  {
    id: "changes",
    title: "Changes to Terms",
    content:
      "We reserve the right to update or modify these Terms & Conditions at any time. Continued use of the platform after updates indicates acceptance of the revised terms.",
  },
  {
    id: "contact",
    title: "Contact Information",
    content:
      "For any questions regarding these Terms & Conditions, please contact our support team through our official contact channels.",
  },
];

const TermAndConditions = () => {
  const [active, setActive] = useState(sections[0].id);
  const navigate = useNavigate();

  // ACTIVE SECTION TRACKING
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
          Terms & Conditions
        </h1>

        <p className="mt-5 text-gray-500 max-w-2xl mx-auto">
          Please read these terms carefully before using our platform,
          courses, and educational services.
        </p>

        <p className="mt-4 text-sm text-gray-400">
          Last updated: July 2026
        </p>

      </section>

      {/* MAIN CONTENT */}
      <section className="py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-10 lg:gap-16">

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
                Need More Clarification?
              </h3>

              <p className="text-gray-500 mt-3">
                Contact our support team if you have questions regarding
                course policies, payments, or platform usage.
              </p>

              <button className="mt-6 px-6 py-3 rounded-lg bg-green-700 text-white hover:bg-orange-400 hover:text-black transition" onClick={() => navigate("/contact")}>
                Contact Support
              </button>

            </div>

          </div>
        </div>
      </section>
      <Footer/>

    </div>
  );
};

export default TermAndConditions;
