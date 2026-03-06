import { Headphones } from "lucide-react";
import { motion } from "framer-motion";

const SupportSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6 lg:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Headphones className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get answers when you need
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            We don't have opening or closing hours. That means you can speak to our Support whenever you need, wherever you are.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default SupportSection;
