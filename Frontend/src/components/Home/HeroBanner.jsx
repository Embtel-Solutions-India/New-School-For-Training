import { Button } from "@mui/material";
import { useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import per from "../../assets/HeroBanner/per1_img.png";
import per2 from "../../assets/HeroBanner/per2_img.png";
import per3 from "../../assets/HeroBanner/per3_img.png";

const HeroBanner = () => {
  const navigate = useNavigate();
  const banners = [
    {
      title: "Build Skills That Actually Matter.",
      desc: "Learn practical technologies through real-world projects, mentorship, and hands-on experience.",
      image: per,
      badge: "Career Focused",
    },

    {
      title: "Your Future Starts With Consistency.",
      desc: "Small progress every day turns into confidence, opportunities, and long-term career growth.",
      image: per2,
      badge: "Growth Mindset",
    },

    {
      title: "Turn Learning Into Real Opportunities.",
      desc: "Master modern tools and become ready for internships, jobs, and real industry work.",
      image: per3,
      badge: "Industry Ready",
    },
  ];

  const scrollRef = useRef(null);

  // HORIZONTAL SCROLL
  const handleWheel = (e) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // DRAG SUPPORT
  let isDown = false;
  let startX;
  let scrollLeft;

  const handleMouseDown = (e) => {
    isDown = true;
    startX = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown = false;
  };

  const handleMouseUp = () => {
    isDown = false;
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;

    e.preventDefault();

    const x = e.pageX - scrollRef.current.offsetLeft;

    const walk = (x - startX) * 1.5;

    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className="relative py-12 sm:py-16 overflow-hidden bg-white">

      {/* SOFT GLOW */}
      <div className="absolute top-0 left-[-120px] w-[400px] h-[400px] bg-green-100 rounded-full blur-3xl opacity-30" />

      <div className="absolute bottom-0 right-[-100px] w-[400px] h-[400px] bg-orange-100 rounded-full blur-3xl opacity-20" />

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 mb-10 sm:mb-12">

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
        >

          <p className="text-sm font-semibold tracking-[0.25em] uppercase text-green-700">
            School For Training
          </p>

          <h2 className="mt-4 text-3xl sm:text-4xl md:text-6xl font-bold tracking-[-0.03em] md:tracking-[-0.04em] leading-[1.05] md:leading-[1] text-gray-900">
            Learn The Skills
            <br />

            <span className="text-green-700">
              Companies Actually Need
            </span>
          </h2>

        </motion.div>

      </div>

      {/* EDGE FADE */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-10 sm:w-24 bg-gradient-to-r from-white to-transparent z-20" />

      <div className="pointer-events-none absolute right-0 top-0 h-full w-10 sm:w-24 bg-gradient-to-l from-white to-transparent z-20" />

      {/* SCROLL CONTAINER */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="flex gap-5 sm:gap-8 overflow-x-auto scroll-smooth no-scrollbar px-4 sm:px-6 md:px-10 lg:px-16 cursor-grab active:cursor-grabbing"
      >

        {banners.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: i * 0.1,
              duration: 0.6,
            }}
            className="group relative min-w-[calc(100vw-2rem)] sm:min-w-[560px] md:min-w-[720px] lg:min-w-[920px] h-auto min-h-[430px] sm:h-[420px] overflow-hidden rounded-[30px] sm:rounded-[40px] border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)]"
          >

            {/* GLOW */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-orange-50 opacity-0 group-hover:opacity-100 transition duration-500" />

            {/* TOP LIGHT */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-70" />

            {/* CONTENT */}
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between h-full gap-8 px-5 sm:px-8 lg:px-12 py-8 md:py-0">

              {/* LEFT */}
              <div className="max-w-full md:max-w-[52%] lg:max-w-[48%]">

                {/* BADGE */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-200 bg-green-50 text-green-700 text-sm font-medium">

                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

                  {b.badge}

                </div>

                {/* TITLE */}
                <h2 className="mt-7 sm:mt-8 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.08] lg:leading-[1.05] tracking-[-0.03em] lg:tracking-[-0.04em] text-gray-900">
                  {b.title}
                </h2>

                {/* DESC */}
                <p className="mt-5 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-500">
                  {b.desc}
                </p>

                {/* BUTTONS */}
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">

                  <Button
                    onClick={() => navigate("/courses")}
                    className="!bg-green-700 hover:!bg-orange-500 hover:!text-black !text-white !rounded-full !px-7 !py-3 !font-semibold !shadow-[0_12px_30px_rgba(22,163,74,0.22)] transition-all duration-300">
                    Explore Programs
                  </Button>

                  <Button
                    onClick={() => navigate("/about")}
                    variant="outlined"
                    className="!border-gray-300 !text-gray-700 hover:!border-orange-500 hover:!text-orange-500 hover:!bg-orange-50 !rounded-full !px-7 !py-3 !font-semibold transition-all duration-300"
                  >
                    Learn More
                  </Button>

                </div>

              </div>

              {/* RIGHT IMAGE */}
              <div className="relative hidden md:flex items-end justify-center w-[42%] h-full min-w-0">

                {/* IMAGE GLOW */}
                <div className="absolute bottom-10 w-[300px] h-[300px] bg-green-100 rounded-full blur-3xl opacity-40" />

                {/* IMAGE */}
                <motion.img
                  whileHover={{
                    scale: 1.05,
                    rotate: 1.5,
                  }}
                  transition={{
                    duration: 0.4,
                  }}
                  src={b.image}
                  alt="banner"
                  className="relative z-10 h-[95%] object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.12)]"
                />

              </div>

            </div>

          </motion.div>
        ))}

      </div>

    </section>
  );
};

export default HeroBanner;
