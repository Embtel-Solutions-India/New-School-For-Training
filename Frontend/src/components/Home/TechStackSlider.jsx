import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const row1 = [
  "react",
  "nodedotjs",
  "typescript",
  "tailwindcss",
  "nextdotjs",
  "redux",
  "graphql",
  "angular",
];

const row2 = [
  "rust",
  "docker",
  "kubernetes",
  "linux",
  "nginx",
  "swift",
  "firebase",
  "mongodb",
  "postgresql",
];

const formatName = (tech) => {
  const map = {
    nodedotjs: "Node.js",
    nextdotjs: "Next.js",
    tailwindcss: "Tailwind",
    mongodb: "MongoDB",
    postgresql: "PostgreSQL",
  };

  return map[tech] || tech.charAt(0).toUpperCase() + tech.slice(1);
};

const TechItem = ({ tech }) => (
  <motion.div
    whileHover={{ y: -8 }}
    transition={{ duration: 0.3 }}
    className="group relative flex flex-col items-center min-w-[110px] sm:min-w-[130px]"
  >

    {/* GLOW */}
    <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-green-500/0 via-green-500/0 to-orange-500/0 group-hover:from-green-500/10 group-hover:to-orange-500/10 blur-2xl transition-all duration-500" />

    {/* CARD */}
    <div className="relative w-full bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">

      {/* TOP LIGHT */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-70" />

      {/* ICON */}
      <div className="relative flex items-center justify-center w-14 sm:w-16 h-14 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-inner">

        <img
          src={`https://cdn.simpleicons.org/${tech}`}
          alt={tech}
          className="w-8 h-8 object-contain"
        />

      </div>

      {/* NAME */}
      <div className="mt-5 text-center">

        <h4 className="text-sm font-semibold text-gray-800 group-hover:text-black transition">
          {formatName(tech)}
        </h4>

      </div>

    </div>

  </motion.div>
);

const Row = ({ items, reverse = false }) => (
  <div className="relative overflow-hidden">

    {/* LEFT FADE */}
    <div className="absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-white via-white/90 to-transparent z-20" />

    {/* RIGHT FADE */}
    <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-white via-white/90 to-transparent z-20" />

    <div
      className={`flex gap-4 sm:gap-8 w-max py-4 ${
        reverse ? "animate-marquee-reverse" : "animate-marquee"
      }`}
    >

      {[...items, ...items].map((tech, i) => (
        <TechItem key={i} tech={tech} />
      ))}

    </div>

  </div>
);

export default function TechStackSlider() {
  const containerRef = useRef(null);

  // PREMIUM PARALLAX
  useEffect(() => {
    const el = containerRef.current;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();

      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      el.style.transform = `
        perspective(1200px)
        rotateX(${y * -2}deg)
        rotateY(${x * 2}deg)
      `;
    };

    const reset = () => {
      el.style.transform = `
        perspective(1200px)
        rotateX(0deg)
        rotateY(0deg)
      `;
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", reset);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", reset);
    };
  }, []);

  return (
    <section className="relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 overflow-hidden bg-white">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[360px] sm:w-[700px] h-[360px] sm:h-[700px] bg-green-100 rounded-full blur-3xl opacity-30" />

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-100 rounded-full blur-3xl opacity-20" />

      

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.96, y: 40 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative max-w-7xl mx-auto rounded-[40px] backdrop-blur-3xl overflow-hidden transition-transform duration-300"
      >

        {/* TOP LIGHT */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

        {/* CONTENT */}
        <div className="relative ">

          {/* HEADER */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-green-700 uppercase tracking-[0.35em] text-xs font-semibold"
            >
              Modern Technologies
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="mt-5 text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 leading-tight"
            >
              Tools You’ll Master
              <span className="text-green-700">
                {" "}In Real Projects
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed"
            >
              Learn modern technologies used by startups, enterprises,
              and global product companies.
            </motion.p>

          </div>

          {/* TECH ROWS */}
          <div className="flex flex-col gap-8 sm:gap-14">

            <Row items={row1} />

            <Row items={row2} reverse />

          </div>

        </div>

      </motion.div>

    </section>
  );
}
