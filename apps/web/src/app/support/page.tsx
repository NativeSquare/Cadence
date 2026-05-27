import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#131313]">
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-32 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#797979] no-underline transition-colors hover:text-[#131313]"
        >
          &larr; Retour
        </Link>

        <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#797979]">
          Assistance
        </div>
        <h1 className="mb-2 font-[family-name:var(--font-satoshi)] text-[clamp(36px,4.5vw,56px)] font-bold leading-[1.1] tracking-[-0.03em] text-[#131313]">
          Centre d&apos;aide
        </h1>
        <p className="mb-12 text-sm text-[#797979]">
          Une question&nbsp;? Nous sommes l&agrave; pour vous aider.
        </p>

        <div className="space-y-10">
          <SupportSection title="Nous contacter">
            <p>
              Notre &eacute;quipe est disponible pour r&eacute;pondre &agrave;
              toutes vos questions. Envoyez-nous un email et nous vous
              r&eacute;pondrons dans les plus brefs d&eacute;lais.
            </p>
            <p>
              <strong className="text-[#131313]">Email&nbsp;:</strong>{" "}
              <a
                href="mailto:support@cadencerun.fr"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                support@cadencerun.fr
              </a>
            </p>
          </SupportSection>

          <SupportSection title="Questions fréquentes">
            <p>
              <strong className="text-[#131313]">
                Comment modifier mon abonnement&nbsp;?
              </strong>
            </p>
            <p>
              Vous pouvez g&eacute;rer votre abonnement directement depuis
              l&apos;application Cadence, dans les param&egrave;tres de votre
              compte. Si vous rencontrez des difficult&eacute;s, contactez-nous
              &agrave;{" "}
              <a
                href="mailto:support@cadencerun.fr"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                support@cadencerun.fr
              </a>
              .
            </p>
            <p>
              <strong className="text-[#131313]">
                Comment connecter ma montre&nbsp;?
              </strong>
            </p>
            <p>
              Cadence se connecte &agrave; Apple Watch et Garmin. Rendez-vous
              dans les param&egrave;tres de l&apos;application et suivez les
              &eacute;tapes d&apos;int&eacute;gration pour coupler votre
              appareil.
            </p>
            <p>
              <strong className="text-[#131313]">
                Mon plan ne s&apos;est pas mis &agrave; jour apr&egrave;s une
                sortie.
              </strong>
            </p>
            <p>
              Assurez-vous que votre montre ou l&apos;application tierce
              (Garmin Connect, Strava) est bien synchronis&eacute;e. Si le
              probl&egrave;me persiste apr&egrave;s une heure, contactez le
              support.
            </p>
          </SupportSection>

          <SupportSection title="Facturation et abonnement">
            <p>
              Pour toute question relative aux paiements, remboursements ou
              probl&egrave;mes de facturation, &eacute;crivez-nous &agrave;{" "}
              <a
                href="mailto:support@cadencerun.fr"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                support@cadencerun.fr
              </a>{" "}
              en indiquant votre adresse email de compte et une description du
              probl&egrave;me.
            </p>
            <p>
              Les abonnements iOS sont g&eacute;r&eacute;s par l&apos;App Store
              d&apos;Apple. Pour annuler ou modifier un abonnement souscrit via
              l&apos;App Store, rendez-vous dans{" "}
              <strong className="text-[#131313]">
                R&eacute;glages &rarr; Votre identifiant Apple &rarr;
                Abonnements
              </strong>
              .
            </p>
          </SupportSection>

          <SupportSection title="Problèmes techniques">
            <p>
              Si vous rencontrez un bug ou un comportement inattendu,
              d&eacute;crivez-le avec autant de d&eacute;tails que possible
              (version de l&apos;app, mod&egrave;le d&apos;iPhone,
              &eacute;tape exacte o&ugrave; le probl&egrave;me survient) et
              envoyez-nous le tout &agrave;{" "}
              <a
                href="mailto:support@cadencerun.fr"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                support@cadencerun.fr
              </a>
              .
            </p>
            <p>
              Nous r&eacute;pondons g&eacute;n&eacute;ralement sous{" "}
              <strong className="text-[#131313]">24 &agrave; 48 heures</strong>{" "}
              en jours ouvr&eacute;s.
            </p>
          </SupportSection>

          <SupportSection title="Suppression de compte">
            <p>
              Pour demander la suppression de votre compte et de vos
              donn&eacute;es, envoyez un email &agrave;{" "}
              <a
                href="mailto:support@cadencerun.fr"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                support@cadencerun.fr
              </a>{" "}
              avec l&apos;objet &laquo;&nbsp;Suppression de
              compte&nbsp;&raquo;. Nous traiterons votre demande dans les 30
              jours conform&eacute;ment au RGPD.
            </p>
          </SupportSection>
        </div>
      </div>
    </div>
  );
}

function SupportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#e5e5e5] pb-10 last:border-b-0 [&_p+p]:mt-4 [&_p]:text-[15px] [&_p]:leading-[1.6] [&_p]:text-[#797979]">
      <h2 className="mb-4 font-[family-name:var(--font-satoshi)] text-lg font-semibold tracking-[-0.02em] text-[#131313]">
        {title}
      </h2>
      {children}
    </section>
  );
}
