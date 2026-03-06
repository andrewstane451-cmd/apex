import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Cpu, Gem, Bitcoin, LineChart } from "lucide-react";

const markets = [
  {
    icon: TrendingUp,
    title: "Forex",
    description: "Trade the most popular currency pairs with high leverage, tight spreads, and fast execution.",
  },
  {
    icon: BarChart3,
    title: "Derived Indices",
    description: "Trade 24/7 on exclusive Synthetic and Derived Indices. Choose volatility levels that match your strategy.",
  },
  {
    icon: LineChart,
    title: "Stocks",
    description: "Trade global market leaders like Apple, Tesla, and NVIDIA.",
  },
  {
    icon: Gem,
    title: "Commodities",
    description: "Trade gold, silver, oil, natural gas, sugar, and more with competitive leverage.",
  },
  {
    icon: Bitcoin,
    title: "Crypto",
    description: "Trade round the clock on the volatility of cryptocurrencies like Bitcoin and Ethereum.",
  },
  {
    icon: Cpu,
    title: "Stock Indices",
    description: "Trade offerings that track the top global stock indices.",
  },
];

const MarketsSection = () => {
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
            All your markets in one place
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {markets.map((market, i) => (
            <motion.div
              key={market.title}
              className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/40 transition-all cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <market.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{market.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{market.description}</p>
              <button className="mt-4 text-sm text-primary font-semibold hover:underline">
                Learn more →
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketsSection;
