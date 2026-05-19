import { useEffect, useState } from "react";
import { Avatar, Button, Divider, Menu as MuiMenu, MenuItem } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu as MenuIcon, ShieldCheck, X } from "lucide-react";
import useAuthStore from "../../store/authStore";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);

  // SCROLL EFFECT
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ACTIVE ROUTE
  const isActive = (path) => location.pathname === path;

  // NAV ITEM
  const navItem = (label, path) => (
  <button
    onClick={() => navigate(path)}
    className={`relative group px-2 py-2 text-[15px] font-medium transition-all duration-300 ${
      isActive(path)
        ? "text-orange-500"
        : "text-gray-700 hover:text-orange-500"
    }`}
  >

    {/* TEXT */}
    <span className="relative z-10">
      {label}
    </span>

    {/* UNDERLINE */}
    <motion.span
      initial={false}
      animate={{
        width: isActive(path) ? "100%" : "0%",
      }}
      whileHover={{
        width: "100%",
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      className="absolute left-0 -bottom-1 h-[2px] bg-orange-500 rounded-full"
    />

  </button>
);

  const authAction = user ? (
    <>
      <Button
        onClick={() => navigate("/dashboard")}
        className="!rounded-full !px-5 !py-2 !text-[14px] !font-medium !text-gray-700 hover:!text-orange-500"
      >
        Dashboard
      </Button>
      <button
        onClick={(event) => setProfileAnchor(event.currentTarget)}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1.5 text-gray-700"
      >
        <Avatar src={user.avatar} alt={user.name} sx={{ width: 32, height: 32 }}>
          {user.name?.[0]}
        </Avatar>
        <ShieldCheck size={16} className="text-green-700" />
      </button>
      <MuiMenu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={() => setProfileAnchor(null)} PaperProps={{ className: "!rounded-2xl !mt-2" }}>
        <MenuItem onClick={() => navigate("/dashboard")}>
          <div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs capitalize text-gray-500">{user.role?.replace("_", " ")}</p>
          </div>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={async () => {
            setProfileAnchor(null);
            await logout();
            navigate("/");
          }}
        >
          <LogOut size={16} className="mr-2" /> Logout
        </MenuItem>
      </MuiMenu>
    </>
  ) : (
    <>
      <Button
        onClick={() => navigate("/login")}
        className={`!rounded-full !px-5 !py-2 !text-[14px] !font-medium transition-all duration-300 ${
          isActive("/login")
            ? "!text-orange-500"
            : "!text-gray-700 hover:!text-orange-500"
        }`}
      >
        Login
      </Button>
      <Button
        onClick={() => navigate("/register")}
        className={`!rounded-full !px-7 !py-2.5 !font-semibold !text-[14px] transition-all duration-300 ${
          isActive("/register")
            ? "!bg-orange-500 !text-black"
            : "!bg-green-700 !text-white hover:!bg-orange-500 hover:!text-black"
        }`}
      >
        Get Started
      </Button>
    </>
  );

  return (
    <>
      {/* NAVBAR */}
      <div className="fixed top-3 sm:top-4 left-0 w-full z-50 flex justify-center px-3 sm:px-4">

        <motion.div
          animate={{
            y: scrolled ? 0 : 6,
            scale: scrolled ? 0.985 : 1,
          }}

          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}

          className={`relative w-full max-w-7xl rounded-full transition-all duration-500 overflow-hidden ${
            scrolled
              ? "bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_40px_rgba(0,0,0,0.08)]"
              : "bg-white border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
          }`}
        >

          {/* GLOW */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/10 via-transparent to-orange-400/10 blur-2xl opacity-60 pointer-events-none" />

          {/* LIGHT LINE */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

          {/* CONTENT */}
          <div className="relative flex items-center justify-between px-4 sm:px-6 md:px-8 py-2.5 sm:py-3">

            {/* LOGO */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/")}
            >

              <img
                src="/images/sft_logo.png"
                alt="School For Training"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain"
              />

            </div>

            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-2">

              {navItem("Home", "/")}
              {navItem("About", "/about")}
              {navItem("Courses", "/courses")}
              {navItem("Blog", "/blog")}
              {navItem("Contact", "/contact")}

            </div>

            {/* ACTIONS */}
            <div className="hidden lg:flex items-center gap-3">

              {authAction}

            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-700"
            >
              {mobileMenu ? <X size={20} /> : <MenuIcon size={20} />}
            </button>

          </div>

        </motion.div>

      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>

        {mobileMenu && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: -10,
            }}

            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}

            exit={{
              opacity: 0,
              scale: 0.96,
              y: -10,
            }}

            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}

            className="fixed top-20 sm:top-24 left-3 right-3 sm:left-4 sm:right-4 z-40 lg:hidden"
          >

            <div className="rounded-[26px] sm:rounded-[30px] bg-white/90 backdrop-blur-2xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">

              {/* NAV LINKS */}
              <div className="flex flex-col p-4 sm:p-5 gap-1">

                {[
                  ["Home", "/"],
                  ["About", "/about"],
                  ["Courses", "/courses"],
                  ["Blog", "/blog"],
                  ["Contact", "/contact"],
                ].map(([label, path]) => (
                  <button
                    key={path}
                    onClick={() => {
                      navigate(path);
                      setMobileMenu(false);
                    }}
                    className={`text-left px-4 py-3.5 sm:py-4 rounded-2xl text-[15px] font-medium transition-all ${
                      isActive(path)
                        ? "bg-green-50 text-green-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}

              </div>

              {/* MOBILE ACTIONS */}
              <div className="border-t border-gray-100 p-4 sm:p-5 flex flex-col gap-3">

                {user ? (
                  <>
                    <Button
                      onClick={() => {
                        navigate("/dashboard");
                        setMobileMenu(false);
                      }}
                      className="!rounded-2xl !py-3 !border !border-gray-200 !text-gray-700"
                    >
                      Dashboard
                    </Button>
                    <Button
                      onClick={async () => {
                        await logout();
                        setMobileMenu(false);
                        navigate("/");
                      }}
                      className="!rounded-2xl !py-3 !bg-green-700 !text-white hover:!bg-orange-400 hover:!text-black"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        navigate("/login");
                        setMobileMenu(false);
                      }}
                      className="!rounded-2xl !py-3 !border !border-gray-200 !text-gray-700"
                    >
                      Login
                    </Button>
                    <Button
                      onClick={() => {
                        navigate("/register");
                        setMobileMenu(false);
                      }}
                      className="!rounded-2xl !py-3 !bg-green-700 !text-white hover:!bg-orange-400 hover:!text-black"
                    >
                      Get Started
                    </Button>
                  </>
                )}

              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </>
  );
};

export default Navbar;
