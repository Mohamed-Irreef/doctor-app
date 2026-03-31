import Seo from "../../components/public/Seo";

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Seo
        title="Privacy Policy | NiviDoc"
        description="NiviDoc privacy practices for users and business partners."
      />
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          NiviDoc stores and processes user, partner, and transaction data only
          for healthcare service delivery, platform security, and regulatory
          compliance. Uploaded KYC and license documents are used strictly for
          verification workflows and are access-controlled.
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          We implement role-based access, authentication controls, and encrypted
          transport. Payment data is handled through authorized providers such
          as Razorpay.
        </p>
      </div>
    </section>
  );
}
