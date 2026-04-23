import { useEffect, useState } from "react";
import { getMedicines, addMedicine, updateMedicine, deleteMedicine } from "../api";
import { Search, Plus, Scan, Edit, Trash2, AlertTriangle } from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
import toast from "react-hot-toast";

const emptyForm = {
  name: "", generic_name: "", manufacturer: "", batch_number: "",
  quantity: "", price: "", mrp: "", gst_percentage: "12",
  expiry_date: "", barcode: "", category: "", minimum_stock_level: "10"
};

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

useEffect(() => {
  fetchMedicines();
}, [search]);

async function fetchMedicines() {
  try {
    const res = await getMedicines({ search });
    setMedicines(res.data);
  } catch {
    toast.error("Failed to load medicines");
  }
}
  const handleScan = (value) => {
    setShowScanner(false);
    setForm(f => ({ ...f, barcode: value }));
    toast.success(`Scanned: ${value}`);
  };

  const openScanner = () => {
  setShowScanner(true);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await updateMedicine(editId, form);
        toast.success("Medicine updated!");
      } else {
        await addMedicine(form);
        toast.success("Medicine added!");
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      fetchMedicines();
    } catch { toast.error("Failed to save medicine"); }
    finally { setLoading(false); }
  };

  const handleEdit = (med) => {
    setForm({ ...med });
    setEditId(med.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this medicine?")) return;
    try {
      await deleteMedicine(id);
      toast.success("Deleted!");
      fetchMedicines();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Medicines</h2>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600
                     text-white rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Add Medicine
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search medicines..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-emerald-300" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Name", "Batch", "Qty", "MRP ₹", "Expiry", "GST%", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {medicines.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No medicines found</td></tr>
            ) : medicines.map(med => (
              <tr key={med.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{med.name}</p>
                  <p className="text-xs text-gray-400">{med.generic_name}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{med.batch_number || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${med.quantity <= med.minimum_stock_level ? "text-red-500" : "text-gray-700"}`}>
                    {med.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">₹{med.mrp}</td>
                <td className="px-4 py-3 text-gray-600">{med.expiry_date}</td>
                <td className="px-4 py-3 text-gray-600">{med.gst_percentage}%</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(med)}
                      className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(med.id)}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">{editId ? "Edit Medicine" : "Add New Medicine"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Barcode field with scanner */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Barcode / QR Code</label>
                  <div className="flex gap-2">
                    <input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })}
                      placeholder="Scan or type barcode..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    <button type="button" onClick={openScanner}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100
                                 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium transition-colors">
                      <Scan size={16} /> Scan
                    </button>
                  </div>
                </div>

                {[
                  { label: "Medicine Name *", key: "name", required: true },
                  { label: "Generic Name", key: "generic_name" },
                  { label: "Manufacturer", key: "manufacturer" },
                  { label: "Batch Number", key: "batch_number" },
                  { label: "Category", key: "category" },
                  { label: "Expiry Date *", key: "expiry_date", type: "date", required: true },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input type={f.type || "text"} required={f.required}
                      value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  </div>
                ))}

                {[
                  { label: "Quantity *", key: "quantity", type: "number", required: true },
                  { label: "Min Stock Level", key: "minimum_stock_level", type: "number" },
                  { label: "Purchase Price ₹ *", key: "price", type: "number", step: "0.01", required: true },
                  { label: "MRP ₹ *", key: "mrp", type: "number", step: "0.01", required: true },
                  { label: "GST %", key: "gst_percentage", type: "number", step: "0.5" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input type={f.type} required={f.required} step={f.step}
                      value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                  {loading ? "Saving..." : editId ? "Update Medicine" : "Add Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          title="Scan Medicine Barcode"
        />
      )}
    </div>
  );
};

export default Medicines;