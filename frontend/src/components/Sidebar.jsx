import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Pill, Receipt, Users,
  BarChart3, Settings, LogOut
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/medicines", icon: Pill, label: "Medicines" },
  { to: "/billing", icon: Receipt, label: "Billing" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

const Sidebar = () => {
  const { logout } = useAuth();
  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-800">💊 MedBill</h1>
        <p className="text-xs text-gray-500 mt-1">Medical Billing Software</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${isActive
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
            }>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;