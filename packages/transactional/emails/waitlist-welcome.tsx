import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

const APP_NAME = "Cadence";
const APP_ADDRESS = "60 rue François 1er, 75008 Paris, France";

const copy = {
  en: {
    preview: "You're on the Cadence waiting list",
    subtitle: "AI Running Coach",
    title: "You're in.",
    body1: "Thanks for joining the Cadence waiting list. We're building an AI running coach that doesn't just prescribe workouts — it explains every decision, adapts to your life, and gets smarter with every run.",
    body2: "You'll be among the first to experience it. We'll reach out when it's your turn.",
    comingTitle: "What's coming:",
    features: [
      "Personalized training plans with visible reasoning",
      "Wearable data integration (Garmin, COROS, Apple Watch)",
      "Live coaching intelligence that shows its work",
      "Post-session analysis and adaptive planning",
    ],
    footer: (email: string) =>
      `This email was sent to ${email} because you joined the Cadence waiting list.`,
  },
  fr: {
    preview: "Vous êtes sur la liste d'attente Cadence",
    subtitle: "Coach Running IA",
    title: "Vous êtes inscrit.",
    body1: "Merci d'avoir rejoint la liste d'attente Cadence. Nous construisons un coach running IA qui ne se contente pas de prescrire des séances — il explique chaque décision, s'adapte à votre vie, et progresse à chaque sortie.",
    body2: "Vous serez parmi les premiers à en profiter. Nous vous contacterons quand ce sera votre tour.",
    comingTitle: "Ce qui arrive :",
    features: [
      "Plans d'entraînement personnalisés avec raisonnement visible",
      "Intégration des données wearable (Garmin, COROS, Apple Watch)",
      "Intelligence de coaching en direct qui montre son travail",
      "Analyse post-séance et planification adaptative",
    ],
    footer: (email: string) =>
      `Cet email a été envoyé à ${email} car vous avez rejoint la liste d'attente Cadence.`,
  },
};

interface WaitlistWelcomeEmailProps {
  email?: string;
  locale?: "en" | "fr";
}

export const WaitlistWelcomeEmail = ({
  email = "runner@example.com",
  locale = "en",
}: WaitlistWelcomeEmailProps) => {
  const t = copy[locale];

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-[#0A0A0A] font-sans">
          <Preview>{t.preview}</Preview>
          <Container className="mx-auto px-4 py-8 max-w-[480px]">
            {/* Header */}
            <Section className="text-center mb-8">
              <Text className="text-[28px] font-bold text-white m-0 leading-tight">
                Cadence
              </Text>
              <Text className="text-[13px] text-[#CCFF00] uppercase tracking-[0.15em] m-0 mt-1">
                {t.subtitle}
              </Text>
            </Section>

            {/* Main content */}
            <Section className="bg-[#1C1C1E] rounded-2xl px-6 py-8 mb-6">
              <Text className="text-white text-[18px] font-semibold m-0 mb-3">
                {t.title}
              </Text>
              <Text className="text-[#A1A1AA] text-[14px] leading-[1.7] m-0 mb-4">
                {t.body1}
              </Text>
              <Text className="text-[#A1A1AA] text-[14px] leading-[1.7] m-0 mb-4">
                {t.body2}
              </Text>

              <Hr className="border-[#2A2A2E] my-6" />

              <Text className="text-white text-[14px] font-semibold m-0 mb-3">
                {t.comingTitle}
              </Text>
              <Text className="text-[#A1A1AA] text-[13px] leading-[1.8] m-0">
                {t.features.map((f) => `\u2022 ${f}`).join("\n")}
              </Text>
            </Section>

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-[#52525B] text-[12px] m-0">
                {t.footer(email)}
              </Text>
              <Text className="text-[#52525B] text-[12px] m-0 mt-2">
                &copy; 2026 {APP_NAME}, {APP_ADDRESS}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

WaitlistWelcomeEmail.PreviewProps = {
  email: "alex@example.com",
  locale: "fr",
} as WaitlistWelcomeEmailProps;

export default WaitlistWelcomeEmail;
