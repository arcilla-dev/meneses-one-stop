"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import { OFFICES, type Office } from "@/lib/adminHome";

const OFFICE_LABELS: Record<Office, string> = {
  registrar: "Registrar",
  infirmary: "Infirmary",
  scholarship: "Scholarship",
  lsc: "LSC",
};

const serif = { fontFamily: "Georgia, serif" } as const;

const inputClass =
  "w-full rounded-md border border-[#d9a9c9] bg-white/80 py-2.5 pl-10 pr-3 text-sm text-[#39265f] outline-none " +
  "transition placeholder:text-[#6d5b7a]/60 focus:border-[#6d5b7a] focus:bg-white focus:ring-2 focus:ring-[#6d5b7a]/20";

function Field({
  label,
  htmlFor,
  icon: Icon,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: React.ElementType;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-bold uppercase tracking-wider text-[#443760]">
        {label}
        {optional && <span className="ml-1 font-normal normal-case tracking-normal text-[#6d5b7a]">(optional)</span>}
      </label>
      <div className="relative">
        <Icon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6d5b7a]" />
        {children}
      </div>
    </div>
  );
}

export default function CreateAdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [office, setOffice] = useState<Office | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // UI only
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCreateAdmin = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage({ type: "error", text: "Email and password are required." });
      return;
    }
    if (!office) {
      setMessage({ type: "error", text: "Choose an office." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, office }),
      });

      const result = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: result.error ?? "Failed to create admin." });
        return;
      }

      setMessage({ type: "success", text: `Admin account created for ${email}.` });
      setEmail("");
      setPassword("");
      setFullName("");
      setOffice("");
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#FEEAEE] p-4 md:p-6 lg:p-8">
      {/* m-auto centers the block horizontally and vertically (and still scrolls on short screens) */}
      <div className="m-auto w-full max-w-xl">
      {/* Page heading */}
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#d9a9c9]/70 bg-gradient-to-br from-[#5E4D7C] to-[#4E3D6B] shadow-md">
          <UserPlus size={26} className="text-[#F8C8E2]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#352542] md:text-3xl" style={serif}>
            Create Admin Account
          </h1>
          <p className="text-sm text-[#543b59]" style={serif}>
            Only superadmins can create new admin accounts.
          </p>
        </div>
      </div>

      {/* Card */}
      <section className="w-full overflow-hidden rounded-xl border border-[#d9a9c9]/60 shadow-md">
        <div className="bg-[linear-gradient(135deg,#5E4D7C_0%,#4E3D6B_100%)] px-5 py-4 md:px-6">
          <h2 className="text-lg font-bold text-white md:text-xl" style={serif}>
            Account Details
          </h2>
          <p className="text-xs text-white/70" style={serif}>
            The new admin signs in with this email and password and is assigned to the office you pick.
          </p>
        </div>

        <div className="flex flex-col gap-5 bg-[linear-gradient(180deg,#F5DCEC_0%,#E8C4DC_100%)] p-5 md:p-6">
          <Field label="Full Name" htmlFor="admin-full-name" icon={User} optional>
            <input
              id="admin-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Juan M. Dela Cruz"
              className={inputClass}
            />
          </Field>

          <Field label="Email" htmlFor="admin-email" icon={Mail}>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@meneses.edu"
              className={inputClass}
            />
          </Field>

          <Field label="Password" htmlFor="admin-password" icon={Lock}>
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 12 characters"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#6d5b7a] transition hover:bg-[#d9a9c9]/30 hover:text-[#443760]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </Field>

          <Field label="Office" htmlFor="admin-office" icon={Building2}>
            <select
              id="admin-office"
              value={office}
              onChange={(e) => setOffice(e.target.value as Office | "")}
              className={`${inputClass} cursor-pointer appearance-none pr-10 ${office ? "" : "text-[#6d5b7a]/60"}`}
            >
              <option value="">Select an office</option>
              {OFFICES.map((o) => (
                <option key={o} value={o} className="text-[#39265f]">
                  {OFFICE_LABELS[o]}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6d5b7a]"
            />
          </Field>

          {message && (
            <p
              role={message.type === "error" ? "alert" : "status"}
              className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
                message.type === "success"
                  ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                  : "border-rose-300 bg-rose-100 text-rose-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
              )}
              {message.text}
            </p>
          )}

          <button
            type="button"
            onClick={handleCreateAdmin}
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#443760] font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            style={serif}
          >
            <UserPlus size={18} />
            {isSubmitting ? "Creating..." : "Create Admin"}
          </button>
        </div>
      </section>
      </div>
    </div>
  );
}
