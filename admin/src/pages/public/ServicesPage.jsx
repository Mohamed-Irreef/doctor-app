import { FlaskConical, Pill, Stethoscope, Video } from "lucide-react";
import Seo from "../../components/public/Seo";

const cards = [
  {
    title: "Doctors",
    copy: "Discover doctors, verify profiles, and consult with online/offline options.",
    icon: Stethoscope,
  },
  {
    title: "Lab",
    copy: "Browse approved lab tests, compare details, and complete payment-backed bookings.",
    icon: FlaskConical,
  },
  {
    title: "Pharmacy",
    copy: "Purchase approved medicines with transparent stock and order tracking.",
    icon: Pill,
  },
  {
    title: "Consultation",
    copy: "Video-first consultation flow with records-ready continuity of care.",
    icon: Video,
  },
];

export default function ServicesPage() {
  return (
    <section className="site-shell py-16">
      <Seo
        title="NiviDoc Services | Doctors, Labs, Pharmacy"
        description="Explore NiviDoc services: doctor consultations, approved lab tests, and pharmacy commerce built on healthcare workflows."
      />
      <h1 className="text-4xl font-extrabold text-slate-900">Services</h1>
      <p className="mt-3 max-w-3xl text-base text-slate-600">
        NiviDoc combines doctor, diagnostics, and pharmacy operations with
        centralized approvals and role-based controls designed for real
        production healthcare.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {cards.map((card, idx) => (
          <article
            key={card.title}
            className="site-card p-6"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="mb-4 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
              <card.icon size={22} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {card.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{card.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
