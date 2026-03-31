import Seo from "../../components/public/Seo";

const steps = [
  {
    title: "1. Register & Verify",
    description:
      "Labs and pharmacies submit complete documents for admin compliance review.",
  },
  {
    title: "2. Admin Approval",
    description:
      "Central admin approves or rejects onboarding and every submitted listing.",
  },
  {
    title: "3. Patient Visibility",
    description:
      "Only approved tests and products become discoverable by patients.",
  },
  {
    title: "4. Booking, Orders & Payments",
    description:
      "Patients complete purchases through secure payment flow with split accounting.",
  },
];

export default function HowItWorksPage() {
  return (
    <section className="site-shell py-16">
      <Seo
        title="How NiviDoc Works"
        description="Understand NiviDoc workflow: business registration, admin approvals, approved listing visibility, and patient transactions."
      />
      <h1 className="text-4xl font-extrabold text-slate-900">How It Works</h1>
      <p className="mt-3 max-w-3xl text-base text-slate-600">
        A compliance-focused flow that keeps patients safe and partner
        operations scalable.
      </p>

      <div className="mt-10 space-y-4">
        {steps.map((step, idx) => (
          <article
            key={step.title}
            className="site-card p-5"
            style={{ animationDelay: `${idx * 90}ms` }}
          >
            <h2 className="text-lg font-extrabold text-blue-700">
              {step.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
