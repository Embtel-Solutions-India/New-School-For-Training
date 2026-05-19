import StarIcon from "@mui/icons-material/Star";

const stats = [
  {
    value: "3K+",
    label: "Students Trained",
  },
  {
    value: "80%",
    label: "Placement within 6 months",
  },
  {
    value: "Top MNCs",
    label: "Hiring our students",
  },
];

const StatsSection = () => {
  return (
    <div className="absolute left-0 right-0 -bottom-24 flex justify-center px-6 md:px-16 z-20">

      <div className="w-full max-w-6xl">

        {/* MAIN CARD */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">

          {/* LEFT STATS */}
          <div className="flex flex-1 justify-between w-full">

            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex-1 text-center group transition"
              >
                <div className="text-3xl md:text-4xl font-bold text-gray-900 group-hover:text-green-700 transition">
                  {stat.value}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}

          </div>

          {/* DIVIDER */}
          <div className="hidden md:block w-px h-16 bg-gray-200"></div>

          {/* RIGHT RATING */}
          <div className="flex items-center gap-4">

            {/* Avatars */}
            <div className="flex -space-x-3">
              <img src="https://randomuser.me/api/portraits/women/1.jpg" className="w-10 h-10 rounded-full border-2 border-white shadow-sm"/>
              <img src="https://randomuser.me/api/portraits/men/2.jpg" className="w-10 h-10 rounded-full border-2 border-white shadow-sm"/>
              <img src="https://randomuser.me/api/portraits/men/3.jpg" className="w-10 h-10 rounded-full border-2 border-white shadow-sm"/>
            </div>

            {/* Rating */}
            <div>
              <p className="text-sm text-gray-500">Trusted by learners</p>

              <div className="flex items-center gap-1">
                <StarIcon className="text-yellow-500" fontSize="small" />
                <span className="font-semibold text-gray-900">4.9</span>
                <span className="text-gray-500 text-sm">/5 rating</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default StatsSection;