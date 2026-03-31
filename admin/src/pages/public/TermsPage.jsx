import Seo from "../../components/public/Seo";

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Seo
        title="Terms & Conditions | NiviDoc"
        description="NiviDoc terms for patients, labs, pharmacies, and platform access."
      />
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Terms & Conditions
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          By using NiviDoc, you agree to provide accurate information and comply
          with healthcare and e-commerce regulations applicable to your role.
          Business partners are responsible for valid licenses, stock quality,
          and lawful operations.
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          NiviDoc reserves the right to suspend accounts, reject listings, or
          take moderation actions if content violates legal, clinical, or
          platform safety standards.
        </p>
      </div>
    </section>
  );
}
