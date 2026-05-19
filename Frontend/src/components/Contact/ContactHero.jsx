import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const ContactHero = () => {
  const ref = useRef(null);

  // Scroll animation
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.7]);

  return (
    <section
      ref={ref}
      className="relative min-h-[760px] sm:min-h-[90vh] flex items-center overflow-visible"
    >

      {/* BACKGROUND IMAGE */}
      <motion.img
        src="/images/school.jpg"
        alt="Contact Hero"
        style={{ opacity }}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* OVERLAYS */}
      <div className="absolute inset-0">

        {/* Main Overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-20 pb-56 sm:pb-36">

        <div className="max-w-3xl">

          {/* LABEL */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-green-600 mt-24 sm:mt-44 uppercase tracking-[0.22em] sm:tracking-[0.3em] text-xs sm:text-sm font-semibold"
          >
            Contact Us
          </motion.p>

          {/* HEADING */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-6 text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight"
          >
            Let’s Build Your Future
            <br />

            <span className="text-green-600">
              Together
            </span>
          </motion.h1>

          {/* DESCRIPTION */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 sm:mt-8 text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl"
          >
            Have questions about courses, career guidance, or enrollment?
            Our team is here to help you take the next step with confidence.
          </motion.p>

        </div>

      </div>

      {/* FLOATING CONTACT CARD */}
      <motion.div
        initial={{ opacity: 0, y: 70 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute left-1/2 bottom-0 translate-y-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] sm:w-[92%] max-w-5xl"
      >

        <div className="bg-white/95 backdrop-blur-2xl border border-white/30 rounded-[28px] sm:rounded-[32px] shadow-2xl px-5 sm:px-8 md:px-12 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">

          {/* LEFT CONTENT */}
          <div className="text-center md:text-left">

            <p className="text-green-600 uppercase tracking-[0.3em] text-xs font-semibold mb-3">
              Quick Support
            </p>

            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Talk to our team directly
            </h3>

            <p className="text-gray-500 mt-3 text-base leading-relaxed max-w-xl">
              Get instant support and personalized guidance for your
              learning and career journey.
            </p>

          </div>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">

            <a
              href="tel:+15106519600"
              className="px-7 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-orange-500 hover:text-black transition-all duration-300 shadow-lg text-center"
            >
              Call Us
            </a>

            <a
              href="https://wa.me/15106519600"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition-all duration-300 text-center"
            >
              WhatsApp
            </a>

          </div>

        </div>

      </motion.div>

      {/* SCROLL INDICATOR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 right-10 hidden sm:flex flex-col items-center text-white/70"
      >

        <div className="w-[1px] h-12 bg-white/40 mb-2" />

        <p className="text-xs uppercase tracking-[0.3em]">
          Scroll
        </p>

      </motion.div>

    </section>
  );
};

export default ContactHero;
