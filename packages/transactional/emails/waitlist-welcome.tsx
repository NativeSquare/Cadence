import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

const APP_NAME = "Cadence";
const COMPANY = "NativeSquare SAS";
const APP_ADDRESS = "60 rue François 1er, 75008 Paris, France";
// In production emails, this should point to https://cadence.run/logo-cadence.svg
// For React Email preview, we use the static directory
const LOGO_URL = "/static/logo-cadence.svg";

const copy = {
  en: {
    preview: "Welcome to Cadence — your spot is confirmed",
    subtitle: "Elite coaching. For every runner.",
    title: "Your spot is confirmed.",
    body1: "Thank you for your early interest in Cadence. You've secured priority access to a new kind of running coach — one that analyzes your data, adapts your plan in real time, and explains every decision along the way.",
    body2: "As a founding member, you'll benefit from early access before the general launch, exclusive features reserved for our first users, and a direct channel to our team. Your feedback during this phase will actively shape the product.",
    body3: "We're committed to rewarding those who join us from the start. Founding members will always hold a special place in the Cadence community.",
    comingTitle: "What to expect:",
    features: [
      "Personalized training plans with transparent coaching logic",
      "Seamless integration with Garmin, COROS, and Apple Watch",
      "Intelligent daily adjustments based on your readiness",
      "Post-session insights to accelerate your progress",
    ],
    signoff: "Run smart,",
    team: "Max, Alex & Matthieu",
    teamLabel: "The Cadence team",
    footer: (email: string) =>
      `This email was sent to ${email} because you reserved your spot on Cadence.`,
  },
  fr: {
    preview: "Bienvenue sur Cadence — votre place est confirmée",
    subtitle: "Coaching d'élite. Accessible à tous.",
    title: "Votre place est confirmée.",
    body1: "Merci pour votre intérêt pour Cadence. Vous bénéficiez désormais d'un accès prioritaire à un nouveau type de coach running — un coach qui analyse vos données, adapte votre plan en temps réel, et justifie chacune de ses décisions.",
    body2: "En tant que membre fondateur, vous profiterez d'un accès anticipé avant le lancement officiel, de fonctionnalités exclusives réservées à nos premiers utilisateurs, et d'un canal direct avec notre équipe. Vos retours durant cette phase contribueront activement à façonner le produit.",
    body3: "Nous tenons à récompenser ceux qui nous rejoignent dès le départ. Les membres fondateurs auront toujours une place à part dans la communauté Cadence.",
    comingTitle: "Ce qui vous attend :",
    features: [
      "Plans d'entraînement personnalisés avec logique de coaching transparente",
      "Intégration fluide avec Garmin, COROS et Apple Watch",
      "Ajustements quotidiens intelligents basés sur votre état de forme",
      "Analyses post-séance pour accélérer votre progression",
    ],
    signoff: "Bonne course,",
    team: "Max, Alex & Matthieu",
    teamLabel: "L'équipe Cadence",
    footer: (email: string) =>
      `Cet email a été envoyé à ${email} car vous avez réservé votre place sur Cadence.`,
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
      <Head>
        <style>{`
          @import url('https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap');
        `}</style>
      </Head>
      <Tailwind>
        <Body className="bg-[#f3f3f3] font-sans m-0 p-0">
          <Preview>{t.preview}</Preview>
          <Container className="mx-auto px-4 py-10 max-w-[520px]">

            {/* ── Header: Logo + brand ── */}
            <Section className="text-center mb-10">
              <Img
                src={LOGO_URL}
                alt="Cadence"
                width="44"
                height="44"
                className="mx-auto rounded-xl"
              />
              <Text
                className="text-[26px] font-bold text-[#131313] m-0 mt-3 leading-tight"
                style={{ fontFamily: "'Satoshi', sans-serif", letterSpacing: "-0.04em" }}
              >
                cadence
              </Text>
              <Text className="text-[12px] text-[#797979] m-0 mt-1 tracking-[0.08em]">
                {t.subtitle}
              </Text>
            </Section>

            {/* ── Main content card ── */}
            <Section className="bg-white rounded-2xl px-8 py-8 mb-6" style={{ border: "1px solid #e5e5e5" }}>
              {/* Title with green accent */}
              <Text
                className="text-[#131313] text-[22px] font-bold m-0 mb-4"
                style={{ fontFamily: "'Satoshi', sans-serif", letterSpacing: "-0.02em" }}
              >
                {t.title}
              </Text>

              <Text className="text-[#797979] text-[14px] leading-[1.7] m-0 mb-4">
                {t.body1}
              </Text>
              <Text className="text-[#797979] text-[14px] leading-[1.7] m-0 mb-4">
                {t.body2}
              </Text>
              <Text className="text-[#797979] text-[14px] leading-[1.7] m-0 mb-4">
                {t.body3}
              </Text>

              <Hr className="border-[#e5e5e5] my-6" />

              {/* Features list */}
              <Text
                className="text-[#131313] text-[14px] font-bold m-0 mb-3"
                style={{ fontFamily: "'Satoshi', sans-serif" }}
              >
                {t.comingTitle}
              </Text>
              {t.features.map((feature, i) => (
                <Text key={i} className="text-[#797979] text-[13px] leading-[1.8] m-0 pl-0">
                  <span className="text-[#98fe00]">●</span>&nbsp;&nbsp;{feature}
                </Text>
              ))}

              <Hr className="border-[#e5e5e5] my-6" />

              {/* Signature */}
              <Text className="text-[#131313] text-[14px] italic m-0 mb-2">
                {t.signoff}
              </Text>
              <Text
                className="text-[#131313] text-[15px] font-bold m-0"
                style={{ fontFamily: "'Satoshi', sans-serif" }}
              >
                {t.team}
              </Text>
              <Text className="text-[#b4b4b4] text-[12px] m-0 mt-0.5">
                {t.teamLabel}
              </Text>
            </Section>

            {/* ── Footer ── */}
            <Section className="text-center mt-8">
              <Text className="text-[#b4b4b4] text-[11px] m-0 leading-[1.6]">
                {t.footer(email!)}
              </Text>
              <Text className="text-[#b4b4b4] text-[11px] m-0 mt-2">
                &copy; 2026 {APP_NAME} &middot; {COMPANY} &middot; {APP_ADDRESS}
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
