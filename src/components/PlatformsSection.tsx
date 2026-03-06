import { motion } from "framer-motion";
import { Users, Zap, Shield, Bot } from "lucide-react";

const platforms = [
  {
    icon: Users,
    title: "Copy expert traders",
    description: "On Deriv cTrader, tap into the expertise of seasoned traders. Follow their strategies, and mirror their trades automatically.",
    cta: "Explore Deriv cTrader",
    accent: true,
  },
  {
    icon: Zap,
    title: "Power of MT5 with 24/7 trading",
    description: "Deriv MT5 brings you the world's favourite platform with the widest range of forex, stocks, commodities, and cryptocurrencies.",
    cta: "Explore Deriv MT5",
    accent: false,
  },
  {
    icon: Shield,
    title: "Optimised payouts, limited downsides",
    description: "On Deriv Trader, you'll never lose more than you put in. Know your maximum risk upfront when trading global markets.",
    cta: "Explore Deriv Trader",
    accent: false,
  },
  {
    icon: Bot,
    title: "Automate your trades",
    description: "Deriv Bot keeps your strategies running on 24/7 exclusive indices and traditional markets. No coding required.",
    cta: "Explore Deriv Bot",
    accent: true,
  },
];

const PlatformsSection = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-6 lg:px-10">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Trade the way you want
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {platforms.map((platform, i) => (
            <motion.div
              key={platform.title}
              className={`p-8 rounded-2xl border transition-all ${
                platform.accent
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                <platform.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{platform.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {platform.description}
              </p>
              <button className="text-sm text-primary font-semibold hover:underline">
                {platform.cta} →
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformsSection;
