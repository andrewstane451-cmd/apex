import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, BarChart3, GitBranch, Wallet, User } from "lucide-react";

const navItems = [
  { id: "home", path: "/dashboard", icon: Home, label: "Home" },
  { id: "cfds", path: "/dashboard/cfds", icon: BarChart3, label: "CFDs" },
  { id: "options", path: "/dashboard/options", icon: GitBranch, label: "Options" },
  { id: "wallets", path: "/dashboard/wallets", icon: Wallet, label: "Wallets" },
];

// Routes where bottom nav should be hidden
const hideNavRoutes = ["/dashboard/bot", "/dashboard/profile", "/dashboard/verify"];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const shouldHideNav = hideNavRoutes.some((r) => location.pathname.startsWith(r));

  const activeTab = navItems.find((item) =>
    item.path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(item.path)
  )?.id ?? "home";

  return (
    <>
      <Outlet />
      {!shouldHideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around py-2 px-4 z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-1 px-3 ${
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => navigate("/dashboard/profile")}
            className="flex flex-col items-center gap-1 py-1 px-3 text-muted-foreground"
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </button>
        </nav>
      )}
    </>
  );
};

export default DashboardLayout;
