import { motion } from "framer-motion";
import { Award } from "lucide-react";

const stats = [
  { value: "168M+", label: "Monthly deals" },
  { value: "3M+", label: "Customers worldwide" },
  { value: "$650B+", label: "Monthly volume" },
  { value: "1999", label: "Established since" },
];

const awards = [
  { title: "Best Trading Experience - Global", org: "Ultimate Fintech 2025" },
  { title: "Most Transparent Broker - Global", org: "Global Forex Awards 2025" },
  { title: "Best Broker - Africa", org: "Global Forex Awards 2025" },
  { title: "Best Trading Conditions - Global", org: "Finance Magnates 2025" },
];

const StatsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6 lg:px-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trade with confidence
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            For over 25 years, Deriv Group has been a trusted partner of traders worldwide.
          </p>
        </motion.div>

        {/* Awards ticker */}
        <div className="overflow-hidden mb-12">
          <div className="flex animate-ticker whitespace-nowrap">
            {[...awards, ...awards].map((award, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex items-center gap-3 mx-6 px-6 py-3 bg-secondary rounded-xl border border-border"
              >
                <Award className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{award.title}</div>
                  <div className="text-xs text-muted-foreground">{award.org}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
