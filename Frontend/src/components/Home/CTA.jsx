import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function CTA() {
  const navigate = useNavigate();
  return (
    <section className="relative py-12 sm:py-14 px-4 sm:px-6 overflow-hidden bg-white border-b border-gray-200">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-[-120px] w-[420px] h-[420px] bg-green-100 rounded-full blur-3xl opacity-20" />

      <div className="absolute bottom-0 right-[-120px] w-[420px] h-[420px] bg-orange-100 rounded-full blur-3xl opacity-15" />

      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.7,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="
        relative max-w-6xl mx-auto overflow-hidden
        bg-white
        px-4 sm:px-8 md:px-16
        py-12 sm:py-14
        
        "
      >

        {/* INNER GLOW */}
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-green-100 rounded-full blur-3xl opacity-30" />

        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-100 rounded-full blur-3xl opacity-20" />

        {/* TOP LIGHT */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-100 to-transparent opacity-70" />

        {/* CONTENT */}
        <div className="relative z-10 text-center">

          {/* LABEL */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700"
          >
            Start Your Journey
          </motion.p>

          {/* TITLE */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-6 text-3xl sm:text-4xl md:text-6xl font-bold tracking-[-0.03em] md:tracking-[-0.05em] leading-[1.08] md:leading-[1.05] text-gray-900"
          >
            Build Real Skills
            <br />

            <span className="text-green-700">
              For Real Opportunities
            </span>

          </motion.h2>

          {/* DESCRIPTION */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="mt-6 sm:mt-8 max-w-2xl mx-auto text-base sm:text-lg leading-7 sm:leading-8 text-gray-500"
          >
            Join thousands of learners mastering practical technologies,
            building projects, and preparing for successful tech careers.
          </motion.p>

          {/* BUTTONS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="mt-10 sm:mt-12 flex flex-col sm:flex-row justify-center gap-4 sm:gap-5 flex-wrap"
          >

            {/* PRIMARY BUTTON */}
            <button
              onClick={() => navigate("/register")}
              className="
              px-7 sm:px-9 py-4
              rounded-2xl
              bg-green-700
              text-white
              font-semibold
              shadow-[0_12px_30px_rgba(22,163,74,0.22)]
              hover:bg-orange-500
              hover:text-black
              transition-all duration-300
              "
            >
              Get Started Free
            </button>

            {/* SECONDARY BUTTON */}
            <button
              onClick={() => navigate("/contact")}
              className="
              px-7 sm:px-9 py-4
              rounded-2xl
              bg-gray-50
              text-gray-800
              font-semibold
              hover:bg-orange-50
              hover:text-orange-500
              transition-all duration-300
              "
            >
              Book a Demo
            </button>

          </motion.div>

          {/* TRUST SECTION */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45 }}
            className="mt-12 sm:mt-14 flex flex-wrap items-center justify-center gap-8 sm:gap-10"
          >

            {/* STAT 1 */}
            <div>

              <h3 className="text-3xl font-bold text-gray-900">
                10K+
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Active Learners
              </p>

            </div>

            {/* DIVIDER */}
            <div className="hidden md:block w-px h-12 bg-gray-200" />

            {/* STAT 2 */}
            <div>

              <h3 className="text-3xl font-bold text-gray-900">
                95%
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Student Satisfaction
              </p>

            </div>

            {/* DIVIDER */}
            <div className="hidden md:block w-px h-12 bg-gray-200" />

            {/* STAT 3 */}
            <div>

              <h3 className="text-3xl font-bold text-gray-900">
                50+
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Industry Mentors
              </p>

            </div>

          </motion.div>

        </div>

      </motion.div>

    </section>
  );
}
