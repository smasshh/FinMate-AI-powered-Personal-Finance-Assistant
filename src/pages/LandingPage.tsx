
import NavBar from "../components/landing/NavBar";
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import Footer from "../components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
