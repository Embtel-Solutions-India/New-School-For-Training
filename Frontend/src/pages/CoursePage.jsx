import React from 'react'
import Navbar from '../components/Common/NavBar'
import CourseShowcase from '../components/Courses/CourseShowcase'
import Footer from '../components/Common/Footer'
import CourseHero from '../components/Courses/CourseHero'

const CoursePage = () => {
  return (
    <div className="overflow-x-hidden">
    <Navbar/>
    <CourseHero/>
    <CourseShowcase/>
    <Footer/>
    </div>
  )
}

export default CoursePage
