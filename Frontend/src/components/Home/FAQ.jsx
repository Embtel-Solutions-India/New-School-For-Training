import { useState } from "react";
import { ExpandMore } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "Is this platform beginner-friendly?",
    answer:
      "Yes, our programs are designed for beginners and gradually progress toward advanced real-world concepts and projects.",
  },

  {
    question: "Will I receive a certificate after completion?",
    answer:
      "Yes, every completed course includes an industry-recognized certificate to showcase your skills and achievements.",
  },

  {
    question: "Do you provide placement assistance?",
    answer:
      "Absolutely. We help with resume building, mock interviews, career guidance, and job preparation support.",
  },

  {
    question: "Can I learn at my own pace?",
    answer:
      "Yes, recorded sessions and learning materials are available anytime, allowing flexible self-paced learning.",
  },

  {
    question: "What makes School For Training different?",
    answer:
      "We focus on practical learning, mentorship, real projects, and career-focused training instead of only theory.",
  },

  {
    question: "Is there a refund policy available?",
    answer:
      "Yes, we offer a refund policy for eligible enrollments if you're not satisfied with the learning experience.",
  },
];

export default function FAQ() {
  const [active, setActive] = useState(0);

  return (
    <section className="relative py-12 sm:py-14 px-4 sm:px-6 overflow-hidden bg-white">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-[-120px] w-[420px] h-[420px] bg-green-100 rounded-full blur-3xl opacity-20" />

      <div className="absolute bottom-0 right-[-120px] w-[420px] h-[420px] bg-orange-100 rounded-full blur-3xl opacity-15" />

      {/* CONTAINER */}
      <div className="relative max-w-5xl mx-auto">

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
            Frequently Asked Questions
          </p>

          {/* TITLE */}
          <h2 className="mt-5 text-3xl sm:text-4xl md:text-6xl font-bold tracking-[-0.03em] md:tracking-[-0.05em] leading-[1.08] md:leading-[1] text-gray-900">
            Everything You Need
            <br />

            <span className="text-green-700">
              To Know
            </span>

          </h2>

          {/* DESCRIPTION */}
          <p className="mt-6 sm:mt-7 max-w-2xl mx-auto text-base sm:text-lg leading-7 sm:leading-8 text-gray-500">
            Answers to common questions about our programs,
            mentorship, certifications, and learning experience.
          </p>

        </motion.div>

        {/* FAQ LIST */}
        <div className="mt-12 sm:mt-20 space-y-4 sm:space-y-5">

          {faqs.map((faq, i) => {
            const isOpen = active === i;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.5,
                }}
                className={`
                group relative overflow-hidden
                rounded-[28px]
                border
                bg-white
                transition-all duration-500
                ${
                  isOpen
                    ? "border-green-200 shadow-[0_20px_60px_rgba(22,163,74,0.08)]"
                    : "border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.07)]"
                }
                `}
              >

                {/* GLOW */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition duration-700" />

                {/* QUESTION */}
                <button
                  onClick={() =>
                    setActive(isOpen ? null : i)
                  }
                  className="
                  relative z-10
                  w-full
                  flex items-center justify-between
                  gap-6
                  px-5 sm:px-7 py-5 sm:py-6
                  text-left
                  "
                >

                  <h3
                    className={`
                    text-base sm:text-lg md:text-xl font-semibold tracking-tight transition-colors duration-300
                    ${
                      isOpen
                        ? "text-green-700"
                        : "text-gray-900"
                    }
                    `}
                  >
                    {faq.question}
                  </h3>

                  {/* ICON */}
                  <div
                    className={`
                    flex items-center justify-center
                    w-10 sm:w-11 h-10 sm:h-11 rounded-2xl shrink-0
                    border transition-all duration-300
                    ${
                      isOpen
                        ? "bg-green-700 border-green-700 text-white rotate-180"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    }
                    `}
                  >
                    <ExpandMore />
                  </div>

                </button>

                {/* ANSWER */}
                <AnimatePresence initial={false}>

                  {isOpen && (
                    <motion.div
                      initial={{
                        height: 0,
                        opacity: 0,
                      }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 0.35,
                      }}
                      className="overflow-hidden"
                    >

                      <div className="px-5 sm:px-7 pb-6 sm:pb-7 sm:pr-20">

                        <p className="text-[15px] leading-8 text-gray-500">
                          {faq.answer}
                        </p>

                      </div>

                    </motion.div>
                  )}

                </AnimatePresence>

                {/* BOTTOM HOVER LINE */}
                <div
                  className={`
                  absolute bottom-0 left-0 h-[3px]
                  bg-gradient-to-r from-green-700 to-green-600
                  transition-all duration-500
                  ${
                    isOpen
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  }
                  `}
                />

              </motion.div>
            );
          })}

        </div>

      </div>

    </section>
  );
}
