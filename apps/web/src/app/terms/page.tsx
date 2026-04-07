import Link from "next/link";

export default function TermsPage() {
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
          Juridique
        </div>
        <h1 className="mb-2 font-[family-name:var(--font-satoshi)] text-[clamp(36px,4.5vw,56px)] font-bold leading-[1.1] tracking-[-0.03em] text-[#131313]">
          Conditions G&eacute;n&eacute;rales d&apos;Utilisation
        </h1>
        <p className="mb-12 text-sm text-[#797979]">
          Derni&egrave;re mise &agrave; jour : avril 2026
        </p>

        <div className="space-y-10">
          <LegalSection title="1. Objet">
            <p>
              Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales
              d&apos;Utilisation (CGU) r&eacute;gissent l&apos;acc&egrave;s et
              l&apos;utilisation du site web{" "}
              <strong className="text-[#131313]">cadence.run</strong>
              , &eacute;dit&eacute; par la soci&eacute;t&eacute; NativeSquare.
              En acc&eacute;dant au site, vous acceptez sans r&eacute;serve les
              pr&eacute;sentes CGU.
            </p>
          </LegalSection>

          <LegalSection title="2. Description du service">
            <p>
              Le site cadence.run est actuellement en phase de
              pr&eacute;-lancement. Il permet aux visiteurs de :
            </p>
            <ul>
              <li>
                D&eacute;couvrir le futur service Cadence, un coach de course
                &agrave; pied propuls&eacute; par l&apos;intelligence
                artificielle
              </li>
              <li>
                S&apos;inscrire &agrave; une liste d&apos;attente en fournissant
                leur adresse email
              </li>
            </ul>
            <p>
              Le service complet de coaching IA n&apos;est pas encore
              disponible. Aucun abonnement payant n&apos;est propos&eacute;
              &agrave; ce stade.
            </p>
          </LegalSection>

          <LegalSection title="3. Inscription &agrave; la liste d&apos;attente">
            <p>
              L&apos;inscription &agrave; la liste d&apos;attente est gratuite
              et sans engagement. En vous inscrivant, vous consentez &agrave;
              recevoir des communications de la part de Cadence relatives au
              lancement du service.
            </p>
            <p>
              Vous pouvez demander votre d&eacute;sinscription &agrave; tout
              moment en nous contactant &agrave;{" "}
              <a
                href="mailto:hello@cadence.run"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                hello@cadence.run
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="4. Propri&eacute;t&eacute; intellectuelle">
            <p>
              L&apos;ensemble des contenus pr&eacute;sents sur le site
              cadence.run (textes, images, graphismes, logo, ic&ocirc;nes,
              logiciels) sont la propri&eacute;t&eacute; exclusive de
              NativeSquare ou de ses partenaires et sont
              prot&eacute;g&eacute;s par le droit de la propri&eacute;t&eacute;
              intellectuelle.
            </p>
            <p>
              Toute reproduction, repr&eacute;sentation, modification ou
              exploitation non autoris&eacute;e de tout ou partie de ces
              contenus est interdite.
            </p>
          </LegalSection>

          <LegalSection title="5. Responsabilit&eacute;">
            <p>
              Le site cadence.run est fourni &laquo; en l&apos;&eacute;tat
              &raquo;. NativeSquare s&apos;efforce d&apos;assurer
              l&apos;exactitude des informations publi&eacute;es mais ne
              garantit pas l&apos;absence d&apos;erreurs ou
              d&apos;interruptions.
            </p>
            <p>
              NativeSquare ne saurait &ecirc;tre tenue responsable des dommages
              directs ou indirects r&eacute;sultant de l&apos;utilisation du
              site ou de l&apos;impossibilit&eacute; d&apos;y
              acc&eacute;der.
            </p>
          </LegalSection>

          <LegalSection title="6. Avertissement sant&eacute;">
            <p>
              Cadence fournira un service de coaching sportif assist&eacute; par
              l&apos;intelligence artificielle. Il ne constitue pas un
              dispositif m&eacute;dical et ne fournit aucun conseil
              m&eacute;dical, diagnostic ou traitement. Consultez toujours un
              professionnel de sant&eacute; avant de commencer un programme
              d&apos;exercice.
            </p>
          </LegalSection>

          <LegalSection title="7. Donn&eacute;es personnelles">
            <p>
              Le traitement de vos donn&eacute;es personnelles est
              d&eacute;crit dans notre{" "}
              <Link
                href="/privacy"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                Politique de confidentialit&eacute;
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="8. Modification des CGU">
            <p>
              NativeSquare se r&eacute;serve le droit de modifier les
              pr&eacute;sentes CGU &agrave; tout moment. Les modifications
              prennent effet d&egrave;s leur publication sur le site. La date de
              derni&egrave;re mise &agrave; jour est indiqu&eacute;e en haut de
              cette page.
            </p>
          </LegalSection>

          <LegalSection title="9. Droit applicable et juridiction">
            <p>
              Les pr&eacute;sentes CGU sont r&eacute;gies par le droit
              fran&ccedil;ais. En cas de litige, et apr&egrave;s tentative de
              r&eacute;solution amiable, les tribunaux comp&eacute;tents de
              Paris seront seuls comp&eacute;tents.
            </p>
          </LegalSection>

          <LegalSection title="10. Contact">
            <p>
              Pour toute question relative aux pr&eacute;sentes CGU, vous
              pouvez nous contacter &agrave; :{" "}
              <a
                href="mailto:hello@cadence.run"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                hello@cadence.run
              </a>
            </p>
          </LegalSection>
        </div>
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
    <section className="border-b border-[#e5e5e5] pb-10 last:border-b-0 [&_li]:py-1 [&_li]:text-[15px] [&_li]:leading-[1.6] [&_li]:text-[#797979] [&_p]:text-[15px] [&_p]:leading-[1.6] [&_p]:text-[#797979] [&_ul]:mt-3 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-1">
      <h2 className="mb-4 font-[family-name:var(--font-satoshi)] text-lg font-semibold tracking-[-0.02em] text-[#131313]">
        {title}
      </h2>
      {children}
    </section>
  );
}
