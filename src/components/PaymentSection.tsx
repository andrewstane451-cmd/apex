import { motion } from "framer-motion";
import { CreditCard, Wallet, Coins, Building2 } from "lucide-react";

const paymentMethods = [
  "Mastercard", "Credit/Debit", "Tether USDT", "USD Coin",
  "Bitcoin", "Ethereum", "Skrill", "Bank Transfer"
];

const PaymentSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6 lg:px-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Your money, your way
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Quick deposits, easy withdrawals, and local payment options mean your money is always accessible.
          </p>
        </motion.div>

        {/* Scrolling payment icons */}
        <div className="overflow-hidden mb-8">
          <div className="flex animate-scroll-left">
            {[...paymentMethods, ...paymentMethods].map((method, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex items-center gap-2 mx-3 px-5 py-3 bg-secondary rounded-xl border border-border"
              >
                {i % 4 === 0 && <CreditCard className="w-5 h-5 text-muted-foreground" />}
                {i % 4 === 1 && <Wallet className="w-5 h-5 text-muted-foreground" />}
                {i % 4 === 2 && <Coins className="w-5 h-5 text-muted-foreground" />}
                {i % 4 === 3 && <Building2 className="w-5 h-5 text-muted-foreground" />}
                <span className="text-sm text-foreground/80 whitespace-nowrap">{method}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          *Availability of payment methods and processing speeds may vary based on location and selected payment option.
        </p>
        <div className="text-center mt-6">
          <button className="text-sm text-primary font-semibold hover:underline">
            Learn more →
          </button>
        </div>
      </div>
    </section>
  );
};

export default PaymentSection;
