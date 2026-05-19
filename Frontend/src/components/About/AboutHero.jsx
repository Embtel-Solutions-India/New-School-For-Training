import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const AboutHero = () => {
  const ref = useRef(null);
  const navigate = useNavigate();

  // Scroll Animation
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.7]);

  return (
    <section
      ref={ref}
      className="relative min-h-[720px] sm:min-h-screen w-full overflow-hidden flex items-center"
    >

      {/* BACKGROUND IMAGE */}
      <motion.img
        src="/images/school.jpg"
        alt="About Hero"
        style={{ scale, opacity }}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* OVERLAYS */}
      <div className="absolute inset-0">

        {/* Main dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      </div>

      {/* CONTENT */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-20">

        <div className="max-w-3xl">

          {/* LABEL */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-green-600 mt-16 sm:mt-20 uppercase tracking-[0.22em] sm:tracking-[0.3em] text-xs sm:text-sm font-semibold"
          >
            About Our Institute
          </motion.p>

          {/* HEADING */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-6 text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight"
          >
            Transforming Learning Into
            <span className="text-green-600"> Real-World Success</span>
          </motion.h1>

          {/* DESCRIPTION */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 sm:mt-8 text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl"
          >
            Since 2006, we’ve helped students gain practical skills,
            build confidence, and prepare for successful careers through
            real-world learning experiences.
          </motion.p>

          {/* BUTTONS */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-5"
          >

            <Button
              onClick={() => navigate("/contact")}
              className="!bg-green-600 hover:!bg-orange-500 !text-white hover:!text-black !px-8 !py-3 !rounded-xl !font-semibold !shadow-2xl transition-all duration-300"
            >
              Contact Us
            </Button>

            <Button
              className="!border !border-white/30 !bg-white/10 backdrop-blur-md !text-white !px-8 !py-3 !rounded-xl hover:!bg-white hover:!text-black transition-all duration-300"
            >
              Learn More
            </Button>

          </motion.div>

        </div>

      </div>

      {/* SCROLL INDICATOR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center text-white/70"
      >

        <div className="w-[1px] h-12 bg-white/40 mb-2" />

        <p className="text-xs uppercase tracking-[0.3em]">
          Scroll
        </p>

      </motion.div>

    </section>
  );
};

export default AboutHero;
