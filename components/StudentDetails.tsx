
import React, { useState } from 'react';
import { Student, PaymentMode, PaymentRecord } from '../types';
import { CreditCard, History, Phone, Calendar, IndianRupee, X, Check, ArrowRight, Trash2, Edit3, Download, FileText, MessageCircle, Loader2, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface StudentDetailsProps {
  student: Student;
  onEdit: () => void;
  onPayment: (payment: Omit<PaymentRecord, 'id'>) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ student, onEdit, onPayment, onClose, onDelete, isSaving = false }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [pendingPaymentMode, setPendingPaymentMode] = useState<PaymentMode | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const overdue = (student && student.nextDueDate) ? new Date(student.nextDueDate) < new Date() : false;

  const handlePay = (mode: PaymentMode) => {
    setPendingPaymentMode(mode);
  };

  const confirmPayment = () => {
    if (pendingPaymentMode && student) {
      onPayment({
        amount: student.monthlyFee || 0,
        date: new Date().toISOString(),
        mode: pendingPaymentMode,
        forMonth: student.nextDueDate ? new Date(student.nextDueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
      });
      setPendingPaymentMode(null);
    }
  };

  const handleDelete = () => {
    if (isConfirmingDelete && student) {
      onDelete(student.id);
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const sendWhatsAppReminder = () => {
    if (!student) return;
    const hasDueDate = student.nextDueDate && typeof student.nextDueDate === 'string';
    const formattedDate = hasDueDate ? new Date(student.nextDueDate).toLocaleDateString('en-GB') : '';
    const message = `Hi ${student.name || 'Student'}, this is a reminder from *SHRI VENKATESH LIBRARY* regarding your subscription for *Table #${student.tableNumber || ''}*. Your monthly fee of *₹${student.monthlyFee || 0}* was due on *${formattedDate}*. Please clear the dues soon.

Payment Details:
•  UPI No.: 9325121145
•  *QR Code Link*: https://drive.google.com/file/d/1qFzh2WSyKtt26SL9rJ_NH8I9yrakiRL-/view?usp=drivesdk

For any assistance or payment-related queries, feel free to contact us anytime.

Thank you for being a valued member of *SHRI VENKATESH LIBRARY*.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${(student.mobile || '').replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendWhatsAppWelcome = () => {
    if (!student) return;
    const hasJoiningDate = student.joiningDate && typeof student.joiningDate === 'string';
    const hasDueDate = student.nextDueDate && typeof student.nextDueDate === 'string';
    const formattedJoining = hasJoiningDate ? new Date(student.joiningDate).toLocaleDateString('en-GB') : '';
    const formattedDue = hasDueDate ? new Date(student.nextDueDate).toLocaleDateString('en-GB') : '';
    const message = `Dear *${student.name || 'Student'}*,

*Welcome to SHRI VENKATESH LIBRARY!* 📚✨

We are delighted to welcome you to our peaceful and disciplined study lab. Here are your enrollment details:

•  *Table Assigned*: Table #${student.tableNumber || ''}
•  *Monthly Subscription*: ₹${student.monthlyFee || 0}
•  *Admission Date*: ${formattedJoining}
•  *Next Fee Due Date*: ${formattedDue}

*Important Rules & Policies:*
1. Please maintain absolute silence inside the study cabin.
2. Ensure you occupy only your assigned Table #${student.tableNumber || ''}.
3. Fees must be deposited before or on the due date (*${formattedDue}*).

*Payment Address details for future references:*
•  UPI ID / Mobile: 9325121145
•  *QR Code Link for direct scan*: https://drive.google.com/file/d/1qFzh2WSyKtt26SL9rJ_NH8I9yrakiRL-/view?usp=drivesdk

If you need any technical assistance or seat adjustments, our help desk is always ready to support you.

Happy studying! Let's work hard together to achieve your academic/career goals! 🎯🎓

Best regards,
*SHRI VENKATESH LIBRARY*
📞 Helpdesk: 7972055505`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/91${(student.mobile || '').replace(/\D/g, '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const downloadReceipt = (record: PaymentRecord) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    const primaryColor = '#2563eb';
    const secondaryColor = '#64748b';

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 148, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SHRI VENKATESH LIBRARY', 10, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PAYMENT RECEIPT', 10, 22);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`Receipt ID: ${record.id.slice(0, 8).toUpperCase()}`, 110, 15, { align: 'right' });
    doc.text(`Date: ${new Date(record.date).toLocaleDateString()}`, 110, 20, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Details', 10, 45);

    doc.setDrawColor(226, 232, 240);
    doc.line(10, 47, 138, 47);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text('Name:', 10, 55);
    doc.text('Table No:', 10, 62);
    doc.text('Mobile:', 10, 69);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(student?.name || '', 40, 55);
    doc.text(`#${student?.tableNumber || ''}`, 40, 62);
    doc.text(student?.mobile || '', 40, 69);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Transaction Details', 10, 85);
    doc.line(10, 87, 138, 87);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    doc.text('Payment Mode:', 10, 95);
    doc.text('For Period:', 10, 102);
    doc.text('Status:', 10, 109);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(record.mode, 40, 95);
    doc.text(record.forMonth, 40, 102);
    doc.setTextColor(22, 163, 74);
    doc.text('SUCCESSFUL', 40, 109);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(10, 120, 128, 20, 3, 3, 'F');
    doc.setTextColor(primaryColor);
    doc.setFontSize(14);
    doc.text(`Total Amount Paid:  INR ${record.amount}`, 74, 132, { align: 'center' });

    doc.setTextColor(secondaryColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer-generated receipt.', 74, 155, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('SHRI VENKATESH LIBRARY - Developed by Atheron Labs', 74, 160, { align: 'center' });

    doc.save(`Receipt_${(student?.name || 'Student').replace(/\s+/g, '_')}_${(record?.id || '').slice(0, 4)}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex items-end">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center text-3xl font-bold text-blue-600 shadow-xl border-4 border-white">
              {(student?.name || 'S').charAt(0)}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{student?.name || ''}</h2>
              <p className="opacity-80 flex items-center gap-1">
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest">
                  Table #{student?.tableNumber || ''}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contact & Enrollment</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-xs">{student.mobile}</span>
                    </div>
                    <a 
                      href={`tel:${student.mobile}`}
                      className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl transition-transform active:scale-95 shadow-xs"
                    >
                      <Phone className="w-3 h-3 fill-white" /> Call Student
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 pl-3">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium">Joined: {new Date(student.joiningDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Fee Configuration</h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500">Monthly Commitment</span>
                    <span className="text-lg font-bold text-slate-800">₹{student.monthlyFee}</span>
                  </div>
                      <div className="flex gap-4 mt-2">
                        <button 
                          onClick={onEdit}
                          className="flex items-center gap-2 text-sm text-blue-600 font-bold hover:underline"
                        >
                          <Edit3 className="w-4 h-4" /> Edit Profile
                        </button>
                        <button 
                          onClick={handleDelete}
                          disabled={isSaving}
                          className={`flex items-center gap-2 text-sm font-bold hover:underline transition-all ${isConfirmingDelete ? 'text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200' : 'text-rose-600'}`}
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isConfirmingDelete ? (
                            <>Confirm Delete?</>
                          ) : (
                            <><Trash2 className="w-4 h-4" /> Delete Student</>
                          )}
                        </button>
                        {isConfirmingDelete && !isSaving && (
                          <button 
                            onClick={() => setIsConfirmingDelete(false)}
                            className="text-xs text-slate-400 font-bold hover:text-slate-600"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Status</h3>
                <div className={`p-6 rounded-2xl border-2 ${overdue ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className={`text-xs font-bold uppercase ${overdue ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {overdue ? 'Action Required' : 'Up to date'}
                      </p>
                      <p className="text-2xl font-black text-slate-800">
                        {overdue ? 'Overdue' : 'Healthy'}
                      </p>
                    </div>
                    <CreditCard className={`w-8 h-8 ${overdue ? 'text-rose-400' : 'text-emerald-400'}`} />
                  </div>
                  
                  <div className="space-y-1 mb-6">
                    <p className="text-sm text-slate-500">Next Due Date</p>
                    <p className="font-bold text-slate-700">{new Date(student.nextDueDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>

                  {overdue && (
                    <div className="flex flex-col gap-4">
                      {pendingPaymentMode ? (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 animate-in zoom-in-95 duration-200">
                          <p className="text-sm font-bold text-slate-800 mb-3 text-center">
                            Confirm ₹{student.monthlyFee} payment via {pendingPaymentMode}?
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setPendingPaymentMode(null)}
                              className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={confirmPayment}
                              disabled={isSaving}
                              className="py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={sendWhatsAppReminder}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs sm:text-sm active:scale-95"
                              title="Send Fee Reminder via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4 shrink-0" /> Fee Reminder
                            </button>
                            <button 
                              onClick={sendWhatsAppWelcome}
                              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs sm:text-sm active:scale-95"
                              title="Send Welcome Greetings via WhatsApp"
                            >
                              <Sparkles className="w-4 h-4 shrink-0" /> Send Welcome
                            </button>
                          </div>
                          <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold text-slate-400 mb-1 uppercase text-center">Record Payment</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => handlePay('Cash')}
                                disabled={isSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />} Cash
                              </button>
                              <button 
                                onClick={() => handlePay('Online')}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Online
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-slate-400" />
                  <span className="font-semibold text-slate-700">Payment History</span>
                </div>
                <ArrowRight className={`w-5 h-5 text-slate-300 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="mt-8 border-t pt-8 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Past Transactions</h3>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500 uppercase tracking-tighter">PDF Supported</span>
              </div>
              {(student.paymentHistory || []).length === 0 ? (
                <p className="text-center py-8 text-slate-400 italic">No payments recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {(student.paymentHistory || []).slice().reverse().map((record, rIdx) => (
                    <div key={`${record.id || 'payment'}-${rIdx}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">₹{record.amount}</p>
                          <p className="text-xs text-slate-500">{new Date(record.date).toLocaleDateString()} • {record.mode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Period</p>
                          <p className="text-sm font-semibold text-slate-700">{record.forMonth}</p>
                        </div>
                        <button 
                          onClick={() => downloadReceipt(record)}
                          className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                          title="Download Receipt PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
