import { CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../../components/public/Seo";

export default function RegistrationSuccessPage() {
  const location = useLocation();
  const partnerType = location.state?.partnerType || "partner";

  return (
    <section className="site-shell py-16">
      <Seo
        title="Registration Submitted | NiviDoc"
        description="Your business registration was submitted successfully. Our admin team will review your profile and notify you after approval."
      />

      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-soft">
        <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
          Registration Submitted
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Your {partnerType} onboarding request is now in admin review. You will
          receive an email once your account is approved.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/login" className="site-btn-primary">
            Go to Partner Login
          </Link>
          <Link to="/" className="site-btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
