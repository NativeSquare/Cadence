export default function HealthDataPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-32 sm:px-8 lg:px-12">
      <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#C8FF00]">
        Legal
      </div>
      <h1 className="mb-2 text-[clamp(36px,4.5vw,56px)] font-light leading-[1.1] tracking-[-0.03em] text-white/[0.92]">
        Health Data Practices
      </h1>
      <p className="mb-12 text-sm font-light text-white/25">
        Last updated: February 2026
      </p>

      <div className="space-y-10">
        <LegalSection title="What Data We Collect">
          <p>
            Cadence collects running and fitness data to provide personalized
            coaching:
          </p>
          <ul>
            <li>
              <strong className="text-white/[0.92]">
                Profile Information:
              </strong>{" "}
              Name, age, weight (optional)
            </li>
            <li>
              <strong className="text-white/[0.92]">Running Data:</strong>{" "}
              Experience level, frequency, volume, pace
            </li>
            <li>
              <strong className="text-white/[0.92]">Goals:</strong> Race
              targets, time goals, training objectives
            </li>
            <li>
              <strong className="text-white/[0.92]">Schedule:</strong> Available
              training days, time preferences
            </li>
            <li>
              <strong className="text-white/[0.92]">Health Context:</strong>{" "}
              Past injuries, sleep quality, stress levels
            </li>
            <li>
              <strong className="text-white/[0.92]">Connected Data:</strong>{" "}
              Strava activities, Apple Health data (if connected)
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="How We Use Your Data">
          <ul>
            <li>Generate personalized training plans</li>
            <li>Adapt coaching to your goals and situation</li>
            <li>Track your progress over time</li>
            <li>Improve our coaching algorithms</li>
          </ul>
        </LegalSection>

        <LegalSection title="Data Storage & Security">
          <p>
            Your data is stored securely using industry-standard encryption:
          </p>
          <ul>
            <li>All data encrypted in transit (TLS 1.2+)</li>
            <li>Data encrypted at rest</li>
            <li>OAuth tokens stored securely, never in plain text</li>
            <li>Health data never logged in plain text</li>
          </ul>
        </LegalSection>

        <LegalSection title="Data Retention">
          <p>
            Your data is retained while you have an active account. You can
            request deletion at any time.
          </p>
        </LegalSection>

        <LegalSection title="Third-Party Sharing">
          <p>
            We do not sell your data. We use AI services (OpenAI) to generate
            training plans, which requires processing your profile data. See our
            Privacy Policy for full details.
          </p>
        </LegalSection>

        <LegalSection title="Your Rights">
          <h3 className="mb-3 mt-1 text-base font-medium text-white/[0.92]">
            GDPR Rights (EU Users)
          </h3>
          <ul>
            <li>
              <strong className="text-white/[0.92]">Access:</strong> Request a
              copy of your data
            </li>
            <li>
              <strong className="text-white/[0.92]">Rectification:</strong>{" "}
              Correct inaccurate data
            </li>
            <li>
              <strong className="text-white/[0.92]">Erasure:</strong> Request
              deletion of your data
            </li>
            <li>
              <strong className="text-white/[0.92]">Portability:</strong> Export
              your data
            </li>
          </ul>

          <h3 className="mb-3 mt-6 text-base font-medium text-white/[0.92]">
            CCPA Rights (California Users)
          </h3>
          <ul>
            <li>
              <strong className="text-white/[0.92]">Right to Know:</strong> What
              data we collect and why
            </li>
            <li>
              <strong className="text-white/[0.92]">Right to Delete:</strong>{" "}
              Request deletion of your data
            </li>
            <li>
              <strong className="text-white/[0.92]">Right to Opt-Out:</strong>{" "}
              We do not sell personal information
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Wellness Disclaimer">
          <p>
            Cadence provides fitness and wellness coaching. It is not a medical
            device and does not provide medical advice, diagnosis, or treatment.
            Always consult a healthcare professional for medical concerns.
          </p>
        </LegalSection>

        <LegalSection title="Contact Us">
          <p>
            For data-related requests:{" "}
            <a
              href="mailto:privacy@cadence.nativesquare.fr"
              className="text-[#C8FF00] transition-opacity hover:opacity-80"
            >
              privacy@cadence.nativesquare.fr
            </a>
          </p>
        </LegalSection>
      </div>
    </div>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/[0.08] pb-10 last:border-b-0 [&_li]:py-1 [&_li]:text-[15px] [&_li]:font-light [&_li]:leading-[1.6] [&_li]:text-white/45 [&_p]:text-[15px] [&_p]:font-light [&_p]:leading-[1.6] [&_p]:text-white/45 [&_ul]:mt-3 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-1">
      <h2 className="mb-4 text-lg font-medium tracking-[-0.02em] text-white/[0.92]">
        {title}
      </h2>
      {children}
    </section>
  );
}
