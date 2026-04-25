import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = "https://billing-software-production-ff58.up.railway.app/api";

const Reports = () => {
  const [invoices, setInvoices] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [tab, setTab] = useState("sales");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [inv, ls, exp] = await Promise.all([
          axios.get(`${API}/invoices`),
          axios.get(`${API}/reports/low-stock`),
          axios.get(`${API}/reports/expiry`),
        ]);
        setInvoices(inv.data);
        setLowStock(ls.data);
        setExpiring(exp.data);
      } catch { toast.error("Failed to load reports"); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const totalSales = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const totalGST = invoices.reduce((s, i) => s + (i.gst_amount || 0), 0);

  const tabs = [
    { key: "sales", label: "Sales History", count: invoices.length },
    { key: "lowstock", label: "Low Stock", count: lowStock.length },
    { key: "expiry", label: "Expiring Soon", count: expiring.length },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reports</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <p className="text-sm text-emerald-600 font-medium">Total Sales</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">₹{totalSales.toFixed(2)}</p>
          <p className="text-xs text-emerald-500 mt-1">{invoices.length} invoices</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-sm text-blue-600 font-medium">Total GST Collected</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">₹{totalGST.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
          <p className="text-sm text-red-600 font-medium">Alerts</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{lowStock.length + expiring.length}</p>
          <p className="text-xs text-red-500 mt-1">{lowStock.length} low stock · {expiring.length} expiring</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? "bg-emerald-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {t.label} {t.count > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${tab === t.key ? "bg-emerald-400" : "bg-gray-100"}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Loading...</div>}

      {/* Sales Tab */}
      {!loading && tab === "sales" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                {["Invoice #", "Customer", "Cashier", "Items", "GST", "Total", "Payment", "Date"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No invoices yet. Create your first bill!</td></tr>
              )}
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-emerald-600">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-gray-700">{inv.customer_name}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.cashier_name}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.items?.length || 0}</td>
                  <td className="px-4 py-3 text-gray-600">₹{(inv.gst_amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">₹{(inv.total_amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full capitalize">{inv.payment_method}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inv.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Low Stock Tab */}
      {!loading && tab === "lowstock" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                {["Medicine", "Category", "Current Stock", "Min Level", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lowStock.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">✓ All medicines are well stocked!</td></tr>
              )}
              {lowStock.map(med => (
                <tr key={med.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{med.name}</p>
                    <p className="text-xs text-gray-400">{med.generic_name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{med.category || "-"}</td>
                  <td className="px-4 py-3 font-bold text-red-500">{med.quantity}</td>
                  <td className="px-4 py-3 text-gray-600">{med.minimum_stock_level}</td>
                  <td className="px-4 py-3">
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">Reorder Now</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expiry Tab */}
      {!loading && tab === "expiry" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                {["Medicine", "Batch", "Stock", "Expiry Date", "Days Left"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expiring.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">✓ No medicines expiring soon!</td></tr>
              )}
              {expiring.map(med => {
                const days = Math.ceil((new Date(med.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{med.name}</p>
                      <p className="text-xs text-gray-400">{med.generic_name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{med.batch_number || "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{med.quantity}</td>
                    <td className="px-4 py-3 font-medium text-orange-500">{med.expiry_date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${days <= 0 ? "bg-red-100 text-red-600" : days <= 7 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                        {days <= 0 ? "Expired" : `${days} days`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
