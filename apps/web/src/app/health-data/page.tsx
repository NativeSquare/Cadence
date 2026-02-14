export default function HealthDataPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-4">
          Health Data Practices
        </h1>
        <p className="text-[#8E8E93] mb-8">Last updated: February 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              What Data We Collect
            </h2>
            <p className="text-[#8E8E93] leading-relaxed mb-4">
              Cadence collects running and fitness data to provide personalized
              coaching:
            </p>
            <ul className="list-disc list-inside text-[#8E8E93] space-y-2">
              <li>
                <strong className="text-white">Profile Information:</strong> Name, age, weight
                (optional)
              </li>
              <li>
                <strong className="text-white">Running Data:</strong> Experience level, frequency,
                volume, pace
              </li>
              <li>
                <strong className="text-white">Goals:</strong> Race targets, time goals, training
                objectives
              </li>
              <li>
                <strong className="text-white">Schedule:</strong> Available training days, time
                preferences
              </li>
              <li>
                <strong className="text-white">Health Context:</strong> Past injuries, sleep quality,
                stress levels
              </li>
              <li>
                <strong className="text-white">Connected Data:</strong> Strava activities, Apple Health
                data (if connected)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              How We Use Your Data
            </h2>
            <ul className="list-disc list-inside text-[#8E8E93] space-y-2">
              <li>Generate personalized training plans</li>
              <li>Adapt coaching to your goals and situation</li>
              <li>Track your progress over time</li>
              <li>Improve our coaching algorithms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Data Storage & Security
            </h2>
            <p className="text-[#8E8E93] leading-relaxed mb-4">
              Your data is stored securely using industry-standard encryption:
            </p>
            <ul className="list-disc list-inside text-[#8E8E93] space-y-2">
              <li>All data encrypted in transit (TLS 1.2+)</li>
              <li>Data encrypted at rest</li>
              <li>OAuth tokens stored securely, never in plain text</li>
              <li>Health data never logged in plain text</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Data Retention
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              Your data is retained while you have an active account. You can
              request deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Third-Party Sharing
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              We do not sell your data. We use AI services (OpenAI) to generate
              training plans, which requires processing your profile data. See
              our Privacy Policy for full details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Your Rights
            </h2>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">
              GDPR Rights (EU Users)
            </h3>
            <ul className="list-disc list-inside text-[#8E8E93] space-y-2">
              <li>
                <strong className="text-white">Access:</strong> Request a copy of your data
              </li>
              <li>
                <strong className="text-white">Rectification:</strong> Correct inaccurate data
              </li>
              <li>
                <strong className="text-white">Erasure:</strong> Request deletion of your data
              </li>
              <li>
                <strong className="text-white">Portability:</strong> Export your data
              </li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">
              CCPA Rights (California Users)
            </h3>
            <ul className="list-disc list-inside text-[#8E8E93] space-y-2">
              <li>
                <strong className="text-white">Right to Know:</strong> What data we collect and why
              </li>
              <li>
                <strong className="text-white">Right to Delete:</strong> Request deletion of your data
              </li>
              <li>
                <strong className="text-white">Right to Opt-Out:</strong> We do not sell personal
                information
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Wellness Disclaimer
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              Cadence provides fitness and wellness coaching. It is not a
              medical device and does not provide medical advice, diagnosis, or
              treatment. Always consult a healthcare professional for medical
              concerns.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Contact Us
            </h2>
            <p className="text-[#8E8E93] leading-relaxed">
              For data-related requests:{" "}
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
