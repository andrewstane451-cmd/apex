const Footer = () => {
  const footerLinks = {
    Trading: ["Forex", "Derived Indices", "Stocks", "Commodities", "Crypto", "Stock Indices"],
    Platforms: ["Deriv MT5", "Deriv cTrader", "Deriv Trader", "Deriv Bot"],
    Company: ["About us", "Careers", "Contact us", "Partners"],
    Support: ["Help centre", "Community", "Payment methods", "Status page"],
    Legal: ["Terms & conditions", "Security & privacy", "Responsible trading"],
  };

  return (
    <footer className="py-16 bg-card border-t border-border">
      <div className="container mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-bold text-foreground mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="#" className="text-xl font-bold text-foreground">deriv</a>
          <p className="text-xs text-muted-foreground text-center md:text-right max-w-xl">
            Trading is risky. Ensure you understand the risks involved before trading. The information on this website is not directed at residents of certain jurisdictions.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
