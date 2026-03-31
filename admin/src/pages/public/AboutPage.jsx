import Seo from "../../components/public/Seo";

export default function AboutPage() {
  return (
    <section className="site-shell py-16">
      <Seo
        title="About NiviDoc | Healthcare Platform"
        description="Learn about NiviDoc mission, healthcare-first architecture, and approval-based trust model for labs and pharmacies."
      />
      <div className="gradient-panel rounded-3xl p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          About Us
        </p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900">
          Designed for healthcare teams that refuse operational chaos.
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-600">
          NiviDoc is a healthcare operating layer where consultations,
          diagnostics, pharmacy ordering, and records work together through
          strict role-based workflows. Every critical listing from labs and
          pharmacies passes admin moderation before it reaches patient
          interfaces.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-sm font-extrabold text-blue-900">
              Compliance First
            </p>
            <p className="mt-2 text-sm text-blue-700">
              Document-led onboarding and verification process.
            </p>
          </div>
          <div className="rounded-2xl bg-teal-50 p-4">
            <p className="text-sm font-extrabold text-teal-900">
              Approval Engine
            </p>
            <p className="mt-2 text-sm text-teal-700">
              Only approved items are visible in patient interfaces.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm font-extrabold text-slate-900">
              Scalable Design
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Modular architecture for growth across cities and partners.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
