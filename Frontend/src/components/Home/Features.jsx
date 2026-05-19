import { motion } from "framer-motion";

import {
  School,
  Code,
  WorkspacePremium,
  Groups,
  RocketLaunch,
  Psychology,
} from "@mui/icons-material";

const features = [
  {
    icon: <School fontSize="large" />,
    title: "Live Interactive Classes",
    desc: "Learn directly from industry professionals through real-time sessions.",
  },

  {
    icon: <Code fontSize="large" />,
    title: "Project-Based Learning",
    desc: "Build practical applications that strengthen your portfolio and skills.",
  },

  {
    icon: <WorkspacePremium fontSize="large" />,
    title: "Industry Certifications",
    desc: "Earn recognized certifications that validate your technical expertise.",
  },

  {
    icon: <Groups fontSize="large" />,
    title: "1:1 Mentorship",
    desc: "Receive personalized career guidance from experienced mentors.",
  },

  {
    icon: <RocketLaunch fontSize="large" />,
    title: "Placement Assistance",
    desc: "Get support with interviews, resumes, and career opportunities.",
  },

  {
    icon: <Psychology fontSize="large" />,
    title: "AI Learning Paths",
    desc: "Follow personalized learning journeys designed around your goals.",
  },
];

export default function Features() {
  return (
    <section className="relative py-12 sm:py-14 px-4 sm:px-6 overflow-hidden bg-white">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-[-120px] w-[420px] h-[420px] bg-green-100 rounded-full blur-3xl opacity-20" />

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
            Why Choose Us
          </p>

          {/* TITLE */}
          <h2 className="mt-5 text-3xl sm:text-4xl md:text-6xl font-bold tracking-[-0.03em] md:tracking-[-0.05em] leading-[1.08] md:leading-[1] text-gray-900">
            Everything You Need
            <br />

            <span className="text-green-700">
              To Build Your Career
            </span>

          </h2>

          {/* DESCRIPTION */}
          <p className="mt-6 sm:mt-7 max-w-2xl mx-auto text-base sm:text-lg leading-7 sm:leading-8 text-gray-500">
            Practical learning, mentorship, projects, and career-focused
            guidance designed to help you grow with confidence.
          </p>

        </motion.div>

        {/* GRID */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-7 mt-12 sm:mt-20">

          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
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

              {/* TOP LIGHT */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-70" />

              {/* ICON */}
              <div
                className="
                relative z-10
                w-16 h-16
                rounded-2xl
                bg-green-50
                text-green-700
                flex items-center justify-center
                border border-green-100
                shadow-sm
                group-hover:scale-110
                transition duration-500
                "
              >
                {feature.icon}
              </div>

              {/* CONTENT */}
              <div className="relative z-10 mt-7">

                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                  {feature.title}
                </h3>

                <p className="mt-4 text-[15px] leading-7 text-gray-500">
                  {feature.desc}
                </p>

              </div>

              {/* HOVER LINE */}
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
