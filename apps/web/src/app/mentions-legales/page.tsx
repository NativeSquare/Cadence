import Link from "next/link";

export default function MentionsLegalesPage() {
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
          Mentions l&eacute;gales
        </h1>
        <p className="mb-12 text-sm text-[#797979]">
          Derni&egrave;re mise &agrave; jour : avril 2026
        </p>

        <div className="space-y-10">
          <LegalSection title="1. &Eacute;diteur du site">
            <p>
              Le site <strong className="text-[#131313]">cadence.run</strong> est
              &eacute;dit&eacute; par :
            </p>
            <ul>
              <li>
                <strong className="text-[#131313]">Raison sociale</strong> :
                NativeSquare
              </li>
              <li>
                <strong className="text-[#131313]">Si&egrave;ge social</strong> :
                60 rue Fran&ccedil;ois 1er, 75008 Paris, France
              </li>
              <li>
                <strong className="text-[#131313]">Email</strong> :{" "}
                <a
                  href="mailto:hello@cadence.run"
                  className="text-[#131313] underline transition-opacity hover:opacity-70"
                >
                  hello@cadence.run
                </a>
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="2. Directeur de la publication">
            <p>
              Le directeur de la publication est le repr&eacute;sentant
              l&eacute;gal de la soci&eacute;t&eacute; NativeSquare.
            </p>
            <p>
              Contact :{" "}
              <a
                href="mailto:hello@cadence.run"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                hello@cadence.run
              </a>
            </p>
          </LegalSection>

          <LegalSection title="3. H&eacute;bergement">
            <p>Le site est h&eacute;berg&eacute; par :</p>
            <ul>
              <li>
                <strong className="text-[#131313]">Site web (frontend)</strong> :
                Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
                &Eacute;tats-Unis &mdash;{" "}
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#131313] underline transition-opacity hover:opacity-70"
                >
                  vercel.com
                </a>
              </li>
              <li>
                <strong className="text-[#131313]">Backend et base de donn&eacute;es</strong> :
                Convex, Inc., San Francisco, CA, &Eacute;tats-Unis &mdash;{" "}
                <a
                  href="https://convex.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#131313] underline transition-opacity hover:opacity-70"
                >
                  convex.dev
                </a>
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Propri&eacute;t&eacute; intellectuelle">
            <p>
              L&apos;ensemble des &eacute;l&eacute;ments constituant le site
              cadence.run (textes, images, graphismes, logo, marques,
              ic&ocirc;nes, logiciels, base de donn&eacute;es) sont
              prot&eacute;g&eacute;s par les dispositions du Code de la
              propri&eacute;t&eacute; intellectuelle et appartiennent &agrave;
              NativeSquare ou font l&apos;objet d&apos;une autorisation
              d&apos;utilisation.
            </p>
            <p>
              Toute reproduction, repr&eacute;sentation, modification,
              publication, adaptation, totale ou partielle, de l&apos;un
              quelconque de ces &eacute;l&eacute;ments, quel que soit le moyen
              ou le proc&eacute;d&eacute; utilis&eacute;, est interdite sauf
              autorisation &eacute;crite pr&eacute;alable de NativeSquare.
            </p>
          </LegalSection>

          <LegalSection title="5. Donn&eacute;es personnelles">
            <p>
              Les informations relatives au traitement de vos donn&eacute;es
              personnelles sont d&eacute;taill&eacute;es dans notre{" "}
              <Link
                href="/privacy"
                className="text-[#131313] underline transition-opacity hover:opacity-70"
              >
                Politique de confidentialit&eacute;
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="6. Contact">
            <p>
              Pour toute question concernant le site ou les pr&eacute;sentes
              mentions l&eacute;gales, vous pouvez nous &eacute;crire &agrave; :{" "}
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
