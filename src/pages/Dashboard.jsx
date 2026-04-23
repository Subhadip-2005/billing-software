import { useEffect, useState } from "react";
import { getDashboardStats, getLowStockAlerts, getExpiryAlerts } from "../api";
import { TrendingUp, Package, Users, AlertTriangle } from "lucide-react";

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className={`p-6 rounded-2xl ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium opacity-70">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <Icon size={32} className="opacity-60" />
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);

useEffect(() => {
  getDashboardStats().then(r => setStats(r.data)).catch(() => {});
  getLowStockAlerts().then(r => setLowStock(r.data)).catch(() => {});
  getExpiryAlerts().then(r => setExpiring(r.data)).catch(() => {});
}, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales" value={`₹${stats?.today_sales || 0}`}
          icon={TrendingUp} color="bg-emerald-100 text-emerald-800" />
        <StatCard label="Total Medicines" value={stats?.total_medicines || 0}
          icon={Package} color="bg-sky-100 text-sky-800" />
        <StatCard label="Customers" value={stats?.total_customers || 0}
          icon={Users} color="bg-purple-100 text-purple-800" />
        <StatCard label="Low Stock" value={stats?.low_stock_count || 0}
          icon={AlertTriangle} color="bg-orange-100 text-orange-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" />
            Low Stock Alerts
          </h3>
          {lowStock.length === 0
            ? <p className="text-gray-400 text-sm">All medicines are well stocked</p>
            : lowStock.map(m => (
              <div key={m._id} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-700">{m.name}</span>
                <span className="text-orange-500 font-medium">{m.quantity} left</span>
              </div>
            ))
          }
        </div>

        {/* Expiry alerts */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Expiring Soon
          </h3>
          {expiring.length === 0
            ? <p className="text-gray-400 text-sm">No medicines expiring soon</p>
            : expiring.map(m => (
              <div key={m._id} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-700">{m.name}</span>
                <span className="text-red-500 font-medium">{m.expiry_date}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;