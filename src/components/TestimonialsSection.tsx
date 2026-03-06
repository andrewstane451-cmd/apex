import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    text: "Trading with Deriv has been great. It has beautiful low spreads and there are options where you can choose the best or suitable trading account.",
    author: "Tshepang Israel P.",
  },
  {
    text: "Deriv is an easy and smooth trading experience, better than any other platform. The peer-to-peer transaction is revolutionary.",
    author: "Tinashe K.",
  },
  {
    text: "Deriv is the best trading platform. I never had difficulty in trading for more than 5 years. Thank you Deriv.",
    author: "Ezra H.",
  },
  {
    text: "I'm happy with the service provided. Deriv always updates me on what's happening and the staff is very responsive.",
    author: "Wandile S.",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-6 lg:px-10">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            What our customers say
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="p-6 bg-card rounded-2xl border border-border"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 text-green-500 fill-green-500" />
                ))}
              </div>
              <Quote className="w-5 h-5 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">{t.text}</p>
              <div className="text-xs font-semibold text-muted-foreground">{t.author}</div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <span className="text-sm text-muted-foreground">
            Rated <strong className="text-foreground">4.4/5</strong> on Trustpilot
          </span>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
