export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-[#8E8E93] mb-8">Last updated: February 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Information We Collect
            </h2>
            <p className="text-[#8E8E93] leading-relaxed mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-[#8E8E93] space-y-2">
              <li>Account information (name, email)</li>
              <li>Running profile (experience, goals, schedule)</li>
              <li>Health context (injury history, sleep, stress levels)</li>
              <li>Connected device data (Strava, wearables)</li>
              <li>Coaching preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              How We Use Your Information
            </h2>
            <p className="text-[#8E8E93] leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-[#8E8E93] space-y-2">
              <li>Generate personalized training plans</li>
              <li>Provide AI-powered coaching recommendations</li>
              <li>Track your progress and adapt your plan</li>
              <li>Improve our algorithms and services</li>
              <li>Communicate with you about your training</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Data Storage & Security
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              Your data is stored securely using industry-standard encryption.
              All data is encrypted in transit (TLS 1.2+) and at rest. OAuth
              tokens are stored securely, and sensitive health data is never
              logged in plain text.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Data Sharing
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              We do not sell your personal data. We may share data with AI
              services (such as OpenAI) to generate training plans, which
              requires processing your profile data. We do not share your data
              with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Data Retention
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              Your data is retained while you have an active account. You can
              request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Your Rights (GDPR)
            </h2>
            <p className="text-[#8E8E93] leading-relaxed mb-4">
              If you are in the European Union, you have the right to:
            </p>
            <ul className="list-disc list-inside text-[#8E8E93] space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your data
              </li>
              <li>
                <strong>Rectification:</strong> Correct inaccurate data
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion of your data
              </li>
              <li>
                <strong>Portability:</strong> Export your data in a portable
                format
              </li>
              <li>
                <strong>Object:</strong> Object to certain processing of your
                data
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Your Rights (CCPA)
            </h2>
            <p className="text-[#8E8E93] leading-relaxed mb-4">
              If you are a California resident, you have the right to:
            </p>
            <ul className="list-disc list-inside text-[#8E8E93] space-y-2">
              <li>
                <strong>Right to Know:</strong> What data we collect and why
              </li>
              <li>
                <strong>Right to Delete:</strong> Request deletion of your data
              </li>
              <li>
                <strong>Right to Opt-Out:</strong> We do not sell personal
                information
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Cookies</h2>
            <p className="text-[#8E8E93] leading-relaxed">
              We use essential cookies to maintain your session and preferences.
              We do not use third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of significant changes by email or through the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Contact Us
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              For data-related requests or questions about this policy, contact
              us at:{" "}
              <a
                href="mailto:privacy@cadence.nativesquare.fr"
                className="text-[#D4FF3A] hover:underline"
              >
                privacy@cadence.nativesquare.fr
              </a>
            </p>
          </section>
        </div>
    </div>
  );
}
