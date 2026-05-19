import { motion } from "framer-motion";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const FinalCTA = () => {
  const navigate = useNavigate();
  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6 bg-gray-100 text-black overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[360px] sm:w-[600px] h-[360px] sm:h-[600px] bg-green-100 rounded-full blur-3xl opacity-20"></div>

      <div className="relative max-w-4xl mx-auto text-center">

        {/* HEADLINE */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
        >
          Ready to Take the Next Step
          <br />
          <span className="text-green-600">
            Toward Your Future?
          </span>
        </motion.h2>

        {/* SUBTEXT */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-6 text-gray-600 text-base sm:text-lg max-w-2xl mx-auto"
        >
          Start your journey with confidence, build real skills,
          and move closer to the career you’ve been aiming for.
        </motion.p>

        {/* BUTTONS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-col sm:flex-row justify-center gap-4 flex-wrap"
        >
          {/* PRIMARY */}
          <Button className="!bg-green-700 !text-white !px-8 !py-3 !rounded-md hover:!bg-orange-500 hover:!text-black transition">
            Explore Courses
          </Button>

          {/* SECONDARY */}
          <Button 
          onClick={() => navigate("/contact")}
          className="!border !border-gray-800 !text-black !px-8 !py-3 !rounded-md hover:!bg-white hover:!text-black transition" 
          >
            Contact Us
          </Button>
        </motion.div>

        {/* TRUST LINE */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-sm text-gray-500"
        >
          Trusted by thousands of learners since 2006
        </motion.p>

      </div>
    </section>
  );
};

export default FinalCTA;
