import { useEffect } from "react";

const PrintBill = ({ invoice, onClose }) => {
  const {
    invoice_number, customerName, cart, grandTotal,
    gstTotal, paymentMethod, discount, subtotal,
    created_at, cashierName
  } = invoice;

  const discountPercent = subtotal > 0
    ? ((discount / subtotal) * 100).toFixed(1)
    : 0;

  const printDate = created_at
    ? new Date(created_at).toLocaleString("en-IN")
    : new Date().toLocaleString("en-IN");

const handlePrint = () => {
  const content = document.getElementById("bill-print-content").innerHTML;
  const win = window.open("", "_blank", "width=400,height=600");
  win.document.write(`
    <html>
      <head>
        <title>Bill - ${invoice_number}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 11px; margin: 0; padding: 10px; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
    </html>
  `);
  win.document.close();
};

  useEffect(() => {
    document.title = `Bill - ${invoice_number}`;
    return () => { document.title = "MedBill"; };
  }, [invoice_number]);

  return (
    <>
      {/* Screen overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Action bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white">
            <h3 className="font-semibold text-sm">Bill Preview — {invoice_number}</h3>
            <div className="flex gap-2">
              <button onClick={handlePrint}
                className="px-4 py-1.5 bg-white text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors">
                🖨️ Print
              </button>
              <button onClick={onClose}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 rounded-lg text-sm transition-colors">
                ✕ Close
              </button>
            </div>
          </div>

          {/* Bill preview */}
          <div className="p-5 font-mono text-xs text-gray-800 max-h-[80vh] overflow-y-auto">
            <div id="bill-print-content">
              <BillContent
                invoice_number={invoice_number}
                customerName={customerName}
                cart={cart}
                grandTotal={grandTotal}
                gstTotal={gstTotal}
                paymentMethod={paymentMethod}
                discount={discount}
                subtotal={subtotal}
                discountPercent={discountPercent}
                printDate={printDate}
                cashierName={cashierName}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const BillContent = ({
  invoice_number, customerName, cart, grandTotal,
  gstTotal, paymentMethod, discount, subtotal,
  discountPercent, printDate, cashierName
}) => (
  <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "#111", width: "100%", maxWidth: "300px", margin: "0 auto" }}>

    {/* Header */}
    <div style={{ textAlign: "center", borderBottom: "2px dashed #333", paddingBottom: "8px", marginBottom: "8px" }}>
      <div style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "1px" }}>🏥 SHREE DURGA</div>
      <div style={{ fontSize: "14px", fontWeight: "bold" }}>PHARMACY</div>
      <div style={{ fontSize: "9px", marginTop: "2px", color: "#444" }}>Medical Store & Healthcare</div>
      <div style={{ fontSize: "9px", color: "#444" }}>Ph: +91-9433638423</div>
      <div style={{ fontSize: "9px", color: "#444" }}>GSTIN: XXXXXXXXXXXX</div>
    </div>

    {/* Invoice meta */}
    <div style={{ borderBottom: "1px dashed #aaa", paddingBottom: "6px", marginBottom: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#555" }}>Invoice#</span>
        <span style={{ fontWeight: "bold" }}>{invoice_number}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#555" }}>Date</span>
        <span>{printDate}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#555" }}>Customer</span>
        <span style={{ fontWeight: "bold" }}>{customerName || "Walk-in"}</span>
      </div>
      {cashierName && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#555" }}>Cashier</span>
          <span>{cashierName}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#555" }}>Payment</span>
        <span style={{ textTransform: "uppercase", fontWeight: "bold" }}>{paymentMethod}</span>
      </div>
    </div>

    {/* Column headers */}
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #333", paddingBottom: "3px", marginBottom: "4px", fontSize: "10px", color: "#555" }}>
      <span style={{ flex: 3 }}>ITEM</span>
      <span style={{ flex: 1, textAlign: "center" }}>QTY</span>
      <span style={{ flex: 1.5, textAlign: "right" }}>RATE</span>
      <span style={{ flex: 1.5, textAlign: "right" }}>AMT</span>
    </div>

    {/* Items */}
    {(cart || []).map((item, i) => {
      const itemGst = (item.total * item.gst_percentage) / (100 + item.gst_percentage);
      const itemBase = item.total - itemGst;
      return (
        <div key={i} style={{ marginBottom: "5px", borderBottom: "1px dotted #ddd", paddingBottom: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ flex: 3, fontWeight: "bold", fontSize: "10px" }}>
              {item.medicine_name.length > 16
                ? item.medicine_name.substring(0, 16) + "…"
                : item.medicine_name}
            </span>
            <span style={{ flex: 1, textAlign: "center" }}>{item.quantity}</span>
            <span style={{ flex: 1.5, textAlign: "right" }}>₹{item.unit_price}</span>
            <span style={{ flex: 1.5, textAlign: "right", fontWeight: "bold" }}>₹{item.total.toFixed(2)}</span>
          </div>
          <div style={{ color: "#666", fontSize: "9px", paddingLeft: "2px" }}>
            Base: ₹{itemBase.toFixed(2)} + GST({item.gst_percentage}%): ₹{itemGst.toFixed(2)}
          </div>
        </div>
      );
    })}

    {/* Totals */}
    <div style={{ borderTop: "1px dashed #aaa", marginTop: "4px", paddingTop: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
        <span style={{ color: "#555" }}>Subtotal</span>
        <span>₹{(subtotal || grandTotal + discount).toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
        <span style={{ color: "#555" }}>GST (incl.)</span>
        <span>₹{(gstTotal || 0).toFixed(2)}</span>
      </div>
      {discount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px", color: "#16a34a" }}>
          <span>Discount ({discountPercent}%)</span>
          <span>- ₹{Number(discount).toFixed(2)}</span>
        </div>
      )}
      <div style={{
        display: "flex", justifyContent: "space-between",
        borderTop: "2px solid #333", marginTop: "4px", paddingTop: "4px",
        fontSize: "13px", fontWeight: "bold"
      }}>
        <span>TOTAL</span>
        <span>₹{Number(grandTotal).toFixed(2)}</span>
      </div>
    </div>

    {/* Savings callout */}
    {discount > 0 && (
      <div style={{
        margin: "8px 0", padding: "5px 8px",
        border: "1px dashed #16a34a", borderRadius: "4px",
        backgroundColor: "#f0fdf4", textAlign: "center"
      }}>
        <div style={{ color: "#16a34a", fontWeight: "bold", fontSize: "10px" }}>
          🎉 You saved ₹{Number(discount).toFixed(2)} ({discountPercent}% discount)
        </div>
      </div>
    )}

    {/* Items count summary */}
    <div style={{ textAlign: "center", fontSize: "9px", color: "#666", margin: "4px 0" }}>
      {(cart || []).length} item(s) · {(cart || []).reduce((s, i) => s + i.quantity, 0)} unit(s) total
    </div>

    {/* Footer */}
    <div style={{ borderTop: "2px dashed #333", marginTop: "8px", paddingTop: "8px", textAlign: "center" }}>
      <div style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "3px" }}>
        Thank you for your purchase!
      </div>
      <div style={{ fontSize: "9px", color: "#555" }}>
        Get well soon 💊
      </div>
      <div style={{ fontSize: "9px", color: "#888", marginTop: "4px" }}>
        * Medicines once sold will not be taken back *
      </div>
      <div style={{ fontSize: "9px", color: "#888" }}>
        * Check expiry before use *
      </div>
    </div>
  </div>
);

export default PrintBill;