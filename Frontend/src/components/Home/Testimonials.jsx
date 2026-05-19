import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Aman Verma",
    role: "Frontend Developer @ TCS",
    text: "The project-based learning completely changed how I approach development. I gained confidence and landed my first tech role.",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },

  {
    name: "Priya Sharma",
    role: "Full Stack Developer",
    text: "The mentorship and structured roadmap made learning simple, practical, and focused on real industry skills.",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
  },

  {
    name: "Rohit Kumar",
    role: "Software Engineer @ Infosys",
    text: "One of the best decisions for my career. The placement preparation and live projects truly helped me stand out.",
    img: "https://randomuser.me/api/portraits/men/45.jpg",
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-12 sm:py-14 px-4 sm:px-6 overflow-hidden bg-white">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-[-100px] w-[420px] h-[420px] bg-green-100 rounded-full blur-3xl opacity-20" />

      <div className="absolute bottom-0 right-[-120px] w-[420px] h-[420px] bg-orange-100 rounded-full blur-3xl opacity-15" />

      {/* CONTAINER */}
      <div className="relative max-w-7xl mx-auto">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="text-center"
        >

          {/* LABEL */}
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">
            Student Success Stories
          </p>

          {/* TITLE */}
          <h2 className="mt-5 text-3xl sm:text-4xl md:text-6xl font-bold tracking-[-0.03em] md:tracking-[-0.05em] leading-[1.08] md:leading-[1] text-gray-900">
            What Our
            <br />

            <span className="text-green-700">
              Students Say
            </span>

          </h2>

          {/* DESCRIPTION */}
          <p className="mt-6 sm:mt-7 max-w-2xl mx-auto text-base sm:text-lg leading-7 sm:leading-8 text-gray-500">
            Real experiences from learners who transformed their
            skills, confidence, and careers through practical learning.
          </p>

        </motion.div>

        {/* TESTIMONIAL GRID */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-7 mt-12 sm:mt-20">

          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.08,
                duration: 0.6,
              }}
              whileHover={{
                y: -8,
              }}
              className="
              group relative overflow-hidden
              rounded-[32px]
              border border-gray-200
              bg-white
              p-6 sm:p-8
              shadow-[0_10px_40px_rgba(0,0,0,0.05)]
              hover:shadow-[0_20px_60px_rgba(0,0,0,0.10)]
              transition-all duration-500
              "
            >

              {/* GLOW */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition duration-700" />

              {/* QUOTE ICON */}
              <div className="relative z-10 text-6xl leading-none text-green-100 font-serif">
                "
              </div>

              {/* TEXT */}
              <p className="relative z-10 -mt-5 text-[15px] leading-8 text-gray-500">
                {t.text}
              </p>

              {/* BOTTOM */}
              <div className="relative z-10 mt-8 flex flex-wrap items-center justify-between gap-4">

                {/* USER */}
                <div className="flex items-center gap-4">

                  <img
                    src={t.img}
                    alt={t.name}
                    className="
                    w-14 h-14 rounded-full
                    object-cover
                    border-2 border-white
                    shadow-md
                    "
                  />

                  <div>

                    <h4 className="font-semibold text-gray-900">
                      {t.name}
                    </h4>

                    <p className="text-sm text-gray-500">
                      {t.role}
                    </p>

                  </div>

                </div>

                {/* RATING */}
                <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                  ★ 5.0
                </div>

              </div>

              {/* BOTTOM HOVER LINE */}
              <div
                className="
                absolute bottom-0 left-0 h-[3px]
                w-0 group-hover:w-full
                bg-gradient-to-r from-green-700 to-green-600
                transition-all duration-500
                "
              />

            </motion.div>
          ))}

        </div>

      </div>

    </section>
  );
}
