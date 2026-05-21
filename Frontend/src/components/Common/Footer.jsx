import { Facebook, Twitter, LinkedIn, GitHub } from "@mui/icons-material";
import {useNavigate} from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-white text-black px-4 sm:px-6 pt-10 pb-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Top Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <img src="https://schoolfortraining.com/sft_logo.png" alt="SchoolForTraining Logo" className="h-15 w-auto pb-3" />
            <p className="text-gray-700 max-w-sm">
              Empowering students with real-world skills, hands-on projects,
              and career-focused learning paths.
            </p>

            {/* Social Icons */}
            <div className="flex flex-wrap gap-4 mt-6">
              <a href="https://www.facebook.com/schoolfortraining" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="hover:text-blue-500 cursor-pointer" />
              </a>
              <a href="https://twitter.com/sft_learn" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter className="hover:text-blue-400 cursor-pointer" />
              </a>
              <a href="https://www.linkedin.com/company/schoolfortraining" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <LinkedIn className="hover:text-blue-700 cursor-pointer" />
              </a>
              <a href="https://github.com/schoolfortraining" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <GitHub className="hover:text-gray-800 cursor-pointer" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-gray-800 font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/courses")}>
                Courses
              </li>
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/features")}>
                Features
              </li>
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/pricing")}>
                Pricing
              </li>
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/testimonials")}>
                Testimonials
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-gray-800 font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/about")}>
                About Us
              </li>
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/careers")}>
                Careers
              </li>
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/blog")}>
                Blog
              </li>
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/contact")}>
                Contact
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-gray-800 font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/help")}>
                Help Center
              </li>
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/privacy")}>
                Privacy Policy
              </li>
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/terms")}>
                Terms of Service
              </li>
              <li className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/community")}>
                Community
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">

          <p className="text-sm">
            © {new Date().getFullYear()} SchoolForTraining. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:mt-0 text-sm">
            <span className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/privacy")}>
              Privacy
            </span>
            <span className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/terms")}>
              Terms
            </span>
            <span className="hover:text-green-900 cursor-pointer" onClick={() => navigate("/cookies")}>
              Cookies
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}
