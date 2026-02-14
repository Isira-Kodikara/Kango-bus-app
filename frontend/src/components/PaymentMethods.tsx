import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CreditCard, Trash2, Plus, Lock } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface PaymentMethod {
  id: number;
  type: 'card' | 'wallet';
  name: string;
  lastFour: string;
  expiry?: string;
  balance?: string;
}

export function PaymentMethods() {
  const navigate = useNavigate();
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('paymentMethods');
    if (saved) {
      setMethods(JSON.parse(saved));
    } else {
      // Demo data
      setMethods([
        {
          id: 1,
          type: 'card',
          name: 'Visa',
          lastFour: '4242',
          expiry: '12/25',
        },
      ]);
    }
  }, []);

  const handleDeleteMethod = (id: number) => {
    const updated = methods.filter(m => m.id !== id);
    setMethods(updated);
    localStorage.setItem('paymentMethods', JSON.stringify(updated));
    toast.success('Payment method removed');
  };

  const handleAddCard = () => {
    // Validate inputs
    if (!cardNumber.trim()) {
      toast.error('Card number is required');
      return;
    }
    if (!expiry.trim()) {
      toast.error('Expiry date is required');
      return;
    }
    if (!cvv.trim()) {
      toast.error('CVV is required');
      return;
    }

    // Extract last 4 digits from card number
    const lastFour = cardNumber.slice(-4);
    const cardName = 'Visa'; // Default name, could be detected from card number

    // Create new payment method
    const newMethod: PaymentMethod = {
      id: Date.now(),
      type: 'card',
      name: cardName,
      lastFour: lastFour,
      expiry: expiry,
    };

    // Add to methods and save
    const updated = [...methods, newMethod];
    setMethods(updated);
    localStorage.setItem('paymentMethods', JSON.stringify(updated));
    
    // Clear form and close
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setShowAddForm(false);
    toast.success('Card added successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full mr-3"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Payment Methods</h1>
      </div>

      <div className="flex-1 p-4">
        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-start">
          <Lock className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-900 mb-1">Secure Payments</p>
            <p className="text-xs text-green-800">All payment information is encrypted and secure.</p>
          </div>
        </div>

        {/* Add Payment Method Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center mb-6 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Payment Method
          </button>
        )}

        {/* Add Card Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Add Card</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">MM/YY</label>
                  <input
                    type="text"
                    placeholder="12/25"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddCard}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Add Card
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Payment Methods List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Saved Methods</h3>
          {methods.map((method) => (
            <div key={method.id} className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{method.name} •••• {method.lastFour}</div>
                  {method.expiry && <div className="text-xs text-gray-500">Expires {method.expiry}</div>}
                  {method.balance && <div className="text-xs text-green-600 font-medium">Balance: {method.balance}</div>}
                </div>
              </div>
              <button
                onClick={() => handleDeleteMethod(method.id)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
