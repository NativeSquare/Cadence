import Link from "next/link";

export default function PrivacyPage() {
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
          Politique de confidentialit&eacute;
        </h1>
        <p className="mb-12 text-sm text-[#797979]">
          Derni&egrave;re mise &agrave; jour : avril 2026
        </p>

        <div className="space-y-10">
          <LegalSection title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des donn&eacute;es personnelles est la
              soci&eacute;t&eacute; <strong className="text-[#131313]">NativeSquare</strong>,
              dont le si&egrave;ge social est situ&eacute; au 60 rue
              Fran&ccedil;ois 1er, 75008 Paris, France.
            </p>
            <p>
              Contact :{" "}
              <a
                href="mailto:privacy@cadence.run"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                privacy@cadence.run
              </a>
            </p>
          </LegalSection>

          <LegalSection title="2. Donn&eacute;es collect&eacute;es">
            <p>
              Dans le cadre de notre service de liste d&apos;attente
              (pr&eacute;-lancement), nous collectons uniquement :
            </p>
            <ul>
              <li>
                <strong className="text-[#131313]">Adresse email</strong> :
                fournie volontairement lors de l&apos;inscription &agrave; la
                liste d&apos;attente
              </li>
              <li>
                <strong className="text-[#131313]">Source d&apos;inscription</strong> :
                section du site depuis laquelle vous vous &ecirc;tes inscrit
              </li>
              <li>
                <strong className="text-[#131313]">Langue pr&eacute;f&eacute;r&eacute;e</strong> :
                d&eacute;tect&eacute;e automatiquement via votre navigateur
              </li>
              <li>
                <strong className="text-[#131313]">Date d&apos;inscription</strong> :
                horodatage de votre inscription
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Finalit&eacute;s du traitement">
            <p>Vos donn&eacute;es sont utilis&eacute;es pour :</p>
            <ul>
              <li>
                G&eacute;rer votre inscription &agrave; la liste d&apos;attente
                de Cadence
              </li>
              <li>
                Vous envoyer des emails transactionnels (confirmation
                d&apos;inscription, informations sur le lancement)
              </li>
              <li>
                Vous informer de la disponibilit&eacute; du service Cadence
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Base l&eacute;gale du traitement">
            <p>
              Le traitement de vos donn&eacute;es repose sur votre{" "}
              <strong className="text-[#131313]">consentement</strong> (article
              6.1.a du RGPD), exprim&eacute; lors de votre inscription
              volontaire &agrave; la liste d&apos;attente.
            </p>
          </LegalSection>

          <LegalSection title="5. Sous-traitants et transferts de donn&eacute;es">
            <p>
              Vos donn&eacute;es sont trait&eacute;es par les sous-traitants
              suivants :
            </p>
            <ul>
              <li>
                <strong className="text-[#131313]">Convex, Inc.</strong> (San
                Francisco, USA) : h&eacute;bergement de la base de donn&eacute;es
                backend et ex&eacute;cution des fonctions serveur. Les
                transferts vers les &Eacute;tats-Unis sont encadr&eacute;s par
                les clauses contractuelles types de la Commission
                europ&eacute;enne.
              </li>
              <li>
                <strong className="text-[#131313]">Resend, Inc.</strong> (USA) :
                envoi d&apos;emails transactionnels (confirmation
                d&apos;inscription &agrave; la liste d&apos;attente).
              </li>
              <li>
                <strong className="text-[#131313]">Vercel, Inc.</strong> (USA) :
                h&eacute;bergement du site web.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="6. Dur&eacute;e de conservation">
            <p>
              Vos donn&eacute;es sont conserv&eacute;es tant que le service est
              en phase de pr&eacute;-lancement et que vous restez inscrit(e)
              &agrave; la liste d&apos;attente. Vous pouvez demander la
              suppression de vos donn&eacute;es &agrave; tout moment.
            </p>
          </LegalSection>

          <LegalSection title="7. Vos droits (RGPD)">
            <p>
              Conform&eacute;ment au R&egrave;glement G&eacute;n&eacute;ral sur
              la Protection des Donn&eacute;es (RGPD), vous disposez des droits
              suivants :
            </p>
            <ul>
              <li>
                <strong className="text-[#131313]">Droit d&apos;acc&egrave;s</strong> :
                obtenir une copie de vos donn&eacute;es personnelles
              </li>
              <li>
                <strong className="text-[#131313]">Droit de rectification</strong> :
                corriger des donn&eacute;es inexactes
              </li>
              <li>
                <strong className="text-[#131313]">Droit &agrave; l&apos;effacement</strong> :
                demander la suppression de vos donn&eacute;es
              </li>
              <li>
                <strong className="text-[#131313]">Droit &agrave; la portabilit&eacute;</strong> :
                recevoir vos donn&eacute;es dans un format structur&eacute;
              </li>
              <li>
                <strong className="text-[#131313]">Droit d&apos;opposition</strong> :
                vous opposer au traitement de vos donn&eacute;es
              </li>
              <li>
                <strong className="text-[#131313]">Droit au retrait du consentement</strong> :
                retirer votre consentement &agrave; tout moment
              </li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous &agrave; :{" "}
              <a
                href="mailto:privacy@cadence.run"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                privacy@cadence.run
              </a>
            </p>
          </LegalSection>

          <LegalSection title="8. Cookies">
            <p>
              Le site Cadence utilise uniquement des cookies essentiels au
              fonctionnement du service (session, authentification). Nous
              n&apos;utilisons pas de cookies de suivi publicitaire ni de cookies
              tiers &agrave; des fins de marketing.
            </p>
          </LegalSection>

          <LegalSection title="9. R&eacute;clamation">
            <p>
              Si vous estimez que le traitement de vos donn&eacute;es ne
              respecte pas la r&eacute;glementation en vigueur, vous pouvez
              adresser une r&eacute;clamation &agrave; la{" "}
              <strong className="text-[#131313]">
                Commission Nationale de l&apos;Informatique et des
                Libert&eacute;s (CNIL)
              </strong>
              , 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07,{" "}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                www.cnil.fr
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="10. Modifications">
            <p>
              Nous nous r&eacute;servons le droit de modifier cette politique de
              confidentialit&eacute; &agrave; tout moment. La date de
              derni&egrave;re mise &agrave; jour sera mise &agrave; jour en
              cons&eacute;quence.
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
