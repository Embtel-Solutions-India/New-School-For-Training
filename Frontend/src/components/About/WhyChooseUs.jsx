import { motion } from "framer-motion";

const features = [
  {
    title: "Learn From Senior Industry Professionals",
    desc: "Get mentored by experts with real industry experience.",
  },
  {
    title: "Hands-On, Project-Focused Learning",
    desc: "Build practical projects while learning every concept.",
  },
  {
    title: "Updated Curriculum Aligned With Market",
    desc: "Learn modern skills designed for current industry needs.",
  },
  {
    title: "1:1 Career Guidance & Interview Support",
    desc: "Receive personalized mentorship and interview preparation.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-6 bg-gray-50 overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-100 rounded-full blur-3xl opacity-20" />

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-5 items-center">

        {/* LEFT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >

          <p className="text-sm font-semibold text-green-700 uppercase tracking-[0.3em]">
            Why Choose Us
          </p>

          <h2 className="mt-4 text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            Programs Designed For
            <span className="text-green-700"> Real Career Success</span>
          </h2>

          <p className="mt-3 text-gray-600 text-base sm:text-lg leading-relaxed max-w-xl">
            Our programs are built with one clear goal — helping you gain
            the skills companies actually look for through practical learning,
            real projects, and expert mentorship.
          </p>

          {/* STATS CARD */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="relative mt-7 w-fit"
          >

            <div className="relative bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 w-full max-w-[320px] shadow-xl">

              <h3 className="text-gray-900 text-lg font-semibold mb-4">
                Trusted by Learners
              </h3>

              <div className="space-y-3">

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Students</span>
                  <span className="font-bold text-gray-900">15K+</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Courses</span>
                  <span className="font-bold text-gray-900">25+</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Placement Rate</span>
                  <span className="font-bold text-green-700">80%</span>
                </div>

              </div>

              {/* FLOATING BADGE TOP */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute top-0 -left-2 sm:-left-4 bg-white border border-gray-200 px-3 sm:px-4 py-2 rounded-xl shadow-lg text-xs sm:text-sm font-semibold text-gray-900"
              >
                ⭐ 4.9 Rating
              </motion.div>

              {/* FLOATING BADGE BOTTOM */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5 }}
                className="absolute bottom-0 -right-2 sm:-right-4 bg-green-700 text-white px-3 sm:px-4 py-2 rounded-xl shadow-lg text-xs sm:text-sm font-semibold"
              >
                ⚡High Demand Skills
              </motion.div>

            </div>

          </motion.div>

          {/* CTA */}
          <button className="mt-10 bg-green-700 text-white px-8 py-3 rounded-xl hover:bg-orange-500 transition-all duration-300 font-medium shadow-lg">
            Explore Courses
          </button>

        </motion.div>

        {/* RIGHT SIDE */}
        <div className="grid gap-4">

          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
              className="group p-5 sm:p-7 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300"
            >

              <div className="flex items-start gap-4 sm:gap-5">

                {/* ICON */}
                <div className="min-w-[48px] h-12 flex items-center justify-center bg-green-100 text-green-700 rounded-2xl font-bold text-lg">
                  ✓
                </div>

                {/* TEXT */}
                <div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-700 transition-all">
                    {f.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {f.desc}
                  </p>

                </div>

              </div>

              {/* HOVER LINE */}
              <div className="mt-5 h-[2px] w-0 bg-green-700 group-hover:w-full transition-all duration-500" />

            </motion.div>
          ))}

        </div>

      </div>

    </section>
  );
};

export default WhyChooseUs;
