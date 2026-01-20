import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CreditCard, Banknote, CheckCircle, Smartphone } from 'lucide-react';
import api from '../../api/axiosClient';
import useToast from '../Common/Catalog/useToast';

export default function PayFineModal({ record, onClose, onSuccess }) {
  const { addToast } = useToast();
  const [method, setMethod] = useState('cash'); // 'cash' | 'upi'
  const [processing, setProcessing] = useState(false);

  // Generate UPI Intent Link
  // Format: upi://pay?pa=YOUR_VPA&pn=YOUR_NAME&am=AMOUNT&tn=NOTE
  // Replace 'library@upi' with actual VPA in real app or env
  const vpa = "amitrajvvs@okaxis"; 
  const name = "Athenaeum Library";
  const note = `Fine for ${record.bookTitle}`;
  const amount = record.fineAmount;
  const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;

  const handlePayment = async () => {
    setProcessing(true);
    try {
      await api.patch(`/borrowed/${record._id}/pay-fine`, {
        paymentMethod: method === 'cash' ? 'Cash' : 'UPI'
      });
      addToast('Fine marked as paid successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to process payment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 w-full max-w-md rounded-xl border border-gray-700 shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Complete Payment</h2>
          <p className="text-sm text-gray-400 mt-1">
            Book: <span className="text-cyan-400">{record.bookTitle}</span>
          </p>
          <div className="mt-4 flex items-center justify-between bg-red-900/20 border border-red-900/50 p-3 rounded-lg">
            <span className="text-red-200 font-medium">Total Due</span>
            <span className="text-2xl font-bold text-red-400">₹{record.fineAmount}</span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMethod('cash')}
              className={`flex-1 py-3 rounded-lg border flex flex-col items-center gap-2 transition ${
                method === 'cash' 
                  ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400' 
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
              }`}
            >
              <Banknote size={24} />
              <span className="font-bold text-sm">Cash</span>
            </button>
            <button
              onClick={() => setMethod('upi')}
              className={`flex-1 py-3 rounded-lg border flex flex-col items-center gap-2 transition ${
                method === 'upi' 
                  ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400' 
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
              }`}
            >
              <Smartphone size={24} />
              <span className="font-bold text-sm">UPI / QR</span>
            </button>
          </div>

          {method === 'cash' && (
            <div className="text-center py-4 bg-gray-800/50 rounded-lg mb-6">
              <p className="text-gray-300 mb-2">Please hand over cash to the librarian.</p>
              <p className="text-xs text-gray-500">Confirming here marks the fine as paid in the system.</p>
            </div>
          )}

          {method === 'upi' && (
            <div className="flex flex-col items-center mb-6">
              <div className="bg-white p-4 rounded-xl mb-4">
                <QRCodeSVG value={upiUrl} size={180} />
              </div>
              <p className="text-sm text-gray-300 text-center">
                Scan with GPay, PhonePe, or Paytm
              </p>
              <p className="text-xs text-yellow-500/80 mt-2 text-center">
                ⚠️ Ensure payment is successful before confirming.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition"
            >
              Cancel
            </button>
            <button 
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center justify-center gap-2"
            >
              {processing ? 'Processing...' : (
                <>
                  <CheckCircle size={18} />
                  Complete Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
