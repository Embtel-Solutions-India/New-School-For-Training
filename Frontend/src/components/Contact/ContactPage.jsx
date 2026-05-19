import { useState } from "react";
import { motion } from "framer-motion";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Snackbar,
  Alert,
} from "@mui/material";

import {
  MapPin,
  Phone,
  Mail,
  Clock3,
  MessageCircle,
  Calendar,
  Globe,
} from "lucide-react";

const INTEREST_OPTIONS = [
  "AI & Data Science Courses",
  "Cloud & Cybersecurity Courses",
  "Software Development Courses",
  "Enterprise Software",
  "Youth STEM Academy",
  "Certifications",
  "Corporate Training",
  "Partnership Inquiry",
  "Instructor Opportunities",
  "General Question",
];

const ContactPage = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    interest: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = "Required";
    if (!form.lastName.trim()) newErrors.lastName = "Required";
    if (!form.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = "Invalid email";
    if (!form.phone.match(/^[\d\s\-()+]{7,20}$/)) newErrors.phone = "Invalid phone";
    if (form.message.length < 10) newErrors.message = "Too short";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setForm({ firstName: "", lastName: "", email: "", phone: "", interest: "", message: "" });
    }, 1500);
  };

  return (
    <div className="bg-linear-to-b overflow-hidden from-white to-gray-50 min-h-screen">

      {/* MAIN SECTION */}
      <section className="relative py-28 sm:py-32 px-4 sm:px-6 overflow-hidden">

        {/* BACKGROUND GLOW */}
        <div className="absolute top-0 -left-35 sm:left-0 w-80 sm:w-125 h-80 sm:h-125 bg-green-100 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* LEFT FORM */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] border border-gray-200 bg-white/90 backdrop-blur-2xl shadow-2xl p-5 sm:p-8 md:p-10"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-40" />

            <div className="relative z-10">

              <p className="text-green-700 uppercase tracking-[0.3em] text-xs font-semibold mb-3">
                Get In Touch
              </p>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                Send us a message
              </h2>

              <p className="mt-4 text-gray-600 leading-relaxed">
                Fill out the form and our team will contact you within 4 hours.
              </p>

              <div className="mt-8 sm:mt-10 flex flex-col gap-5 sm:gap-6">

                {/* FIRST + LAST NAME */}
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      First Name
                    </label>
                    <TextField
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      fullWidth
                      variant="outlined"
                      sx={inputStyles}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Last Name
                    </label>
                    <TextField
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
                      fullWidth
                      variant="outlined"
                      sx={inputStyles}
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Email Address
                  </label>
                  <TextField
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    fullWidth
                    variant="outlined"
                    sx={inputStyles}
                  />
                </div>

                {/* PHONE */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Phone Number
                  </label>
                  <TextField
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    fullWidth
                    variant="outlined"
                    sx={inputStyles}
                  />
                </div>

                {/* INTERESTED IN */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Interested In
                  </label>
                  <FormControl fullWidth>
                    <Select
                      name="interest"
                      value={form.interest}
                      onChange={handleChange}
                      displayEmpty
                      sx={selectSx}
                    >
                      <MenuItem value="" disabled>
                        <em style={{ color: "#9ca3af" }}>Select a program</em>
                      </MenuItem>
                      {INTEREST_OPTIONS.map((opt) => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                {/* MESSAGE */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Message
                  </label>
                  <TextField
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    multiline
                    rows={5}
                    error={!!errors.message}
                    helperText={errors.message}
                    fullWidth
                    variant="outlined"
                    sx={inputStyles}
                  />
                </div>

                {/* BUTTON */}
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    fullWidth
                    className="bg-green-600! hover:bg-orange-500! text-white! hover:text-black! py-4! rounded-2xl! font-semibold! shadow-xl! transition-all duration-300"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </motion.div>

              </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-5 sm:space-y-6 min-w-0"
          >

            {/* TOP CARD */}
            <div className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] border border-gray-200 bg-linear-to-br from-green-50 to-orange-50 p-6 sm:p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-200/30 blur-3xl rounded-full" />
              <div className="relative z-10">
                <p className="text-green-700 uppercase tracking-[0.3em] text-xs font-semibold mb-3">
                  Direct Support
                </p>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  We'd love to hear from you
                </h3>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Connect with our team for admissions, mentorship,
                  technical guidance, or career consultation.
                </p>
              </div>
            </div>

            {/* INFO GRID */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">

              <InfoCard
                icon={<MapPin size={20} />}
                title="Headquarters"
                value={"39159 Paseo Padre Pkwy\nSuite 105, Fremont, CA 94538"}
              />

              <InfoCard
                icon={<Phone size={20} />}
                title="Phone"
                value="(510) 651-9600"
                link="tel:+15106519600"
              />

              <InfoCard
                icon={<Mail size={20} />}
                title="Email"
                value="info@schoolfortraining.com"
                link="mailto:info@schoolfortraining.com"
              />

              <InfoCard
                icon={<Clock3 size={20} />}
                title="Working Hours"
                value={"Mon–Fri: 9:30 AM–5:30 PM PT\nSat–Sun: 9:00 AM–4:00 PM PT"}
              />

            </div>

            {/* MAP */}
            <div className="overflow-hidden rounded-[28px] sm:rounded-[36px] border border-gray-200 shadow-xl h-65 sm:h-80">
              <iframe
                src="https://www.google.com/maps?q=39159+Paseo+Padre+Pkwy+Suite+105+Fremont+CA+94538&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>

          </motion.div>
        </div>
      </section>

      {/* CONTACT CHANNELS */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-100 h-50 bg-green-100 rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12"
          >
            <p className="text-green-700 uppercase tracking-[0.3em] text-xs font-semibold mb-3">
              Contact Channels
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Reach Us Your Way
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <ChannelCard
              icon={<Phone size={20} />}
              title="Call Us"
              subtitle="Speak to our team directly"
              action="(510) 651-9600"
              href="tel:+15106519600"
            />
            <ChannelCard
              icon={<Mail size={20} />}
              title="Email Us"
              subtitle="We reply within 4 hours"
              action="info@schoolfortraining.com"
              href="mailto:info@schoolfortraining.com"
            />
            <ChannelCard
              icon={<MessageCircle size={20} />}
              title="WhatsApp"
              subtitle="Chat with us instantly"
              action="Message Us"
              href="https://wa.me/15106519600"
            />
            <ChannelCard
              icon={<Calendar size={20} />}
              title="Book a Call"
              subtitle="Schedule a free consultation"
              action="Book Now"
              href="mailto:info@schoolfortraining.com?subject=Book%20a%20Call%20Request"
            />
          </div>
        </div>
      </section>

      {/* OFFICE HOURS + REGIONAL OFFICES */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute bottom-0 right-0 w-75 h-75 bg-orange-100 rounded-full blur-3xl opacity-20 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">

          {/* OFFICE HOURS */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] border border-gray-200 bg-white/90 backdrop-blur-2xl shadow-2xl p-6 sm:p-8"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-40" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center mb-5">
                <Clock3 size={20} />
              </div>
              <p className="text-green-700 uppercase tracking-[0.3em] text-xs font-semibold mb-3">
                Availability
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                Office Hours
              </h3>
              <div className="space-y-0">
                {[
                  { day: "Monday – Friday", hours: "9:30 AM – 5:30 PM PT" },
                  { day: "Saturday – Sunday", hours: "9:00 AM – 4:00 PM PT" },
                  { day: "Email Support", hours: "4-hour response" },
                  { day: "AI Chat", hours: "24/7 Available" },
                ].map(({ day, hours }) => (
                  <div key={day} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 font-medium text-sm">{day}</span>
                    <span className="text-green-700 font-semibold text-sm">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* REGIONAL OFFICES */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] border border-gray-200 bg-white/90 backdrop-blur-2xl shadow-2xl p-6 sm:p-8"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-40" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center mb-5">
                <Globe size={20} />
              </div>
              <p className="text-green-700 uppercase tracking-[0.3em] text-xs font-semibold mb-3">
                Global Presence
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                Regional Offices
              </h3>
              <div className="grid gap-3">
                {[
                  { flag: "🇺🇸", country: "United States", city: "Fremont, CA — Headquarters", addr: "39159 Paseo Padre Pkwy, Suite 105" },
                  { flag: "🇮🇳", country: "India", city: "Bangalore", addr: "Regional Operations" },
                  { flag: "🇬🇧", country: "United Kingdom", city: "London", addr: "Regional Operations" },
                  { flag: "🇦🇪", country: "UAE", city: "Dubai", addr: "Regional Operations" },
                ].map(({ flag, country, city, addr }) => (
                  <div key={country} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-green-50 transition-colors duration-200">
                    <span className="text-2xl text-green-700 leading-none mt-0.5">{flag}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{country} — {city}</h4>
                      <p className="text-gray-500 text-xs mt-0.5">{addr}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* WHATSAPP FLOAT */}
      <a
        href="https://wa.me/15106519600"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-green-600 text-white flex items-center justify-center shadow-2xl hover:bg-orange-500 hover:text-black transition-all duration-300"
      >
        <MessageCircle size={28} />
      </a>

      {/* SUCCESS ALERT */}
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" variant="filled">
          Message sent! We'll get back to you within 4 hours.
        </Alert>
      </Snackbar>

    </div>
  );
};

/* INPUT STYLES */
const inputStyles = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    "& input": { color: "#111827", padding: "14px 18px", fontSize: "0.9375rem" },
    "& textarea": { color: "#111827", padding: "14px 18px", fontSize: "0.9375rem" },
    "& fieldset": { borderColor: "#e5e7eb" },
    "&:hover fieldset": { borderColor: "#16a34a" },
    "&.Mui-focused fieldset": {
      borderColor: "#16a34a",
      boxShadow: "0 0 0 4px rgba(22,163,74,0.12)",
    },
  },
  "& .MuiInputLabel-root": { color: "#6b7280" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#16a34a" },
  "& .MuiFormHelperText-root": { color: "#ef4444" },
};

/* SELECT STYLES */
const selectSx = {
  borderRadius: "18px",
  backgroundColor: "#ffffff",
  color: "#111827",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e7eb" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#16a34a" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#16a34a",
    boxShadow: "0 0 0 4px rgba(22,163,74,0.12)",
  },
  "& .MuiSelect-icon": { color: "#6b7280" },
};

/* INFO CARD */
const InfoCard = ({ icon, title, value, link }) => (
  <div className="group p-5 sm:p-6 bg-white rounded-3xl sm:rounded-[28px] border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center mb-5 group-hover:bg-orange-100 group-hover:text-orange-500 transition-all duration-300">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
    {link ? (
      <a href={link} className="text-gray-600 text-sm mt-2 leading-relaxed block hover:text-green-700 transition-colors whitespace-pre-line">
        {value}
      </a>
    ) : (
      <p className="text-gray-600 text-sm mt-2 leading-relaxed whitespace-pre-line">{value}</p>
    )}
  </div>
);

/* CHANNEL CARD */
const ChannelCard = ({ icon, title, subtitle, action, href }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group p-5 sm:p-6 bg-white rounded-3xl sm:rounded-[28px] border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
  >
    <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center mb-5 group-hover:bg-orange-100 group-hover:text-orange-500 transition-all duration-300">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
    <p className="text-gray-500 text-sm mt-1 mb-4 leading-relaxed flex-1">{subtitle}</p>
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="inline-block px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-orange-500 hover:text-black transition-all duration-300 text-center break-all"
    >
      {action}
    </a>
  </motion.div>
);

export default ContactPage;
