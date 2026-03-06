import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Globe, Menu, X } from "lucide-react";

const navItems = [
  { label: "Trading", hasDropdown: false },
  { label: "Platforms", hasDropdown: false },
  { label: "About", hasDropdown: false },
  { label: "Support", hasDropdown: false },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 lg:px-10">
      {/* Logo */}
      <a href="#" className="text-2xl font-bold text-foreground tracking-tight">
        Apex Trade
      </a>

      {/* Center nav */}
      <div className="hidden lg:flex items-center gap-1 bg-secondary/80 backdrop-blur-md rounded-full px-2 py-1.5">
        {navItems.map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
          >
            {item.label}
            {item.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        ))}
        <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-full hover:bg-muted/50">
          <Globe className="w-4 h-4" />
          EN
        </button>
      </div>

      {/* Right actions */}
      <div className="hidden lg:flex items-center gap-3">
        <Link to="/login" className="px-5 py-2.5 text-sm font-semibold text-foreground border border-foreground/30 rounded-full hover:bg-foreground/10 transition-colors">
          Log in
        </Link>
        <Link to="/register" className="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-full hover:brightness-110 transition-all">
          Open account
        </Link>
      </div>

      {/* Mobile toggle */}
      <button
        className="lg:hidden text-foreground"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-secondary/95 backdrop-blur-lg p-6 flex flex-col gap-4 lg:hidden border-t border-border">
          {navItems.map((item) => (
            <button
              key={item.label}
              className="flex items-center justify-between py-2 text-foreground font-medium"
            >
              {item.label}
              <ChevronDown className="w-4 h-4" />
            </button>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <Link to="/login" className="w-full py-3 text-sm font-semibold text-foreground border border-foreground/30 rounded-full text-center">
              Log in
            </Link>
            <Link to="/register" className="w-full py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-full text-center">
              Open account
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
