import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-24 bg-secondary relative overflow-hidden">
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary blur-[150px]" />
      </div>
      <div className="container mx-auto px-6 lg:px-10 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Join 3M+ global traders
          </h2>
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

export default CTASection;
