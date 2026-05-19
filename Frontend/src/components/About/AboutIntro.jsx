import { motion } from "framer-motion";

const AboutIntro = () => {
  return (
    <section className="relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 bg-white overflow-hidden">

      {/* SOFT BACKGROUND GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[360px] sm:w-[600px] h-[360px] sm:h-[600px] bg-green-100 rounded-full blur-3xl opacity-20"></div>

      <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* LEFT CONTENT */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">
            About Learning Experience
          </p>

          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
            Learning That Actually
            <span className="text-green-700"> Prepares You</span>
            <br /> For The Real World
          </h2>

          <p className="mt-6 text-gray-600 text-lg leading-relaxed">
            We go beyond theory by focusing on real-world application.
            Every concept is backed by hands-on practice, guided mentorship,
            and industry-relevant projects.
          </p>

          {/* FEATURE LIST */}
          <div className="mt-10 space-y-4">
            {[
              "Hands-on projects with real-world scenarios",
              "Live sessions with industry professionals",
              "Step-by-step mentorship and guidance",
              "Confidence-focused learning approach",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 flex items-center justify-center bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  ✓
                </span>
                <p className="text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT VISUAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >

          {/* MAIN IMAGE */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img
              src="/images/AboutOne.jpg"
              alt="Training"
              className="w-full object-cover"
            />

            {/* OVERLAY GRADIENT */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>

          {/* FLOATING CARD */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -bottom-8 left-4 sm:-bottom-10 sm:-left-10 bg-white/80 backdrop-blur-lg p-5 sm:p-6 rounded-2xl shadow-xl border border-gray-200 max-w-[calc(100%-2rem)]"
          >
            <p className="text-2xl font-bold text-gray-900">10K+</p>
            <p className="text-sm text-gray-500">
              Hours of Live Training Delivered
            </p>
          </motion.div>

        </motion.div>

      </div>

    </section>
  );
};

export default AboutIntro;
