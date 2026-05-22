import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

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

function ProcessCard({ step, index, progress, total }) {
  const relative = useTransform(progress, (value) => {
    return value * total - index;
  });

  const y = useTransform(relative, [-1, 0, 1], [120, 0, -80]);

  const scale = useTransform(relative, [-1, 0, 1], [0.92, 1, 0.96]);

  const opacity = useTransform(relative, (value) => {
    // hidden before entering
    if (value < -0.15) return 0;

    // fade in
    if (value < 0) {
      return 1 + value / 0.15;
    }

    // fully visible
    if (value <= 0.65) {
      return 1;
    }

    // fade out
    if (value <= 1) {
      return 1 - (value - 0.65) / 0.35;
    }

    // hidden after leaving
    return 0;
  });

  const blur = useTransform(relative, [-1, 0, 1], [8, 0, 6]);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        y,
        scale,
        opacity,
        filter: blur.get() ? `blur(${blur.get()}px)` : "blur(0px)",
        zIndex: total - index,
        willChange: "transform, opacity",
      }}
    >
      {/* CARD */}
      <div className="relative bg-white border border-gray-200 rounded-[40px] shadow-[0_25px_80px_rgba(0,0,0,0.12)] overflow-hidden min-h-[520px] w-full p-8 sm:p-10 md:p-16 flex flex-col justify-between">
        {/* NUMBER */}
        <div className="absolute top-8 right-8 text-[90px] md:text-[120px] font-black text-gray-100 leading-none">
          0{index + 1}
        </div>

        {/* TOP */}
        <div className="relative z-10">
          <p className="text-green-700 uppercase tracking-[0.3em] text-sm font-semibold mb-5">
            Step 0{index + 1}
          </p>

          <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight max-w-3xl">
            {step.title}
          </h3>
        </div>

        {/* BOTTOM */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8 mt-14">
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl">
            {step.desc}
          </p>

          <button className="px-8 py-4 rounded-2xl bg-green-700 text-white font-semibold hover:bg-orange-500 transition-all duration-300">
            Learn More
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProcessSection() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section className="relative bg-[#f7f7f7] py-32 overflow-visible">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto text-center mb-24 px-4">
        <p className="text-green-700 uppercase tracking-[0.3em] text-sm font-semibold">
          Simple Process
        </p>

        <h2 className="mt-4 text-4xl md:text-6xl font-bold text-gray-900">
          How Your Journey Begins
        </h2>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          A premium learning flow designed for students and professionals.
        </p>
      </div>

      {/* STACK SECTION */}
      <div
        ref={containerRef}
        className="relative"
        style={{
          height: `${steps.length * 140}vh`,
        }}
      >
        {/* STICKY AREA */}
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <div className="relative w-full max-w-5xl px-4 min-h-[520px]">
            {steps.map((step, index) => (
              <ProcessCard
                key={index}
                step={step}
                index={index}
                progress={scrollYProgress}
                total={steps.length}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
