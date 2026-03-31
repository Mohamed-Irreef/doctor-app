import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/Toast";
import Seo from "../../components/public/Seo";
import {
    registerLabBusiness,
    registerPharmacyBusiness,
    uploadPublicFile,
} from "../../services/api";

const initialLocation = { latitude: 12.9716, longitude: 77.5946 };

const totalSteps = 4;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function validateLab(data) {
  const errors = [];
  if (!data.fullName?.trim()) errors.push("Full Name is required");
  if (!/.+@.+\..+/.test(data.email || ""))
    errors.push("Valid email is required");
  if (!data.phone || data.phone.length < 8)
    errors.push("Valid phone is required");
  if (!data.password || data.password.length < 6)
    errors.push("Password must be at least 6 characters");
  if (!data.labName?.trim()) errors.push("Lab name is required");
  if (!data.registrationNumber?.trim())
    errors.push("Registration number is required");
  if (!data.address?.trim()) errors.push("Address is required");
  if (!data.city?.trim() || !data.state?.trim() || !data.pincode?.trim())
    errors.push("Complete address details are required");
  if (!data.termsAccepted || !data.declarationAccepted)
    errors.push("Terms and declaration must be accepted");
  return errors;
}

function validatePharmacy(data) {
  const errors = [];
  if (!data.fullName?.trim()) errors.push("Name is required");
  if (!/.+@.+\..+/.test(data.email || ""))
    errors.push("Valid email is required");
  if (!data.phone || data.phone.length < 8)
    errors.push("Valid phone is required");
  if (!data.password || data.password.length < 6)
    errors.push("Password must be at least 6 characters");
  if (!data.pharmacyName?.trim()) errors.push("Pharmacy name is required");
  if (!data.licenseNumber?.trim()) errors.push("License number is required");
  if (!data.gstNumber?.trim()) errors.push("GST number is required");
  if (!data.address?.trim()) errors.push("Address is required");
  if (!data.termsAccepted || !data.declarationAccepted)
    errors.push("Terms and declaration must be accepted");
  return errors;
}

async function uploadDoc(file, folder, label) {
  if (!file) return null;

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`${label} is too large. Maximum allowed size is 10 MB.`);
  }

  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    throw new Error(
      `${label} has unsupported format. Allowed formats: PDF, JPEG, PNG, WEBP.`,
    );
  }

  const uploaded = await uploadPublicFile(file, folder);
  if (uploaded.status === "error") {
    throw new Error(uploaded.error);
  }
  return {
    name: file.name,
    url: uploaded.data?.url,
    mimeType: file.type,
  };
}

function StepIndicator({ step }) {
  return (
    <div className="mb-6 grid grid-cols-4 gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const active = step === i + 1;
        const done = step > i + 1;
        return (
          <div
            key={i}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? "bg-teal-600 text-white"
                  : active
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-xs font-semibold ${active ? "text-blue-700" : "text-slate-500"}`}
            >
              {i === 0
                ? "Account"
                : i === 1
                  ? "Business"
                  : i === 2
                    ? "Documents"
                    : "Review"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DocInput({ label, onChange, required = false }) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
        required={required}
      />
    </label>
  );
}

export default function BusinessRegistrationPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("lab");
  const [labStep, setLabStep] = useState(1);
  const [pharmacyStep, setPharmacyStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  const [lab, setLab] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    profilePhoto: "",
    labName: "",
    labType: "diagnostic",
    registrationNumber: "",
    yearsOfExperience: 1,
    availableTests: "CBC, Lipid Profile",
    address: "",
    city: "",
    state: "",
    pincode: "",
    location: initialLocation,
    supportPhone: "",
    supportEmail: "",
    termsAccepted: false,
    declarationAccepted: false,
  });

  const [pharmacy, setPharmacy] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    profilePhoto: "",
    pharmacyName: "",
    licenseNumber: "",
    gstNumber: "",
    yearsOfExperience: 1,
    address: "",
    city: "",
    state: "",
    pincode: "",
    location: initialLocation,
    supportPhone: "",
    supportEmail: "",
    termsAccepted: false,
    declarationAccepted: false,
  });

  const [files, setFiles] = useState({
    labProfilePhoto: null,
    governmentLicense: null,
    labCertification: null,
    labOwnerIdProof: null,
    labAddressProof: null,
    pharmacyProfilePhoto: null,
    drugLicense: null,
    gstCertificate: null,
    pharmacyOwnerIdProof: null,
  });

  const tabClasses = (key) =>
    `rounded-xl px-4 py-2 text-sm font-bold transition ${
      tab === key ? "bg-blue-600 text-white" : "bg-white text-slate-600"
    }`;

  const activeStep = tab === "lab" ? labStep : pharmacyStep;

  const coords = useMemo(() => {
    const source = tab === "lab" ? lab.location : pharmacy.location;
    return `${source.latitude}, ${source.longitude}`;
  }, [tab, lab.location, pharmacy.location]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const next = {
        latitude: Number(pos.coords.latitude.toFixed(6)),
        longitude: Number(pos.coords.longitude.toFixed(6)),
      };
      if (tab === "lab") setLab((prev) => ({ ...prev, location: next }));
      else setPharmacy((prev) => ({ ...prev, location: next }));
    });
  };

  const nextStep = () => {
    if (tab === "lab") setLabStep((s) => Math.min(totalSteps, s + 1));
    else setPharmacyStep((s) => Math.min(totalSteps, s + 1));
  };

  const prevStep = () => {
    if (tab === "lab") setLabStep((s) => Math.max(1, s - 1));
    else setPharmacyStep((s) => Math.max(1, s - 1));
  };

  const submitLab = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "info" });

    const issues = validateLab(lab);
    if (issues.length) {
      setToast({ message: issues[0], type: "error" });
      return;
    }

    setLoading(true);
    try {
      const profile = await uploadDoc(
        files.labProfilePhoto,
        "nividoc/labs/profile",
        "Profile Photo",
      );
      const governmentLicense = await uploadDoc(
        files.governmentLicense,
        "nividoc/labs/docs",
        "Government License",
      );
      const labCertification = await uploadDoc(
        files.labCertification,
        "nividoc/labs/docs",
        "Lab Certification",
      );
      const ownerIdProof = await uploadDoc(
        files.labOwnerIdProof,
        "nividoc/labs/docs",
        "Owner ID Proof",
      );
      const addressProof = await uploadDoc(
        files.labAddressProof,
        "nividoc/labs/docs",
        "Address Proof",
      );

      const payload = {
        ...lab,
        profilePhoto: profile?.url || "",
        availableTests: lab.availableTests
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        governmentLicense,
        labCertification,
        ownerIdProof,
        addressProof,
      };

      const res = await registerLabBusiness(payload);
      if (res.status === "error") throw new Error(res.error);
      setToast({
        message: "Lab registration submitted successfully.",
        type: "success",
      });
      setLabStep(1);
      navigate("/register/success", { state: { partnerType: "lab" } });
    } catch (err) {
      setToast({ message: err.message || "Submission failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const submitPharmacy = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "info" });

    const issues = validatePharmacy(pharmacy);
    if (issues.length) {
      setToast({ message: issues[0], type: "error" });
      return;
    }

    setLoading(true);
    try {
      const profile = await uploadDoc(
        files.pharmacyProfilePhoto,
        "nividoc/pharmacy/profile",
        "Profile Photo",
      );
      const drugLicense = await uploadDoc(
        files.drugLicense,
        "nividoc/pharmacy/docs",
        "Drug License",
      );
      const gstCertificate = await uploadDoc(
        files.gstCertificate,
        "nividoc/pharmacy/docs",
        "GST Certificate",
      );
      const ownerIdProof = await uploadDoc(
        files.pharmacyOwnerIdProof,
        "nividoc/pharmacy/docs",
        "Owner ID Proof",
      );

      const payload = {
        ...pharmacy,
        profilePhoto: profile?.url || "",
        drugLicense,
        gstCertificate,
        ownerIdProof,
      };

      const res = await registerPharmacyBusiness(payload);
      if (res.status === "error") throw new Error(res.error);
      setToast({
        message: "Pharmacy registration submitted successfully.",
        type: "success",
      });
      setPharmacyStep(1);
      navigate("/register/success", { state: { partnerType: "pharmacy" } });
    } catch (err) {
      setToast({ message: err.message || "Submission failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="site-shell py-16">
      <Seo
        title="Business Registration | NiviDoc"
        description="Register your lab or pharmacy on NiviDoc with complete KYC and approval workflow."
      />

      <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-600 p-8 text-white">
        <h1 className="text-3xl font-extrabold">Business Registration</h1>
        <p className="mt-2 text-sm text-blue-100">
          Complete all onboarding steps. Accounts are activated only after admin
          review and approval.
        </p>
      </div>

      <div className="mb-5 inline-flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <button
          className={tabClasses("lab")}
          onClick={() => setTab("lab")}
          type="button"
        >
          Lab Admin Signup
        </button>
        <button
          className={tabClasses("pharmacy")}
          onClick={() => setTab("pharmacy")}
          type="button"
        >
          Pharmacy Admin Signup
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>Current location: {coords}</span>
        <button
          className="rounded-lg border border-slate-300 px-2 py-1 font-semibold text-slate-700"
          onClick={handleUseLocation}
          type="button"
        >
          Use my location
        </button>
      </div>

      <StepIndicator step={activeStep} />

      {tab === "lab" ? (
        <form onSubmit={submitLab} className="site-card grid gap-6 p-6">
          {labStep === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Full Name"
                value={lab.fullName}
                onChange={(e) => setLab({ ...lab, fullName: e.target.value })}
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="email"
                placeholder="Email"
                value={lab.email}
                onChange={(e) => setLab({ ...lab, email: e.target.value })}
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Phone"
                value={lab.phone}
                onChange={(e) => setLab({ ...lab, phone: e.target.value })}
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="password"
                placeholder="Password"
                value={lab.password}
                onChange={(e) => setLab({ ...lab, password: e.target.value })}
                required
              />
            </div>
          )}

          {labStep === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Lab Name"
                value={lab.labName}
                onChange={(e) => setLab({ ...lab, labName: e.target.value })}
                required
              />
              <select
                className="rounded-xl border px-3 py-2"
                value={lab.labType}
                onChange={(e) => setLab({ ...lab, labType: e.target.value })}
              >
                <option value="diagnostic">Diagnostic</option>
                <option value="pathology">Pathology</option>
              </select>
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Registration Number"
                value={lab.registrationNumber}
                onChange={(e) =>
                  setLab({ ...lab, registrationNumber: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="number"
                placeholder="Years of Experience"
                value={lab.yearsOfExperience}
                onChange={(e) =>
                  setLab({ ...lab, yearsOfExperience: Number(e.target.value) })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2 md:col-span-2"
                placeholder="Available Tests (comma separated)"
                value={lab.availableTests}
                onChange={(e) =>
                  setLab({ ...lab, availableTests: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2 md:col-span-2"
                placeholder="Full Address"
                value={lab.address}
                onChange={(e) => setLab({ ...lab, address: e.target.value })}
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="City"
                value={lab.city}
                onChange={(e) => setLab({ ...lab, city: e.target.value })}
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="State"
                value={lab.state}
                onChange={(e) => setLab({ ...lab, state: e.target.value })}
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Pincode"
                value={lab.pincode}
                onChange={(e) => setLab({ ...lab, pincode: e.target.value })}
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Support Phone"
                value={lab.supportPhone}
                onChange={(e) =>
                  setLab({ ...lab, supportPhone: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="email"
                placeholder="Support Email"
                value={lab.supportEmail}
                onChange={(e) =>
                  setLab({ ...lab, supportEmail: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={lab.location.latitude}
                onChange={(e) =>
                  setLab({
                    ...lab,
                    location: {
                      ...lab.location,
                      latitude: Number(e.target.value),
                    },
                  })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="number"
                step="0.000001"
                placeholder="Longitude"
                value={lab.location.longitude}
                onChange={(e) =>
                  setLab({
                    ...lab,
                    location: {
                      ...lab.location,
                      longitude: Number(e.target.value),
                    },
                  })
                }
                required
              />
            </div>
          )}

          {labStep === 3 && (
            <div className="grid gap-3 md:grid-cols-2">
              <DocInput
                label="Profile Photo"
                onChange={(file) =>
                  setFiles({ ...files, labProfilePhoto: file })
                }
              />
              <DocInput
                label="Government License"
                required
                onChange={(file) =>
                  setFiles({ ...files, governmentLicense: file })
                }
              />
              <DocInput
                label="Lab Certification"
                required
                onChange={(file) =>
                  setFiles({ ...files, labCertification: file })
                }
              />
              <DocInput
                label="Owner ID Proof"
                required
                onChange={(file) =>
                  setFiles({ ...files, labOwnerIdProof: file })
                }
              />
              <DocInput
                label="Address Proof"
                required
                onChange={(file) =>
                  setFiles({ ...files, labAddressProof: file })
                }
              />
            </div>
          )}

          {labStep === 4 && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <span className="font-bold">Applicant:</span>{" "}
                {lab.fullName || "-"}
              </p>
              <p>
                <span className="font-bold">Lab:</span> {lab.labName || "-"}
              </p>
              <p>
                <span className="font-bold">Registration Number:</span>{" "}
                {lab.registrationNumber || "-"}
              </p>
              <p>
                <span className="font-bold">Support:</span>{" "}
                {lab.supportPhone || "-"} / {lab.supportEmail || "-"}
              </p>
              <label className="block text-sm">
                <input
                  type="checkbox"
                  checked={lab.termsAccepted}
                  onChange={(e) =>
                    setLab({ ...lab, termsAccepted: e.target.checked })
                  }
                  className="mr-2"
                />
                I agree to Terms
              </label>
              <label className="block text-sm">
                <input
                  type="checkbox"
                  checked={lab.declarationAccepted}
                  onChange={(e) =>
                    setLab({ ...lab, declarationAccepted: e.target.checked })
                  }
                  className="mr-2"
                />
                I declare all details are accurate
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {labStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="site-btn-secondary"
              >
                Back
              </button>
            )}
            {labStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="site-btn-primary"
              >
                Continue
              </button>
            ) : (
              <button
                disabled={loading}
                className="site-btn-primary disabled:opacity-70"
              >
                {loading ? "Submitting..." : "Submit Lab Registration"}
              </button>
            )}
          </div>
        </form>
      ) : (
        <form onSubmit={submitPharmacy} className="site-card grid gap-6 p-6">
          {pharmacyStep === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Full Name"
                value={pharmacy.fullName}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, fullName: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="email"
                placeholder="Email"
                value={pharmacy.email}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, email: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Phone"
                value={pharmacy.phone}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, phone: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="password"
                placeholder="Password"
                value={pharmacy.password}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, password: e.target.value })
                }
                required
              />
            </div>
          )}

          {pharmacyStep === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Pharmacy Name"
                value={pharmacy.pharmacyName}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, pharmacyName: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="License Number"
                value={pharmacy.licenseNumber}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, licenseNumber: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="GST Number"
                value={pharmacy.gstNumber}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, gstNumber: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="number"
                placeholder="Years of Experience"
                value={pharmacy.yearsOfExperience}
                onChange={(e) =>
                  setPharmacy({
                    ...pharmacy,
                    yearsOfExperience: Number(e.target.value),
                  })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2 md:col-span-2"
                placeholder="Full Address"
                value={pharmacy.address}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, address: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="City"
                value={pharmacy.city}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, city: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="State"
                value={pharmacy.state}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, state: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Pincode"
                value={pharmacy.pincode}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, pincode: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="Support Phone"
                value={pharmacy.supportPhone}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, supportPhone: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="email"
                placeholder="Support Email"
                value={pharmacy.supportEmail}
                onChange={(e) =>
                  setPharmacy({ ...pharmacy, supportEmail: e.target.value })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="number"
                step="0.000001"
                placeholder="Latitude"
                value={pharmacy.location.latitude}
                onChange={(e) =>
                  setPharmacy({
                    ...pharmacy,
                    location: {
                      ...pharmacy.location,
                      latitude: Number(e.target.value),
                    },
                  })
                }
                required
              />
              <input
                className="rounded-xl border px-3 py-2"
                type="number"
                step="0.000001"
                placeholder="Longitude"
                value={pharmacy.location.longitude}
                onChange={(e) =>
                  setPharmacy({
                    ...pharmacy,
                    location: {
                      ...pharmacy.location,
                      longitude: Number(e.target.value),
                    },
                  })
                }
                required
              />
            </div>
          )}

          {pharmacyStep === 3 && (
            <div className="grid gap-3 md:grid-cols-2">
              <DocInput
                label="Profile Photo"
                onChange={(file) =>
                  setFiles({ ...files, pharmacyProfilePhoto: file })
                }
              />
              <DocInput
                label="Drug License"
                required
                onChange={(file) => setFiles({ ...files, drugLicense: file })}
              />
              <DocInput
                label="GST Certificate"
                required
                onChange={(file) =>
                  setFiles({ ...files, gstCertificate: file })
                }
              />
              <DocInput
                label="Owner ID Proof"
                required
                onChange={(file) =>
                  setFiles({ ...files, pharmacyOwnerIdProof: file })
                }
              />
            </div>
          )}

          {pharmacyStep === 4 && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <span className="font-bold">Applicant:</span>{" "}
                {pharmacy.fullName || "-"}
              </p>
              <p>
                <span className="font-bold">Pharmacy:</span>{" "}
                {pharmacy.pharmacyName || "-"}
              </p>
              <p>
                <span className="font-bold">License Number:</span>{" "}
                {pharmacy.licenseNumber || "-"}
              </p>
              <p>
                <span className="font-bold">Support:</span>{" "}
                {pharmacy.supportPhone || "-"} / {pharmacy.supportEmail || "-"}
              </p>
              <label className="block text-sm">
                <input
                  type="checkbox"
                  checked={pharmacy.termsAccepted}
                  onChange={(e) =>
                    setPharmacy({
                      ...pharmacy,
                      termsAccepted: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                I agree to Terms
              </label>
              <label className="block text-sm">
                <input
                  type="checkbox"
                  checked={pharmacy.declarationAccepted}
                  onChange={(e) =>
                    setPharmacy({
                      ...pharmacy,
                      declarationAccepted: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                I declare all details are accurate
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {pharmacyStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="site-btn-secondary"
              >
                Back
              </button>
            )}
            {pharmacyStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="site-btn-primary"
              >
                Continue
              </button>
            ) : (
              <button
                disabled={loading}
                className="site-btn-primary disabled:opacity-70"
              >
                {loading ? "Submitting..." : "Submit Pharmacy Registration"}
              </button>
            )}
          </div>
        </form>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </section>
  );
}
