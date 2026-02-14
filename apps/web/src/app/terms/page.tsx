export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-4">Terms of Service</h1>
        <p className="text-[#8E8E93] mb-8">Last updated: February 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              By accessing or using Cadence, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do
              not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              2. Description of Service
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              Cadence provides personalized running coaching and training plan
              generation services. Our AI-powered coach analyzes your running
              data, goals, and preferences to create tailored training plans.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              3. User Accounts
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account. You agree to notify us immediately of any unauthorized
              use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              4. User Data
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              You retain ownership of all data you provide to Cadence. By using
              our service, you grant us a license to use this data to provide
              and improve our services. See our Privacy Policy for details on
              how we handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              5. Third-Party Integrations
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              Cadence may integrate with third-party services such as Strava,
              Garmin, and Apple Health. Your use of these integrations is
              subject to the terms of service of those third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              6. Wellness Disclaimer
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              Cadence provides fitness and wellness coaching. It is not a
              medical device and does not provide medical advice, diagnosis, or
              treatment. Always consult a healthcare professional before
              starting any exercise program or if you have concerns about your
              health.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              Cadence is provided &quot;as is&quot; without warranties of any kind. We
              are not liable for any injuries, damages, or losses resulting
              from your use of our service or following our training
              recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              8. Modifications to Service
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              We reserve the right to modify or discontinue our service at any
              time. We will provide reasonable notice of any significant
              changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              9. Termination
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              You may terminate your account at any time. We reserve the right
              to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              10. Contact Us
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              For questions about these Terms of Service, contact us at:{" "}
              <a
                href="mailto:legal@cadence.nativesquare.fr"
                className="text-[#D4FF3A] hover:underline"
              >
                legal@cadence.nativesquare.fr
              </a>
            </p>
          </section>
        </div>
    </div>
  );
}
