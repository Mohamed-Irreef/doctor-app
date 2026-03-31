import { useState } from "react";
import Seo from "../../components/public/Seo";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="site-shell py-16">
      <Seo
        title="Contact NiviDoc"
        description="Contact NiviDoc team for partnerships, support, and platform onboarding help."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="gradient-panel rounded-3xl p-7">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Talk to the NiviDoc Team
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Need onboarding help or enterprise rollout support? We help clinics,
            labs, and pharmacy teams deploy secure digital workflows.
          </p>
          <div className="mt-6 space-y-2 text-sm text-slate-700">
            <p>Support Email: support@nividoc.com</p>
            <p>Support Phone: +91 98765 43210</p>
            <p>Address: Bengaluru, India</p>
          </div>
        </div>

        <form
          className="site-card p-7"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="grid gap-4">
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Full Name"
              required
            />
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              type="email"
              placeholder="Email"
              required
            />
            <input
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Subject"
              required
            />
            <textarea
              className="min-h-28 rounded-xl border border-slate-300 px-3 py-2 text-sm"
              placeholder="Message"
              required
            />
            <button className="site-btn-primary">Send Message</button>
            {submitted && (
              <p className="text-xs font-semibold text-teal-700">
                Thanks. We will contact you shortly.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
