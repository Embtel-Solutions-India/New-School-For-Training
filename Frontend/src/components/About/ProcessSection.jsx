import { motion } from "framer-motion";

const steps = [
  {
    title: "Choose Your Course & Attend Demo",
    desc: "Explore programs, select what fits your goals, and attend a free demo session.",
  },
  {
    title: "Enroll & Get Onboarded",
    desc: "Complete enrollment and receive schedules, materials, and platform access.",
  },
  {
    title: "Start Learning with Live Classes",
    desc: "Attend interactive sessions and build strong fundamentals.",
  },
  {
    title: "Build Projects & Get Certified",
    desc: "Work on real projects and receive certification with career support.",
  },
];

export default function ProcessSection() {
  return (
    <section className="relative bg-white py-20 sm:py-24 lg:py-32 px-4 sm:px-6 overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[360px] sm:w-[700px] h-[360px] sm:h-[700px] bg-green-100 rounded-full blur-3xl opacity-20"></div>

      {/* HEADER */}
      <div className="max-w-6xl mx-auto text-center mb-14 sm:mb-20 lg:mb-32">
        <p className="text-green-700 uppercase tracking-[0.3em] text-sm font-semibold">
          Simple Process
        </p>

        <h2 className="mt-4 text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900">
          How Your Journey Begins
        </h2>

        <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          A premium learning flow designed for students and professionals.
        </p>
      </div>

      {/* STACK SECTION */}
      <div className="relative max-w-5xl mx-auto">

        {steps.map((step, index) => (
          <div
            key={index}
            className="relative md:sticky md:top-24 mb-8 sm:mb-10"
            style={{
              height: "auto",
              minHeight: "min(500px, 80vh)",
              zIndex: index + 1,
            }}
          >

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 80 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="h-auto md:h-[420px]"
            >

              <div className="relative h-full min-h-[360px] bg-white border border-gray-200 rounded-[28px] sm:rounded-[40px] shadow-2xl p-6 sm:p-10 md:p-16 flex flex-col justify-between gap-10">

                {/* Number */}
                <div className="absolute top-6 sm:top-8 right-6 sm:right-8 text-5xl sm:text-7xl font-black text-gray-100">
                  0{index + 1}
                </div>

                {/* Content */}
                <div>
                  <p className="text-green-700 uppercase tracking-[0.3em] text-sm font-semibold mb-5">
                    Step 0{index + 1}
                  </p>

                  <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 leading-tight max-w-2xl pr-10 sm:pr-0">
                    {step.title}
                  </h3>
                </div>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-10">

                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl">
                    {step.desc}
                  </p>

                  <button className="px-7 py-3 rounded-xl bg-green-700 text-white font-semibold hover:bg-orange-500 transition-all duration-300">
                    Learn More
                  </button>

                </div>

              </div>

            </motion.div>

          </div>
        ))}

      </div>

      {/* EXTRA SPACE */}
      {/* <div className="h-[300px]" /> */}

    </section>
  );
}
