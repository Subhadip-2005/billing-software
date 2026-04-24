import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = "http://127.0.0.1:8000/api";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API}/customers`, { params: { search } });
      setCustomers(res.data);
    } catch { toast.error("Failed to load customers"); }
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/customers`, form);
      toast.success("Customer added!");
      setShowForm(false);
      setForm({ name: "", phone: "", email: "", address: "" });
      fetchCustomers();
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
        <button onClick={() => setShowForm(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
          + Add Customer
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or phone..."
        className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-emerald-300" />

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Customer</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                ["name", "Full Name*", "text", true],
                ["phone", "Phone Number*", "tel", true],
                ["email", "Email", "email", false],
                ["address", "Address", "text", false],
              ].map(([key, label, type, req]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type={type} value={form[key]} required={req}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
              ))}
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                  {loading ? "Saving..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">No customers found. Add your first customer!</div>
        )}
        {customers.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                {c.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400">{c.phone}</p>
              </div>
            </div>
            {c.email && <p className="text-xs text-gray-500 mt-1">📧 {c.email}</p>}
            {c.address && <p className="text-xs text-gray-500 mt-1">📍 {c.address}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Customers;