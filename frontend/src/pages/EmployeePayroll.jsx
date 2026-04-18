import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import html2pdf from "html2pdf.js";

export default function EmployeePayroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);

  const slipRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/payroll/my");
      setPayrolls(res.data);
    } catch (error) {
      console.error("Error fetching payslips:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = slipRef.current;
    if (!element) return;

    const pdfStyles = `
      * { color-scheme: light !important; }
      .text-indigo-600 { color: #4f46e5 !important; }
      .text-gray-900 { color: #111827 !important; }
      .bg-indigo-600 { background-color: #4f46e5 !important; }
      .border-indigo-500 { border-color: #6366f1 !important; }
    `;

    const opt = {
      margin: 0.5,
      filename: `Payslip_${selectedSlip.month}_${selectedSlip.year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        onclone: (clonedDoc) => {
          // 1. Remove all existing external/Tailwind stylesheets to prevent html2canvas parsing oklch variables
          const externalStyles = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
          externalStyles.forEach(s => s.remove());

          // 2. Inject our safe, standardized PDF-only styles
          const style = clonedDoc.createElement('style');
          style.innerHTML = pdfStyles;
          clonedDoc.head.appendChild(style);
          
          // 3. Rip out any inline 'oklch' and 'color-mix' usages dynamically
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
             const el = allElements[i];
             const inlineStyle = el.getAttribute('style');
             if (inlineStyle && (inlineStyle.includes('oklch') || inlineStyle.includes('color-mix'))) {
               el.setAttribute(
                 'style',
                 inlineStyle
                   .replace(/oklch\([^)]+\)/g, '#6366f1')
                   .replace(/color-mix\([^)]+\)/g, '#6366f1')
               );
             }
          }
        }
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
        <p className="text-sm text-gray-500">View and download your monthly salary statements.</p>
      </div>

      {loading ? (
        <p>Loading payslips...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payrolls.length === 0 ? (
            <p className="p-6 bg-white rounded shadow-sm text-gray-500">No payslips generated yet.</p>
          ) : (
            payrolls.map(p => (
              <div key={p._id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition hover:shadow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-xl text-gray-900">{new Date(2000, p.month - 1, 1).toLocaleString('default', { month: 'long' })} {p.year}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">Net Pay: <span className="text-gray-900 font-bold">₹{p.netSalary?.toLocaleString()}</span></p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded ${p.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {p.status}
                  </span>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedSlip(p)}
                    className="w-full py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition"
                  >
                    View Breakdown
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Slip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] relative">
            <button onClick={() => setSelectedSlip(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10 p-2">✕</button>

            <div className="overflow-y-auto p-8" ref={slipRef}>
              <div className="text-center mb-8 border-b pb-6">
                <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">PAYSLIP</h2>
                <p className="text-gray-500 font-medium text-lg mt-1">{new Date(2000, selectedSlip.month - 1, 1).toLocaleString('default', { month: 'long' })} {selectedSlip.year}</p>
              </div>

              <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Employee Info</p>
                  <p className="font-bold text-gray-900 text-lg">{selectedSlip.employeeId?.name || "N/A"}</p>
                  <p className="text-gray-700 mt-1">{selectedSlip.employeeId?.email}</p>
                  <p className="text-gray-700">{selectedSlip.employeeId?.designation}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 mb-1">Attendance Info</p>
                  <p className="font-semibold text-gray-900 mt-1">Working Days: {selectedSlip.workingDays}</p>
                  <p className="font-semibold text-gray-900">Present Days: {selectedSlip.presentDays}</p>
                  <p className="font-semibold text-red-600">LWP Days: {selectedSlip.LWP_days}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Earnings */}
                <div>
                  <h3 className="font-bold text-gray-900 border-b-2 border-indigo-500 pb-2 mb-3 uppercase tracking-wider text-xs">Earnings</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Basic</span><span className="font-semibold text-gray-900">₹{selectedSlip.basic?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">HRA</span><span className="font-semibold text-gray-900">₹{selectedSlip.hra?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Allowances</span><span className="font-semibold text-gray-900">₹{selectedSlip.allowances?.toLocaleString()}</span></div>
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-900 text-lg">Gross Earnings</span>
                    <span className="font-bold text-green-600 text-lg">₹{selectedSlip.grossSalary?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="font-bold text-gray-900 border-b-2 border-red-500 pb-2 mb-3 uppercase tracking-wider text-xs">Deductions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Tax</span><span className="font-semibold text-gray-900">₹{selectedSlip.tax?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">PF</span><span className="font-semibold text-gray-900">₹{selectedSlip.pf?.toLocaleString()}</span></div>
                    {selectedSlip.LWP_deduction > 0 && (
                      <div className="flex justify-between"><span className="text-red-500 font-medium">LWP Deduction</span><span className="font-semibold text-red-600">₹{selectedSlip.LWP_deduction?.toLocaleString()}</span></div>
                    )}
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-900 text-lg">Total Deductions</span>
                    <span className="font-bold text-red-600 text-lg">₹{selectedSlip.totalDeductions?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl flex justify-between items-center mt-8">
                <div>
                  <p className="font-bold text-gray-500 uppercase tracking-wider text-sm mb-1">Net Salary Payable</p>
                  <p className="text-xs text-gray-400">Total Earnings minus Total Deductions</p>
                </div>
                <p className="text-4xl font-black text-indigo-600">₹{selectedSlip.netSalary?.toLocaleString()}</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 mt-auto">
              <button onClick={handleDownloadPDF} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-bold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
