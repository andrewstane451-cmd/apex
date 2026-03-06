import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

const TradeDayNight = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-500 blur-[100px]" />
      </div>
      <div className="container mx-auto px-6 lg:px-10 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sun className="w-8 h-8 text-amber-400" />
            <Moon className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Trade all <span className="text-gradient">day & night</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-10">
            Cryptocurrencies and our unique Synthetic Indices are available 24/7.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-full hover:brightness-110 transition-all text-sm">
              Open account
            </button>
            <button className="px-8 py-3.5 border border-foreground/30 text-foreground font-semibold rounded-full hover:bg-foreground/10 transition-colors text-sm">
              Trade now
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TradeDayNight;
