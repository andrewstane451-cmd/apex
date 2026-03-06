import { motion } from "framer-motion";
import { UserPlus, CreditCard, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Sign up",
    description: "Sign up in minutes. Practise with a zero-risk demo account.",
  },
  {
    icon: CreditCard,
    number: "02",
    title: "Deposit",
    description: "Use your favourite local payment method to fund your account.",
  },
  {
    icon: TrendingUp,
    number: "03",
    title: "Trade",
    description: "Start your trading journey.",
  },
];

const StepsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6 lg:px-10">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Get started in 3 simple steps
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-xs text-primary font-bold mb-2">STEP {step.number}</div>
              <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
