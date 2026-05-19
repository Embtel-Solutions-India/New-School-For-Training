import React from 'react'
import Contact from '../components/Contact/ContactPage'
import Navbar from '../components/Common/NavBar'
import Footer from '../components/Common/Footer'
import ContactHero from '../components/Contact/ContactHero'

const ContactPage = () => {
  return (
    <div className="overflow-x-hidden">
      <Navbar/>
      <ContactHero/>
        <Contact/>
      
      <Footer/>
    </div>
  )
}

export default ContactPage
