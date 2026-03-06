import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import MarketsSection from "@/components/MarketsSection";
import TradeDayNight from "@/components/TradeDayNight";
import PlatformsSection from "@/components/PlatformsSection";
import PaymentSection from "@/components/PaymentSection";
import SupportSection from "@/components/SupportSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import StepsSection from "@/components/StepsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <MarketsSection />
      <TradeDayNight />
      <PlatformsSection />
      <PaymentSection />
      <SupportSection />
      <TestimonialsSection />
      <StepsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
