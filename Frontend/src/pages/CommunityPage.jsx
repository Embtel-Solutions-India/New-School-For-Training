import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Common/NavBar";
import Footer from "../components/Common/Footer";
import useAuthStore from "../store/authStore";

const features = [
  {
    title: "Course Discussions",
    desc: "Post questions, share insights, and learn alongside fellow students in every course community.",
    icon: "💬",
  },
  {
    title: "Peer Learning",
    desc: "Connect with learners at your level to collaborate on projects, share resources, and study together.",
    icon: "🤝",
  },
  {
    title: "Announcements",
    desc: "Stay up to date with course announcements, new content releases, and platform updates.",
    icon: "📢",
  },
  {
    title: "Q&A Forum",
    desc: "Ask questions and get answers from instructors and experienced peers in real time.",
    icon: "❓",
  },
  {
    title: "Success Stories",
    desc: "Celebrate wins, share progress, and inspire others in our student success feed.",
    icon: "🏆",
  },
  {
    title: "Study Groups",
    desc: "Join or create study groups for specific courses and topics to accelerate your learning.",
    icon: "📚",
  },
];

const CommunityPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-28 sm:pt-32 pb-10 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white text-center overflow-hidden">
        <div className="absolute top-0 left-[-120px] w-[420px] h-[420px] bg-green-100 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 right-[-120px] w-[420px] h-[420px] bg-orange-100 rounded-full blur-3xl opacity-15 pointer-events-none" />
        <div className="relative">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.25em] text-green-700 font-semibold">
            Student Community
          </p>
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold">
            Learn Better, Together
          </h1>
          <p className="mt-5 text-gray-500 max-w-2xl mx-auto">
            The SFT Community is where students connect, collaborate, and grow
            together. Discussions, peer support, and shared learning — all in
            one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-4 rounded-2xl bg-green-700 text-white font-semibold hover:bg-orange-500 hover:text-black transition-all duration-300"
              >
                Go to My Community
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/register")}
                  className="px-8 py-4 rounded-2xl bg-green-700 text-white font-semibold hover:bg-orange-500 hover:text-black transition-all duration-300"
                >
                  Join the Community
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="px-8 py-4 rounded-2xl border border-gray-300 text-gray-800 font-semibold hover:border-orange-400 hover:text-orange-500 transition-all duration-300"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="relative py-14 px-4 sm:px-6 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">
              What's Inside
            </p>
            <h2 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Everything a Learning Community Should Be
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-[32px] border border-gray-200 bg-white p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.10)] transition-all duration-500"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition duration-700" />
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-[15px] leading-7 text-gray-500">{f.desc}</p>
                <div className="absolute bottom-0 left-0 h-[3px] w-0 group-hover:w-full bg-gradient-to-r from-green-700 to-green-600 transition-all duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 sm:px-6 bg-gray-50 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Your community is waiting
        </h2>
        <p className="mt-4 text-gray-500 max-w-xl mx-auto">
          {user
            ? "Head to your dashboard to access course communities and connect with fellow learners."
            : "Create a free account to access the full community experience inside your dashboard."}
        </p>
        <button
          onClick={() => navigate(user ? "/dashboard" : "/register")}
          className="mt-8 px-8 py-4 rounded-2xl bg-green-700 text-white font-semibold hover:bg-orange-500 hover:text-black transition-all duration-300"
        >
          {user ? "Open Dashboard" : "Get Started Free"}
        </button>
      </section>

      <Footer />
    </div>
  );
};

export default CommunityPage;
