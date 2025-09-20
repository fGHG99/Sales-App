import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registration
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Terms & Conditions</h1>
          </div>
          
          <p className="text-gray-600 text-lg">Last updated: January 2025</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. User Account</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              When you create an account with us, you must provide information that is accurate, complete, and current at all times.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>You are responsible for safeguarding the password</li>
              <li>You must not share your account with others</li>
              <li>You must notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              Your privacy is important to us. We collect and use your information in accordance with our Privacy Policy, 
              which is incorporated by reference into these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You agree not to use the platform for any unlawful purpose or in any way that might harm, damage, 
              or disparage any other party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice or liability, 
              for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms & Conditions, please contact us at support@platform.com
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/register"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            I Agree - Continue Registration
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}