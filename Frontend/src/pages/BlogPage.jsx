import React from 'react'
import BlogSection from '../components/Blogs/BlogSection';
import Navbar from '../components/Common/NavBar';
import Footer from '../components/Common/Footer';
import BlogHero from '../components/Blogs/BlogHero';

const BlogPage = () => {
  return (
    <div className="overflow-x-hidden">
    <Navbar/>
    <BlogHero/>
    <BlogSection/>
    <Footer/>
      
    </div>
  )
}

export default BlogPage;
