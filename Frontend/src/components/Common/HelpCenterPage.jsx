import Footer from "./Footer";
import Navbar from "./NavBar";

export default function HelpCenterPage() {
  const categories = [
    {
      title: "Getting Started",
      desc: "Setup your account, explore courses, and begin learning.",
    },
    {
      title: "Billing & Payments",
      desc: "Manage subscriptions, invoices, and payment methods.",
    },
    {
      title: "Certificates",
      desc: "Download and share your course completion certificates.",
    },
    {
      title: "Technical Support",
      desc: "Fix login issues, video playback problems, and bugs.",
    },
    {
      title: "Teacher Support",
      desc: "Manage your courses, students, and publishing workflow.",
    },
    {
      title: "Community",
      desc: "Connect with learners, discussions, and mentorship groups.",
    },
  ];

  const faqs = [
    {
      question: "How do I enroll in a course?",
      answer:
        "Browse the courses page, select your preferred course, and click the enroll button to get instant access.",
    },
    {
      question: "Can I download lessons offline?",
      answer:
        "Premium users can download selected lessons and access them offline anytime.",
    },
    {
      question: "How do I reset my password?",
      answer:
        "Click on forgot password from the login page and follow the email verification process.",
    },
    {
      question: "Will I receive certificates?",
      answer:
        "Certificates are automatically generated after successful course completion.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
        <Navbar/>
      <section className="relative pt-32 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 md:px-12 lg:px-20 border-b border-gray-200">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/3 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] bg-green-100 blur-3xl rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[280px] sm:w-[400px] h-[280px] sm:h-[400px] bg-orange-100 blur-3xl rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-8">
            <div className="w-2 h-2 rounded-full bg-green-600" />
            <span className="text-sm text-gray-600">
              24/7 Learning Support
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight max-w-5xl mx-auto">
            How can we
            <span className="bg-gradient-to-r from-green-600 to-orange-500 bg-clip-text text-transparent">
              {" "}
              help you?
            </span>
          </h1>

          <p className="mt-6 sm:mt-8 text-base sm:text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed">
            Explore guides, tutorials, FAQs, and premium support resources to enhance your learning experience.
          </p>

          <div className="mt-8 sm:mt-12 max-w-3xl mx-auto relative">
            <input
              type="text"
              placeholder="Search articles, courses, billing help..."
              className="w-full bg-white border border-gray-200 rounded-2xl py-4 sm:py-5 pl-5 sm:pl-6 pr-5 sm:pr-36 text-base sm:text-lg outline-none focus:border-green-500 transition-all shadow-sm"
            />

            <button className="mt-3 sm:mt-0 sm:absolute sm:right-3 sm:top-1/2 sm:-translate-y-1/2 w-full sm:w-auto px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-orange-500 transition-all duration-300">
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="text-green-600 uppercase tracking-[0.3em] text-sm mb-4">
                Support Categories
              </p>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
                Find answers faster
              </h2>
            </div>

            <p className="text-gray-500 max-w-xl leading-relaxed">
              Browse our curated support categories and discover detailed resources tailored for learners and teachers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-8">
            {categories.map((item, index) => (
              <div
                key={index}
                className="group rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 hover:border-green-500 hover:-translate-y-2 transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-orange-100 flex items-center justify-center text-xl font-bold text-green-700 mb-6 border border-gray-200">
                  0{index + 1}
                </div>

                <h3 className="text-2xl font-bold mb-4 group-hover:text-green-600 transition-all">
                  {item.title}
                </h3>

                <p className="text-gray-500 leading-relaxed mb-8">
                  {item.desc}
                </p>

                <button className="inline-flex items-center gap-2 text-green-600 font-semibold hover:text-orange-500 hover:gap-4 transition-all">
                  Explore Articles →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 lg:px-20 border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-green-600 uppercase tracking-[0.3em] text-sm mb-4">
              Frequently Asked Questions
            </p>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">
              Common Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm"
              >
                <div className="p-6 sm:p-8">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
                    {faq.question}
                  </h3>

                  <p className="text-gray-500 leading-relaxed text-base sm:text-lg">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-[30px] sm:rounded-[40px] border border-gray-200 bg-gradient-to-br from-green-50 to-orange-50 p-6 sm:p-10 md:p-16">
            <div className="relative z-10 grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <p className="text-green-600 uppercase tracking-[0.3em] text-sm mb-4">
                  Need More Help?
                </p>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-6">
                  Contact our support team
                </h2>

                <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-8">
                  Our expert support specialists are available around the clock to help you resolve issues quickly.
                </p>

                <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                  <button className="px-8 py-4 rounded-2xl bg-green-600 text-white font-semibold hover:bg-orange-500 transition-all duration-300">
                    Contact Support
                  </button>

                  <button className="px-8 py-4 rounded-2xl border border-gray-200 bg-white hover:bg-orange-50 transition-all duration-300">
                    Live Chat
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {[
                  { value: '24/7', label: 'Live Support' },
                  { value: '5 min', label: 'Avg Response' },
                  { value: '120K+', label: 'Resolved Tickets' },
                  { value: '99%', label: 'Satisfaction' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 text-center shadow-sm"
                  >
                    <h3 className="text-3xl sm:text-4xl font-black text-green-600 mb-3 group-hover:text-orange-500 transition-all">
                      {item.value}
                    </h3>
                    <p className="text-gray-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}
