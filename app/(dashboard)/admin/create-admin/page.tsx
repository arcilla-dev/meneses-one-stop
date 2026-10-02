"use client";

import { useState } from "react";

export default function CreateAdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCreateAdmin = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage({ type: "error", text: "Email and password are required." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
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
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#fcdced]">
      <h1 className="text-2xl font-black text-[#352542] mb-2">Create Admin Account</h1>
      <p className="text-sm text-[#543b59] mb-6">
        Only superadmins can create new admin accounts.
      </p>

      <div className="max-w-md flex flex-col gap-4 bg-white/60 rounded-xl p-6 shadow-md">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[#352542] uppercase tracking-wide">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Juan M. Dela Cruz"
            className="rounded-md border border-[#C48AB2] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#443760]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[#352542] uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@meneses.edu"
            className="rounded-md border border-[#C48AB2] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#443760]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[#352542] uppercase tracking-wide">
            Temporary Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 12 characters"
            className="rounded-md border border-[#C48AB2] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#443760]"
          />
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-[#00BF15]" : "text-[#671410]"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          onClick={handleCreateAdmin}
          disabled={isSubmitting}
          className="h-11 rounded-[10px] bg-[#443760] text-white font-bold hover:brightness-110 transition disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create Admin"}
        </button>
      </div>
    </div>
  );
}