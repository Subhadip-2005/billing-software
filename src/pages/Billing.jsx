import { useState, useEffect } from "react";
import { getMedicines, getMedicineByBarcode, createInvoice } from "../api";
import { Search, Scan, Receipt, X } from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
import toast from "react-hot-toast";
import PrintBill from "../components/PrintBill";

const Billing = () => {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [customerName, setCustomerName] = useState(" ");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState();
  const [discountType, setDiscountType] = useState("flat"); // "flat" | "percent"
  const [loading, setLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (search.length > 1) {
        getMedicines({ search })
          .then(r => setResults(r.data))
          .catch(() => setResults([]));
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const handleScan = async (value) => {
    setShowScanner(false);
    try {
      const res = await getMedicineByBarcode(value);
      addToCart(res.data);
      toast.success(`Found: ${res.data.name}`);
    } catch {
      toast.error(`No medicine found for barcode: ${value}`);
    }
  };

  const addToCart = (med) => {
    setSearch("");
    setResults([]);
    if (med.quantity <= 0) {
      toast.error("Out of stock!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.medicine_id === med.id);
      if (existing) {
        return prev.map(i =>
          i.medicine_id === med.id
            ? { ...i, quantity: Math.min(i.quantity + 1, med.quantity) }
            : i
        );
      }
      return [...prev, {
        medicine_id: med.id,
        medicine_name: med.name,
        quantity: 1,
        unit_price: med.mrp,
        gst_percentage: med.gst_percentage,
        max_qty: med.quantity,
        total: med.mrp,
      }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCart(prev => prev.map(i =>
      i.medicine_id === id
        ? { ...i, quantity: Math.min(qty, i.max_qty), total: i.unit_price * Math.min(qty, i.max_qty) }
        : i
    ));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.medicine_id !== id));

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const gstTotal = cart.reduce((s, i) => s + (i.total * i.gst_percentage) / (100 + i.gst_percentage), 0);

  // Resolve discount to a rupee amount
  const discountAmount = discountType === "percent"
    ? (subtotal * discount) / 100
    : Number(discount);

  const grandTotal = subtotal - discountAmount;

  const handleBill = async () => {
    if (cart.length === 0) { toast.error("Cart is empty!"); return; }
    setLoading(true);
    try {
      const res = await createInvoice({
        customer_name: customerName,
        items: cart.map(({ medicine_id, medicine_name, quantity, unit_price, gst_percentage, total }) =>
          ({ medicine_id, medicine_name, quantity, unit_price, gst_percentage, total })
        ),
        payment_method: paymentMethod,
        total_amount: grandTotal,
        gst_amount: gstTotal,
        discount: discountAmount, // always send resolved ₹ amount to API
      });

      setLastInvoice({
        invoice_number: res.data.invoice_number,
        customerName,
        cart,
        grandTotal,
        gstTotal,
        subtotal,
        discount: discountAmount, // resolved ₹ amount for printing
        paymentMethod,
        created_at: new Date().toISOString(),
      });

      setShowInvoice(true);
      setCart([]);
      setDiscount(0);
      toast.success(`Invoice ${res.data.invoice_number} created!`);
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">
      {/* Left - Medicine search */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Billing / POS</h2>

        {/* Search + Scan bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search medicine by name..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200
                              rounded-xl shadow-lg z-30 max-h-52 overflow-y-auto">
                {results.map(med => (
                  <button key={med.id} onClick={() => addToCart(med)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50
                               text-left transition-colors border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{med.name}</p>
                      <p className="text-xs text-gray-400">{med.generic_name} · Qty: {med.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">₹{med.mrp}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600
                       text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
            <Scan size={16} /> Scan
          </button>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 text-sm">Cart ({cart.length} items)</h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600">
                Clear all
              </button>
            )}
          </div>
          {cart.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Receipt size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Search or scan medicines to add</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium">Medicine</th>
                  <th className="px-4 py-2 text-center text-xs text-gray-500 font-medium">Qty</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 font-medium">Price</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500 font-medium">Total</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.medicine_id} className="border-t border-gray-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-800">{item.medicine_name}</p>
                      <p className="text-xs text-gray-400">GST: {item.gst_percentage}%</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateQty(item.medicine_id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm flex items-center justify-center">
                          −
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.medicine_id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm flex items-center justify-center">
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600">₹{item.unit_price}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800">₹{item.total.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => removeFromCart(item.medicine_id)}
                        className="p-1 hover:bg-red-50 text-red-400 rounded-lg transition-colors">
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right - Summary */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 sticky top-6">
          <h3 className="font-bold text-gray-800">Order Summary</h3>

          {/* Customer */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Payment */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
            <div className="grid grid-cols-3 gap-1.5">
              {["cash", "upi", "split"].map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`py-2 rounded-xl text-xs font-medium capitalize transition-colors
                    ${paymentMethod === m
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Discount with type toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Discount</label>
            {/* Toggle: Flat / Percent */}
            <div className="flex gap-1.5 mb-1.5">
              {[
                { value: "flat", label: "₹ Flat" },
                { value: "percent", label: "% Percent" },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => { setDiscountType(t.value); setDiscount(0); }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-colors
                    ${discountType === t.value
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* Input with dynamic prefix */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
                {discountType === "flat" ? "₹" : "%"}
              </span>
              <input
                type="number"
                min="0"
                max={discountType === "percent" ? 100 : undefined}
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>GST (included)</span>
              <span>₹{gstTotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Discount {discountType === "percent" ? `(${discount}%)` : ""}
                </span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleBill}
            disabled={loading || cart.length === 0}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl
                       font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Receipt size={18} />
            {loading ? "Processing..." : "Generate Bill"}
          </button>
        </div>
      </div>

      {/* Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          title="Scan Medicine Barcode"
        />
      )}

      {/* Invoice preview */}
      {showInvoice && lastInvoice && (
        <PrintBill
          invoice={{
            ...lastInvoice,
            subtotal: lastInvoice.cart.reduce((s, i) => s + i.total, 0),
          }}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
};

export default Billing;