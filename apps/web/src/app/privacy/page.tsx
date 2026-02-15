export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-32 sm:px-8 lg:px-12">
      <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#C8FF00]">
        Legal
      </div>
      <h1 className="mb-2 text-[clamp(36px,4.5vw,56px)] font-light leading-[1.1] tracking-[-0.03em] text-white/[0.92]">
        Privacy Policy
      </h1>
      <p className="mb-12 text-sm font-light text-white/25">
        Last updated: February 2026
      </p>

      <div className="space-y-10">
        <LegalSection title="Information We Collect">
          <p>We collect information you provide directly to us, including:</p>
          <ul>
            <li>Account information (name, email)</li>
            <li>Running profile (experience, goals, schedule)</li>
            <li>Health context (injury history, sleep, stress levels)</li>
            <li>Connected device data (Strava, wearables)</li>
            <li>Coaching preferences</li>
          </ul>
        </LegalSection>

        <LegalSection title="How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Generate personalized training plans</li>
            <li>Provide AI-powered coaching recommendations</li>
            <li>Track your progress and adapt your plan</li>
            <li>Improve our algorithms and services</li>
            <li>Communicate with you about your training</li>
          </ul>
        </LegalSection>

        <LegalSection title="Data Storage & Security">
          <p>
            Your data is stored securely using industry-standard encryption. All
            data is encrypted in transit (TLS 1.2+) and at rest. OAuth tokens
            are stored securely, and sensitive health data is never logged in
            plain text.
          </p>
        </LegalSection>

        <LegalSection title="Data Sharing">
          <p>
            We do not sell your personal data. We may share data with AI
            services (such as OpenAI) to generate training plans, which requires
            processing your profile data. We do not share your data with third
            parties for marketing purposes.
          </p>
        </LegalSection>

        <LegalSection title="Data Retention">
          <p>
            Your data is retained while you have an active account. You can
            request deletion of your data at any time by contacting us.
          </p>
        </LegalSection>

        <LegalSection title="Your Rights (GDPR)">
          <p>If you are in the European Union, you have the right to:</p>
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
              your data in a portable format
            </li>
            <li>
              <strong className="text-white/[0.92]">Object:</strong> Object to
              certain processing of your data
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Your Rights (CCPA)">
          <p>If you are a California resident, you have the right to:</p>
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

        <LegalSection title="Cookies">
          <p>
            We use essential cookies to maintain your session and preferences.
            We do not use third-party tracking cookies.
          </p>
        </LegalSection>

        <LegalSection title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes by email or through the app.
          </p>
        </LegalSection>

        <LegalSection title="Contact Us">
          <p>
            For data-related requests or questions about this policy, contact us
            at:{" "}
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
