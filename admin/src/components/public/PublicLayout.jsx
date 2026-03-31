import { Globe, Mail, Menu, Phone, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/contact", label: "Contact" },
  { to: "/register", label: "Register" },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-main text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="site-shell flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 p-2.5 text-white">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-blue-700">NiviDoc</p>
              <p className="text-xs font-semibold text-slate-500">
                Trusted Healthcare Platform
              </p>
            </div>
          </Link>

          <button
            className="rounded-lg border border-slate-300 p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>

          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-bold text-slate-600 transition hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/register" className="site-btn-secondary">
              Register Business
            </Link>
            <Link to="/login" className="site-btn-primary">
              Partner Login
            </Link>
          </nav>
        </div>

        {open && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <div className="site-shell py-3">
              <div className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-slate-700"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="site-btn-secondary"
                >
                  Register Business
                </Link>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="site-btn-primary"
                >
                  Partner Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="section-fade">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="site-shell py-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-3">
              <p className="text-lg font-extrabold text-slate-900">NiviDoc</p>
              <p className="text-sm text-slate-600">
                A secure healthcare platform connecting doctors, labs,
                pharmacies, and patients.
              </p>
              <div className="flex items-center gap-2 text-slate-500">
                <a
                  href="#"
                  className="rounded-lg border border-slate-200 p-2 hover:text-blue-700"
                >
                  <Globe size={16} />
                </a>
                <a
                  href="#"
                  className="rounded-lg border border-slate-200 p-2 hover:text-blue-700"
                >
                  <Mail size={16} />
                </a>
                <a
                  href="#"
                  className="rounded-lg border border-slate-200 p-2 hover:text-blue-700"
                >
                  <Phone size={16} />
                </a>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-extrabold text-slate-900">
                Quick Links
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="hover:text-blue-700"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-extrabold text-slate-900">
                Legal
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <Link to="/privacy-policy" className="hover:text-blue-700">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-blue-700">
                  Terms & Conditions
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
            © {new Date().getFullYear()} NiviDoc. Hospital-grade trust, digital
            speed.
          </div>
        </div>
      </footer>
    </div>
  );
}
