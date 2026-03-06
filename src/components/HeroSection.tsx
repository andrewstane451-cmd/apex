import heroBackground from "@/assets/hero-background.webp";
import heroPerson from "@/assets/hero-person.webp";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroBackground}
          alt="City skyline at dusk"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--hero-overlay)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 lg:px-10 flex items-center justify-between pt-24">
        <motion.div
          className="max-w-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-foreground/70 text-lg mb-2 font-medium">Trading for</p>
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-[1.1] mb-6">
            Anyone<br />
            Anywhere<br />
            Anytime
          </h1>
          <p className="text-foreground/60 text-lg mb-8 max-w-md">
            Widest range of products, markets, platforms with 24/7 customer support.
          </p>
          <div className="flex items-center gap-4">
             <Link to="/register">
            <button className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-full hover:brightness-110 transition-all text-sm">
              Open account
            </button>
             </Link>
             <Link to="/login">
            <button className="px-8 py-3.5 border border-foreground/30 text-foreground font-semibold rounded-full hover:bg-foreground/10 transition-colors text-sm">
              Trade now
            </button>
            </Link>
          </div>
        </motion.div>

        {/* Hero person with phone mockup */}
        <motion.div
          className="hidden lg:block relative"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <img
            src={heroPerson}
            alt="Trader using mobile app"
            className="h-[600px] object-contain relative z-10"
          />
          {/* Phone mockup overlay */}
          <div className="absolute top-16 -left-8 w-56 bg-card rounded-2xl shadow-2xl p-4 border border-border z-20">
            <div className="text-xs text-muted-foreground">Total assets</div>
            <div className="text-lg font-bold text-foreground">2,742.43 USD</div>
            <div className="text-xs text-muted-foreground mt-0.5">Updated 1 min. ago</div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {["CFDs", "Options", "Swap-Free"].map((item) => (
                <div key={item} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trustpilot bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm py-3 flex items-center justify-center gap-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className={`w-5 h-5 ${star <= 4 ? 'text-green-500' : 'text-green-500/50'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm text-foreground/80">
          Deriv scores <strong>4.4</strong> out of 5 based on <strong>67,803</strong> reviews
        </span>
        <span className="text-sm font-semibold text-foreground/60 ml-1">★ Trustpilot</span>
      </div>
    </section>
  );
};

export default HeroSection;
