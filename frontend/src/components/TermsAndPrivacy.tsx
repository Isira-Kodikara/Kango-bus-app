import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export function TermsAndPrivacy() {
  const navigate = useNavigate();

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
        <h1 className="text-xl font-bold text-gray-800">Terms & Privacy</h1>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Terms of Service */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Terms of Service</h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h3>
                <p>
                  By using KANGO, you agree to these terms and conditions. If you do not agree, please do not use our service.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2. User Responsibilities</h3>
                <p>
                  You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3. Service Limitations</h3>
                <p>
                  KANGO provides real-time bus tracking and route planning services. While we strive for accuracy, we do not guarantee that the information is always accurate or up-to-date.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4. Limitation of Liability</h3>
                <p>
                  KANGO shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">5. Changes to Terms</h3>
                <p>
                  We reserve the right to modify these terms at any time. Your continued use of KANGO following the posting of revised terms means that you accept and agree to the changes.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Privacy Policy</h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Information We Collect</h3>
                <p>
                  We collect information you provide directly (name, email, phone) and information collected automatically (location, device info, usage data).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">How We Use Your Information</h3>
                <p>
                  We use your information to provide, improve, and personalize our service, process transactions, and communicate with you about updates and offers.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Data Security</h3>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access and alteration.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Sharing of Information</h3>
                <p>
                  We do not sell your personal information. We may share information with service providers who assist us in operating the app and conducting our business.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Your Rights</h3>
                <p>
                  You have the right to access, correct, or delete your personal information. Contact us at privacy@kango.app to exercise these rights.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Cookies and Tracking</h3>
                <p>
                  We use cookies and similar technologies to enhance your experience. You can control cookie settings through your device preferences.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Third-Party Links</h3>
                <p>
                  Our app may contain links to third-party websites. We are not responsible for the privacy practices of other websites. Please review their privacy policies.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Contact Us</h3>
                <p>
                  If you have questions about our privacy policy, please contact us at privacy@kango.app.
                </p>
              </div>
            </div>
          </div>

          {/* Version Info */}
          <div className="bg-gray-100 rounded-2xl p-4 text-center text-xs text-gray-600 mb-6">
            <p>KANGO Version 1.0</p>
            <p>© 2026 KANGO. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
