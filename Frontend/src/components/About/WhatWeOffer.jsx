import { motion } from "framer-motion";
import SchoolIcon from "@mui/icons-material/School";
import PsychologyIcon from "@mui/icons-material/Psychology";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const features = [
  {
    icon: <SchoolIcon />,
    title: "Practical Skill-Based Learning",
    desc: "Focused on real-world application rather than just theoretical concepts.",
  },
  {
    icon: <PsychologyIcon />,
    title: "Strong Foundation Building",
    desc: "Step-by-step guidance to help you master core concepts with clarity.",
  },
  {
    icon: <WorkspacePremiumIcon />,
    title: "Expert-Led Training",
    desc: "Learn directly from experienced professionals with industry exposure.",
  },
  {
    icon: <TrendingUpIcon />,
    title: "Career-Focused Growth",
    desc: "Programs designed to help you confidently move toward real job opportunities.",
  },
];

const WhatWeOffer = () => {
  return (
    <section className="relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gray-50 overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[360px] sm:w-[700px] h-[360px] sm:h-[700px] bg-green-100 rounded-full blur-3xl opacity-20"></div>

      <div className="relative max-w-7xl mx-auto">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">
            What We Offer
          </p>

          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-gray-900">
            Designed For Real Growth
          </h2>

          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Empowering students with practical skills, real-time exposure,
            and guidance that leads to actual career progress.
          </p>
        </motion.div>

        {/* CARDS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">

          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group p-6 sm:p-8 rounded-2xl bg-white/70 backdrop-blur-lg border border-gray-200 shadow-sm hover:shadow-xl transition duration-300"
            >
              {/* ICON */}
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-green-100 text-green-700 mb-6 group-hover:scale-110 transition">
                {f.icon}
              </div>

              {/* TITLE */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {f.title}
              </h3>

              {/* DESC */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {f.desc}
              </p>

              {/* HOVER LINE */}
              <div className="mt-6 h-[2px] w-0 bg-green-700 group-hover:w-full transition-all duration-300"></div>
            </motion.div>
          ))}

        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <button className="bg-green-700 text-white px-8 py-3 rounded-md hover:bg-orange-500 hover:text-black transition">
            Explore Courses
          </button>
        </div>

      </div>
    </section>
  );
};

export default WhatWeOffer;
