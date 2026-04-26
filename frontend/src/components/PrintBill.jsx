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
    const itemsHTML = (cart || []).map(item => {
      const itemGst = (item.total * item.gst_percentage) / (100 + item.gst_percentage);
      const itemBase = item.total - itemGst;
      return `
        <div style="margin-bottom:5px;border-bottom:1px dotted #ddd;padding-bottom:4px">
          <div style="display:flex;justify-content:space-between">
            <span style="flex:3;font-weight:bold;font-size:10px">${item.medicine_name.length > 16 ? item.medicine_name.substring(0,16)+"…" : item.medicine_name}</span>
            <span style="flex:1;text-align:center">${item.quantity}</span>
            <span style="flex:1.5;text-align:right">Rs.${item.unit_price}</span>
            <span style="flex:1.5;text-align:right;font-weight:bold">Rs.${item.total.toFixed(2)}</span>
          </div>
          <div style="color:#666;font-size:9px">Base: Rs.${itemBase.toFixed(2)} + GST(${item.gst_percentage}%): Rs.${itemGst.toFixed(2)}</div>
        </div>`;
    }).join("");

    const billHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Bill ${invoice_number}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;font-size:11px;color:#111;padding:10px;width:300px}
  </style>
</head>
<body>
  <div style="text-align:center;border-bottom:2px dashed #333;padding-bottom:8px;margin-bottom:8px">
    <div style="font-size:16px;font-weight:bold">SHREE DURGA</div>
    <div style="font-size:14px;font-weight:bold">PHARMACY</div>
    <div style="font-size:9px;color:#444">Medical Store &amp; Healthcare</div>
    <div style="font-size:9px;color:#444">Ph: +91-9433638423</div>
    <div style="font-size:9px;color:#444">GSTIN: XXXXXXXXXXXX</div>
  </div>
  <div style="border-bottom:1px dashed #aaa;padding-bottom:6px;margin-bottom:6px">
    <div style="display:flex;justify-content:space-between"><span>Invoice#</span><span style="font-weight:bold">${invoice_number}</span></div>
    <div style="display:flex;justify-content:space-between"><span>Date</span><span>${printDate}</span></div>
    <div style="display:flex;justify-content:space-between"><span>Customer</span><span style="font-weight:bold">${customerName || "Walk-in"}</span></div>
    <div style="display:flex;justify-content:space-between"><span>Payment</span><span style="font-weight:bold;text-transform:uppercase">${paymentMethod}</span></div>
  </div>
  <div style="display:flex;justify-content:space-between;border-bottom:1px solid #333;padding-bottom:3px;margin-bottom:4px;font-size:10px;color:#555">
    <span style="flex:3">ITEM</span>
    <span style="flex:1;text-align:center">QTY</span>
    <span style="flex:1.5;text-align:right">RATE</span>
    <span style="flex:1.5;text-align:right">AMT</span>
  </div>
  ${itemsHTML}
  <div style="border-top:1px dashed #aaa;margin-top:4px;padding-top:6px">
    <div style="display:flex;justify-content:space-between;margin-bottom:2px"><span>Subtotal</span><span>Rs.${(subtotal || grandTotal + discount).toFixed(2)}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:2px"><span>GST (incl.)</span><span>Rs.${(gstTotal||0).toFixed(2)}</span></div>
    ${discount > 0 ? `<div style="display:flex;justify-content:space-between;color:#16a34a"><span>Discount</span><span>-Rs.${Number(discount).toFixed(2)}</span></div>` : ""}
    <div style="display:flex;justify-content:space-between;border-top:2px solid #333;margin-top:4px;padding-top:4px;font-size:13px;font-weight:bold"><span>TOTAL</span><span>Rs.${Number(grandTotal).toFixed(2)}</span></div>
  </div>
  <div style="border-top:2px dashed #333;margin-top:8px;padding-top:8px;text-align:center">
    <div style="font-size:10px;font-weight:bold">Thank you for your purchase!</div>
    <div style="font-size:9px;color:#555">Get well soon</div>
    <div style="font-size:9px;color:#888;margin-top:4px">* Medicines once sold will not be taken back *</div>
  </div>
  <script>window.onload=function(){window.print();}<\/script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=350,height=600");
    if (win) {
      win.document.open();
      win.document.write(billHTML);
      win.document.close();
    } else {
      alert("Please allow popups to print bills! Click the popup blocked icon in your browser address bar.");
    }
  };

  useEffect(() => {
    document.title = `Bill - ${invoice_number}`;
    return () => { document.title = "MedBill"; };
  }, [invoice_number]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white">
          <h3 className="font-semibold text-sm">Bill Preview — {invoice_number}</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="px-4 py-1.5 bg-white text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors">
              Print
            </button>
            <button onClick={onClose}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 rounded-lg text-sm transition-colors">
              X Close
            </button>
          </div>
        </div>
        <div className="p-5 font-mono text-xs text-gray-800 max-h-[80vh] overflow-y-auto">
          <div style={{fontFamily:"'Courier New',monospace",fontSize:"11px",color:"#111",maxWidth:"300px",margin:"0 auto"}}>
            <div style={{textAlign:"center",borderBottom:"2px dashed #333",paddingBottom:"8px",marginBottom:"8px"}}>
              <div style={{fontSize:"16px",fontWeight:"bold"}}>SHREE DURGA</div>
              <div style={{fontSize:"14px",fontWeight:"bold"}}>PHARMACY</div>
              <div style={{fontSize:"9px",color:"#444"}}>Ph: +91-9433638423</div>
            </div>
            <div style={{borderBottom:"1px dashed #aaa",paddingBottom:"6px",marginBottom:"6px"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>Invoice#</span><span style={{fontWeight:"bold"}}>{invoice_number}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>Customer</span><span>{customerName||"Walk-in"}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>Payment</span><span style={{textTransform:"uppercase"}}>{paymentMethod}</span></div>
            </div>
            {(cart||[]).map((item,i)=>(
              <div key={i} style={{marginBottom:"4px",borderBottom:"1px dotted #ddd",paddingBottom:"3px"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{flex:3,fontWeight:"bold",fontSize:"10px"}}>{item.medicine_name}</span>
                  <span style={{flex:1,textAlign:"center"}}>{item.quantity}</span>
                  <span style={{flex:1.5,textAlign:"right",fontWeight:"bold"}}>Rs.{item.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
            <div style={{borderTop:"1px dashed #aaa",marginTop:"4px",paddingTop:"6px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:"bold",fontSize:"13px",borderTop:"2px solid #333",paddingTop:"4px"}}><span>TOTAL</span><span>Rs.{Number(grandTotal).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintBill;