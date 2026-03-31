import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/Toast";
import Seo from "../../components/public/Seo";
import { loginPortal } from "../../services/api";

const roleChoices = [
  { value: "lab_admin", label: "Lab Admin" },
  { value: "pharmacy_admin", label: "Pharmacy Admin" },
];

const routeByRole = {
  lab_admin: "/portal/lab",
  pharmacy_admin: "/portal/pharmacy",
};

export default function PortalAuthPage() {
  const [role, setRole] = useState("lab_admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "info" });
    setBusy(true);

    const res = await loginPortal(email, password, role);
    setBusy(false);

    if (res.status === "error") {
      const message = (res.error || "").toLowerCase();
      if (
        message.includes("pending") ||
        message.includes("approval") ||
        message.includes("not approved")
      ) {
        setToast({
          message:
            "Your registration is under review. Access will be enabled after admin approval.",
          type: "info",
        });
      } else {
        setToast({ message: res.error, type: "error" });
      }
      return;
    }

    navigate(routeByRole[role] || "/");
  };

  return (
    <section className="site-shell py-16">
      <Seo
        title="Partner Login | NiviDoc"
        description="Login for registered and approved lab/pharmacy partners."
      />
      <form onSubmit={onSubmit} className="mx-auto max-w-xl site-card p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Partner Login
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          For approved Lab Admin and Pharmacy Admin accounts only.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {roleChoices.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRole(item.value)}
              className={`rounded-lg px-3 py-2 text-sm font-bold ${
                role === item.value
                  ? "bg-white text-blue-700"
                  : "text-slate-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            disabled={busy}
            className="site-btn-primary w-full disabled:opacity-70"
          >
            {busy ? "Please wait..." : "Login"}
          </button>
          <p className="text-xs text-slate-500">
            Not registered yet? Complete business registration first.
          </p>
          <a href="/register" className="text-xs font-bold text-blue-700">
            Go to business registration
          </a>
        </div>
      </form>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </section>
  );
}
