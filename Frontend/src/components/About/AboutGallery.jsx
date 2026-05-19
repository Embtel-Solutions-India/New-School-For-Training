import { motion } from "framer-motion";

const images = [
  {
    src: "/images/Whyuss.jpg",
    title: "Interactive Classroom Sessions",
    desc: "Real-time learning with active student participation.",
  },
  {
    src: "/images/WhyUs.jpg",
    title: "Hands-On Training",
    desc: "Learning by doing with guided expert sessions.",
  },
  {
    src: "/images/AboutFive.jpg",
    title: "Student Achievements",
    desc: "Recognizing growth, progress, and milestones.",
  },
  {
    src: "/images/AboutTwo.jpg",
    title: "Strong Learning Community",
    desc: "Students growing together in a collaborative space.",
  },
];

const AboutGallery = () => {
  return (
    <section className="relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 bg-white overflow-hidden">

      {/* BACKGROUND SOFT GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[360px] sm:w-[700px] h-[360px] sm:h-[700px] bg-green-100 rounded-full blur-3xl opacity-20"></div>

      <div className="relative max-w-7xl mx-auto">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-20"
        >
          <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">
            Our Environment
          </p>

          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-gray-900">
            Real Learning. Real Classrooms.
          </h2>

          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            A glimpse into how students learn, build, and grow with us every day.
          </p>
        </motion.div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 gap-5 sm:gap-8">

          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl shadow-lg"
            >

              {/* IMAGE */}
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-[240px] sm:h-[320px] object-cover transition duration-700 group-hover:scale-110"
              />

              {/* DARK OVERLAY */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/60 transition duration-500"></div>

              {/* CONTENT OVERLAY */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white transform sm:translate-y-6 group-hover:translate-y-0 transition duration-500">

                <h3 className="text-lg font-semibold">
                  {img.title}
                </h3>

                <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition duration-500">
                  {img.desc}
                </p>

              </div>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default AboutGallery;
