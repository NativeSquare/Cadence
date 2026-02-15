export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-32 sm:px-8 lg:px-12">
      <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#C8FF00]">
        Legal
      </div>
      <h1 className="mb-2 text-[clamp(36px,4.5vw,56px)] font-light leading-[1.1] tracking-[-0.03em] text-white/[0.92]">
        Terms of Service
      </h1>
      <p className="mb-12 text-sm font-light text-white/25">
        Last updated: February 2026
      </p>

      <div className="space-y-10">
        <LegalSection title="1. Acceptance of Terms">
          <p>
            By accessing or using Cadence, you agree to be bound by these Terms
            of Service. If you do not agree to these terms, please do not use
            our service.
          </p>
        </LegalSection>

        <LegalSection title="2. Description of Service">
          <p>
            Cadence provides personalized running coaching and training plan
            generation services. Our AI-powered coach analyzes your running
            data, goals, and preferences to create tailored training plans.
          </p>
        </LegalSection>

        <LegalSection title="3. User Accounts">
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account. You agree to notify us immediately of any unauthorized use
            of your account.
          </p>
        </LegalSection>

        <LegalSection title="4. User Data">
          <p>
            You retain ownership of all data you provide to Cadence. By using
            our service, you grant us a license to use this data to provide and
            improve our services. See our Privacy Policy for details on how we
            handle your data.
          </p>
        </LegalSection>

        <LegalSection title="5. Third-Party Integrations">
          <p>
            Cadence may integrate with third-party services such as Strava,
            Garmin, and Apple Health. Your use of these integrations is subject
            to the terms of service of those third parties.
          </p>
        </LegalSection>

        <LegalSection title="6. Wellness Disclaimer">
          <p>
            Cadence provides fitness and wellness coaching. It is not a medical
            device and does not provide medical advice, diagnosis, or treatment.
            Always consult a healthcare professional before starting any
            exercise program or if you have concerns about your health.
          </p>
        </LegalSection>

        <LegalSection title="7. Limitation of Liability">
          <p>
            Cadence is provided &quot;as is&quot; without warranties of any
            kind. We are not liable for any injuries, damages, or losses
            resulting from your use of our service or following our training
            recommendations.
          </p>
        </LegalSection>

        <LegalSection title="8. Modifications to Service">
          <p>
            We reserve the right to modify or discontinue our service at any
            time. We will provide reasonable notice of any significant changes.
          </p>
        </LegalSection>

        <LegalSection title="9. Termination">
          <p>
            You may terminate your account at any time. We reserve the right to
            suspend or terminate accounts that violate these terms.
          </p>
        </LegalSection>

        <LegalSection title="10. Contact Us">
          <p>
            For questions about these Terms of Service, contact us at:{" "}
            <a
              href="mailto:legal@cadence.nativesquare.fr"
              className="text-[#C8FF00] transition-opacity hover:opacity-80"
            >
              legal@cadence.nativesquare.fr
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
    <section className="border-b border-white/[0.08] pb-10 last:border-b-0 [&_p]:text-[15px] [&_p]:font-light [&_p]:leading-[1.6] [&_p]:text-white/45">
      <h2 className="mb-4 text-lg font-medium tracking-[-0.02em] text-white/[0.92]">
        {title}
      </h2>
      {children}
    </section>
  );
}
