import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, AlertCircle, Phone, Trash2, Plus } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relation: string;
}

export function EmergencyContacts() {
  const navigate = useNavigate();
  const toast = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', relation: '' });

  useEffect(() => {
    const saved = localStorage.getItem('emergencyContacts');
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  }, []);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in all fields');
      return;
    }

    const newContact: EmergencyContact = {
      id: Date.now(),
      ...formData,
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    localStorage.setItem('emergencyContacts', JSON.stringify(updated));
    setFormData({ name: '', phone: '', relation: '' });
    setShowAddForm(false);
    toast.success('Emergency contact added');
  };

  const handleDeleteContact = (id: number) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    localStorage.setItem('emergencyContacts', JSON.stringify(updated));
    toast.success('Contact removed');
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
        <h1 className="text-xl font-bold text-gray-800">Emergency Contacts</h1>
      </div>

      <div className="flex-1 p-4">
        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900 mb-1">Quick Access in Emergencies</p>
            <p className="text-xs text-red-800">Add trusted contacts who can be quickly notified if an emergency is triggered.</p>
          </div>
        </div>

        {/* Add Contact Form */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center mb-6 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Emergency Contact
          </button>
        ) : (
          <form onSubmit={handleAddContact} className="bg-white rounded-2xl p-4 border border-gray-200 mb-6">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+94..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Relation</label>
                <input
                  type="text"
                  value={formData.relation}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                  placeholder="e.g., Mother, Brother, Friend"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Add Contact
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ name: '', phone: '', relation: '' });
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Contacts List */}
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">No emergency contacts yet</p>
              <p className="text-sm text-gray-500">Add at least one contact for quick access in emergencies</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <Phone className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{contact.name}</div>
                    <div className="text-xs text-gray-500">{contact.relation}</div>
                    <div className="text-xs text-blue-600 font-medium">{contact.phone}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
