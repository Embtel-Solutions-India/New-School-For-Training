import Navbar from '../components/Common/NavBar';
import Footer from '../components/Common/Footer';
import BlogHero from '../components/Blogs/BlogHero';
import BlogListing from '../components/Blogs/BlogListing';

const BlogPage = () => {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <BlogHero />
      <BlogListing />
      <Footer />
    </div>
  );
};

export default BlogPage;
