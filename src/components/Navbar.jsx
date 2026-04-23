import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user } = useAuth();
  return (
    <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <h2 className="text-sm font-medium text-gray-500">Medical Billing System</h2>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-emerald-700 text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-700">{user?.name || "User"}</span>
      </div>
    </div>
  );
};

export default Navbar;