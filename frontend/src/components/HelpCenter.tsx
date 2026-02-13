import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronDown, Search, MessageSquare } from 'lucide-react';

const FAQs = [
  {
    id: 1,
    category: 'Getting Started',
    question: 'How do I book a bus trip?',
    answer: 'Enter your starting location and destination in the search bar, select your preferred bus, and follow the booking steps.',
  },
  {
    id: 2,
    category: 'Getting Started',
    question: 'How can I save my favorite places?',
    answer: 'Go to your profile, navigate to Saved Places, and add frequently visited locations for quick access.',
  },
  {
    id: 3,
    category: 'Payments',
    question: 'What payment methods are accepted?',
    answer: 'We accept credit cards, debit cards, and digital wallets. All payments are encrypted and secure.',
  },
  {
    id: 4,
    category: 'Safety',
    question: 'How do emergency contacts work?',
    answer: 'You can add trusted contacts who will be notified in case of an emergency alert during your trip.',
  },
  {
    id: 5,
    category: 'Trips',
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel up to 30 minutes before the bus arrives. Refunds are processed within 3-5 business days.',
  },
  {
    id: 6,
    category: 'Support',
    question: 'Who can I contact for support?',
    answer: 'You can reach our support team via email (support@kango.app) or through the in-app support chat.',
  },
];

export function HelpCenter() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = FAQs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(FAQs.map((faq) => faq.category)));

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
        <h1 className="text-xl font-bold text-gray-800">Help Center</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* FAQs */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 font-medium mb-4">No results found</p>
            <p className="text-sm text-gray-500">Try searching with different keywords</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => {
              const categoryFaqs = filtered.filter((faq) => faq.category === category);
              if (categoryFaqs.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-xs font-bold uppercase text-gray-600 px-2 mb-2">{category}</h3>
                  <div className="space-y-2">
                    {categoryFaqs.map((faq) => (
                      <button
                        key={faq.id}
                        onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                        className="w-full bg-white rounded-2xl p-4 border border-gray-200 hover:border-blue-300 transition-all text-left"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{faq.question}</p>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
                              expandedId === faq.id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>

                        {expandedId === faq.id && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">{faq.answer}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
          <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">Didn't find an answer?</h3>
          <p className="text-sm text-gray-600 mb-4">Contact our support team for immediate assistance</p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
