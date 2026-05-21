import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    monthly: 0,
    yearly: 0,
    desc: "Perfect for beginners starting their learning journey.",
    features: [
      "Access to basic courses",
      "Limited hands-on projects",
      "Community support",
      "Basic learning roadmap",
    ],
    popular: false,
  },

  {
    name: "Pro",
    monthly: 499,
    yearly: 3999,
    desc: "Everything you need to build real-world skills faster.",
    features: [
      "Unlimited course access",
      "Real-world projects",
      "Industry certifications",
      "Mentorship sessions",
      "Career guidance support",
    ],
    popular: true,
  },

  {
    name: "Premium",
    monthly: 999,
    yearly: 7999,
    desc: "Advanced career-focused learning with personal support.",
    features: [
      "Everything in Pro",
      "1:1 expert mentorship",
      "Placement preparation",
      "Priority support",
      "Mock interviews",
    ],
    popular: false,
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const navigate = useNavigate();

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
            Pricing Plans
          </p>

          {/* TITLE */}
          <h2 className="mt-5 text-3xl sm:text-4xl md:text-6xl font-bold tracking-[-0.03em] md:tracking-[-0.05em] leading-[1.08] md:leading-[1] text-gray-900">
            Simple & Transparent
            <br />

            <span className="text-green-700">
              Learning Plans
            </span>

          </h2>

          {/* DESCRIPTION */}
          <p className="mt-6 sm:mt-7 max-w-2xl mx-auto text-base sm:text-lg leading-7 sm:leading-8 text-gray-500">
            Flexible plans designed to help students learn practical
            skills, build projects, and grow confidently.
          </p>

        </motion.div>

        {/* TOGGLE */}
        <div className="flex justify-center mt-14">

          <div className="relative flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">

            {/* ACTIVE BG */}
            <motion.div
              animate={{
                x: yearly ? "100%" : "0%",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="absolute left-1 top-1 bottom-1 w-1/2 rounded-full bg-green-700"
            />

            {/* MONTHLY */}
            <button
              onClick={() => setYearly(false)}
              className={`relative z-10 px-5 sm:px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                !yearly ? "text-white" : "text-gray-600"
              }`}
            >
              Monthly
            </button>

            {/* YEARLY */}
            <button
              onClick={() => setYearly(true)}
              className={`relative z-10 px-5 sm:px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                yearly ? "text-white" : "text-gray-600"
              }`}
            >
              Yearly
            </button>

          </div>

        </div>

        {/* PRICING GRID */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-20 items-stretch">

          {plans.map((plan, i) => {
            const price = yearly
              ? plan.yearly
              : plan.monthly;

            return (
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
                className={`
                group relative overflow-hidden
                rounded-[32px]
                border
                bg-white
                p-6 sm:p-8
                flex flex-col
                min-h-[auto] xl:min-h-[650px]
                transition-all duration-500
                ${
                  plan.popular
                    ? "border-green-700 shadow-[0_20px_60px_rgba(22,163,74,0.12)]"
                    : "border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.10)]"
                }
                `}
              >

                {/* GLOW */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition duration-700" />

                {/* POPULAR BADGE */}
                {plan.popular && (
                  <div className="absolute top-5 right-5 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-semibold">
                    Most Popular
                  </div>
                )}

                {/* TOP CONTENT */}
                <div>

                  {/* PLAN NAME */}
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                    {plan.name}
                  </h3>

                  {/* DESCRIPTION */}
                  <p className="mt-4 text-[15px] leading-7 text-gray-500">
                    {plan.desc}
                  </p>

                  {/* PRICE */}
                  <div className="mt-8 flex items-end gap-2">

                    <h4 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                      ${price}
                    </h4>

                    <span className="text-gray-500 mb-2">
                      {yearly ? "/year" : "/month"}
                    </span>

                  </div>

                  {/* FEATURES */}
                  <div className="mt-10 space-y-4">

                    {plan.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3"
                      >

                        <CheckCircle className="!text-green-700 !text-[20px] mt-[2px]" />

                        <p className="text-[15px] leading-7 text-gray-600">
                          {feature}
                        </p>

                      </div>
                    ))}

                  </div>

                </div>

                {/* BUTTON FIXED TO BOTTOM */}
                <div className="mt-auto pt-10">

                  <button
                    onClick={() => navigate(plan.monthly === 0 ? "/courses" : "/register")}
                    className={`
                    w-full py-4 rounded-2xl font-semibold transition-all duration-300
                    ${
                      plan.popular
                        ? "bg-green-700 text-white hover:bg-orange-500 hover:text-black"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-900 hover:text-white"
                    }
                    `}
                  >
                    Get Started
                  </button>

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
            );
          })}

        </div>

      </div>

    </section>
  );
}
