import { Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { isRoleAuthenticated, loginAdmin } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isRoleAuthenticated("admin")) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    const result = await loginAdmin(email, password);
    setLoading(false);
    if (result.status === "success") {
      navigate("/admin", { replace: true });
      return;
    }
    setError(result.error || "Invalid credentials");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="w-20 h-20 rounded-[20px] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-200 mb-2 transform hover:rotate-6 transition-transform">
          <Stethoscope size={40} className="text-white" />
        </div>
        <h2 className="text-center text-4xl font-black tracking-tight text-slate-900">
          NiviDoc
        </h2>
        <p className="mt-2 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
          Administrator Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-xl shadow-slate-200/50 sm:rounded-[16px] border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <Input
              label="Email address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nividoc.com"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              className="w-full py-3 text-base"
              disabled={loading}
            >
              Sign in to Dashboard
            </Button>

            {error ? (
              <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="text-center">
              <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                Use a valid admin account
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
