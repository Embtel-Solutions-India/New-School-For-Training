import { motion } from "framer-motion";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

import StatsSection from "./StatsSection";
import CodeAnimation from "./CodeAnimation";

const Hero = () => {
  const navigate = useNavigate();

  // MAGNET EFFECT
  const handleMagnet = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    e.currentTarget.style.transform = `
      translate(${x * 0.12}px, ${y * 0.12}px)
    `;
  };

  const resetMagnet = (e) => {
    e.currentTarget.style.transform = `translate(0px,0px)`;
  };

  return (
    <section className="relative overflow-hidden bg-white pt-28 sm:pt-32">
      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-[-160px] sm:left-[-100px] w-[320px] sm:w-[450px] h-[320px] sm:h-[450px] bg-green-100 rounded-full blur-3xl opacity-30" />

      <div className="absolute bottom-0 right-[-170px] sm:right-[-120px] w-[320px] sm:w-[450px] h-[320px] sm:h-[450px] bg-orange-100 rounded-full blur-3xl opacity-20" />

      {/* MAIN CONTAINER */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-20 items-center min-h-[auto] lg:min-h-[88vh] py-10 lg:py-0">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative z-10"
          >
            {/* BADGE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex max-w-full items-center gap-3 px-4 sm:px-5 py-2 rounded-full border border-green-200 bg-green-50"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

              <span className="text-sm font-medium text-green-700">
                Career-Focused Learning Platform
              </span>
            </motion.div>

            {/* HEADING */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-8 text-4xl sm:text-[52px] md:text-[72px] font-bold leading-[0.98] md:leading-[0.95] tracking-[-0.04em] md:tracking-[-0.06em] text-gray-900"
            >
              Launch Your Tech Career
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-green-700">
                  With Industry-Led Training
                </span>

                {/* SOFT HIGHLIGHT */}
                <span className="absolute bottom-2 left-0 w-full h-4 rounded-full bg-green-100 -z-0" />
              </span>
            </motion.h1>

            {/* DESCRIPTION */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-6 sm:mt-8 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-500"
            >
              Master high-demand tech skills through expert-led, career-focused programs in QA, Cybersecurity, Data Analytics, AI & more. Learn online or in NYC — with internship & job support included.
            </motion.p>

            {/* CTA BUTTONS */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4"
            >
              {/* PRIMARY */}
              <Button
                onClick={() => navigate("/courses")}
                onMouseMove={handleMagnet}
                onMouseLeave={resetMagnet}
                className="!bg-green-700 hover:!bg-orange-400 hover:!text-black !text-white !rounded-full !px-7 sm:!px-8 !py-3.5 !font-semibold !text-[15px] !shadow-[0_12px_30px_rgba(22,163,74,0.22)] transition-all duration-300"
              >
                Explore Courses
              </Button>

              {/* SECONDARY */}
              <Button
                onClick={() => navigate("/contact")}
                onMouseMove={handleMagnet}
                onMouseLeave={resetMagnet}
                variant="outlined"
                className="!border-gray-300 !text-gray-800 hover:!border-orange-400 hover:!text-orange-500 hover:!bg-orange-50 !rounded-full !px-7 sm:!px-8 !py-3.5 !font-semibold !text-[15px] transition-all duration-300"
              >
                View Demo
              </Button>
            </motion.div>

            {/* TRUST SECTION */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-10 sm:mt-14 flex items-center gap-5 sm:gap-6 flex-wrap"
            >
              {/* USERS */}
              <div className="flex -space-x-3">
                <img
                  src="https://i.pravatar.cc/100?img=12"
                  className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm"
                />

                <img
                  src="https://i.pravatar.cc/100?img=22"
                  className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm"
                />

                <img
                  src="https://i.pravatar.cc/100?img=30"
                  className="w-11 h-11 rounded-full border-2 border-white object-cover shadow-sm"
                />
              </div>

              {/* TEXT */}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Trusted by 10,000+ learners
                </p>

                <p className="text-sm text-gray-500">
                  Students learning real-world tech skills
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative flex justify-center lg:justify-end min-w-0"
          >
            {/* FLOATING TOP CARD */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 5,
              }}
              className="absolute -top-8 left-0 z-20 hidden lg:flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
            >
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 font-bold">
                AI
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  AI Career Guidance
                </p>

                <p className="text-xs text-gray-500">
                  Personalized learning path
                </p>
              </div>
            </motion.div>

            {/* FLOATING BOTTOM CARD */}
            <motion.div
              animate={{
                y: [0, 10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
              }}
              className="absolute bottom-8 -right-4 z-20 hidden lg:block rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
            >
              <p className="text-2xl font-bold text-gray-900">95%</p>

              <p className="text-sm text-gray-500 mt-1">Student Satisfaction</p>
            </motion.div>

            {/* CODE WINDOW */}
            <div className="relative w-full max-w-2xl min-w-0">
              <CodeAnimation />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
