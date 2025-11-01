


import Navigation from './components/Navigation'
import HeroSection from './components/HeroSection'
import FeaturesSection from './components/FeaturesSection'
import VisualFeaturesSection from './components/VisualFeaturesSection'
import PricingSection from './components/PricingSection'
import TestimonialsSection from './components/TestimonialsSection'
import CTASection from './components/CTASection'
import Footer from './components/Footer'
import { useState } from 'react'

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  return (
    <div className={`min-h-screen transition-colors duration-300`}    >
       <Navigation isMenuOpen={isMenuOpen} toggleMenu={() => setIsMenuOpen(!isMenuOpen)}/>
      <main>
        <HeroSection />
        <FeaturesSection />
        <VisualFeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default HomePage



