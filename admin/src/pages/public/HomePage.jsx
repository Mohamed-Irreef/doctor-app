import {
    ArrowRight,
    FlaskConical,
    Pill,
    ShieldCheck,
    Stethoscope,
    Video,
} from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../../components/public/Seo";

const services = [
  {
    title: "Doctor Discovery & Booking",
    description:
      "Find verified doctors, compare profiles, and book in minutes.",
    icon: Stethoscope,
  },
  {
    title: "Diagnostics & Lab Booking",
    description:
      "Access trusted labs with transparent pricing and quick reports.",
    icon: FlaskConical,
  },
  {
    title: "Pharmacy Commerce",
    description: "Order approved medicines with inventory-backed availability.",
    icon: Pill,
  },
  {
    title: "Video Consultation",
    description: "Secure online consultation designed for care continuity.",
    icon: Video,
  },
];

export default function HomePage() {
  return (
    <>
      <Seo
        title="NiviDoc | Full-Stack Healthcare Platform"
        description="NiviDoc is a modern healthcare ecosystem connecting patients, labs, pharmacies, and doctors with secure approvals and trusted workflows."
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.24),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(20,184,166,0.24),transparent_30%)]" />
        <div className="site-shell relative grid gap-8 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
              <ShieldCheck size={14} /> Enterprise-grade healthcare trust
            </span>
            <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
              A modern healthcare network where trust is built into every
              action.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              NiviDoc connects consultations, diagnostics, and pharmacy
              operations through approval-first workflows. Patients discover
              only validated partners. Partners grow with operational clarity
              and secure payouts.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="site-btn-primary inline-flex items-center gap-2"
              >
                Register Your Business <ArrowRight size={16} />
              </Link>
              <Link to="/services" className="site-btn-secondary">
                Explore Services
              </Link>
            </div>
          </div>

          <div className="gradient-panel grid gap-4 rounded-3xl p-5">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-600">
                Operational Coverage
              </p>
              <p className="mt-1 text-3xl font-extrabold text-blue-700">
                Doctor + Lab + Pharmacy
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Unified approvals and compliance-ready workflows.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-700">
                  Approval Engine
                </p>
                <p className="mt-1 text-2xl font-extrabold text-blue-900">
                  100%
                </p>
                <p className="text-xs text-blue-700">admin-reviewed listings</p>
              </div>
              <div className="rounded-2xl bg-teal-50 p-4">
                <p className="text-xs font-semibold text-teal-700">
                  Revenue Logic
                </p>
                <p className="mt-1 text-2xl font-extrabold text-teal-900">
                  20/80
                </p>
                <p className="text-xs text-teal-700">
                  platform and partner split
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-shell py-14">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Core Healthcare Services
          </h2>
          <p className="text-sm text-slate-500">
            Designed for patient trust and business growth
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5"
            >
              <div className="mb-3 inline-flex rounded-xl bg-blue-50 p-3 text-blue-700">
                <item.icon size={20} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-shell pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-cyan-700 via-blue-700 to-teal-600 p-8 text-white">
          <h3 className="text-2xl font-extrabold">
            Launch your healthcare business with platform-grade reliability.
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-blue-100">
            Onboard as a Lab or Pharmacy partner through a secure verification
            process and start serving patients with compliant digital workflows.
          </p>
          <Link
            to="/register"
            className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700"
          >
            Start Business Registration
          </Link>
        </div>
      </section>
    </>
  );
}
