"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Dela_Gothic_One } from "next/font/google";

const delaGothicOne = Dela_Gothic_One({ weight: "400", subsets: ["latin"] });
const supabase = createClient();

const MIN_LENGTH = 12;

interface Props {
  open: boolean;
  email: string; // the signed-in user's email, used to check the old password
  onClose: () => void;
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="block text-left">
      <span className="text-sm font-bold text-[#443760]">{label}</span>
      <div className="relative mt-1">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className="w-full rounded-lg border border-[#c48ab2] bg-white/80 px-3 py-2 pr-10 text-[#39265f] focus:outline-none focus:ring-2 focus:ring-[#9b51e0]"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6d5b7a] hover:text-[#39265f]"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

export default function ChangePasswordModal({ open, email, onClose }: Props) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirm("");
    setError(null);
    setDone(false);
    setSaving(false);
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  // Escape closes the modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        reset();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, saving]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!oldPassword) return setError("Enter your current password.");
    if (newPassword.length < MIN_LENGTH)
      return setError(`New password must be at least ${MIN_LENGTH} characters.`);
    if (newPassword === oldPassword)
      return setError("New password must be different from your current one.");
    if (newPassword !== confirm) return setError("New passwords do not match.");

    setSaving(true);
    setError(null);

    // 1. Prove the old password is right by signing in with it.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword,
    });
    if (verifyError) {
      setSaving(false);
      return setError("Your current password is incorrect.");
    }

    // 2. Only then change it.
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (updateError) return setError(updateError.message);

    setDone(true);
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border-[3px] border-[#d9a9c9] bg-[linear-gradient(135deg,#F6DAEF_0%,#E5B8D9_100%)] p-6 shadow-2xl"
      >
        <h2
          id="change-password-title"
          className={`${delaGothicOne.className} text-center text-2xl text-[#443760]`}
        >
          Change Password
        </h2>

        {done ? (
          <>
            <p className="mt-4 text-center font-['Times_New_Roman'] text-lg text-[#443760]">
              Your password was updated.
            </p>
            <button
              type="button"
              autoFocus
              onClick={close}
              className="mt-6 w-full rounded-[10px] bg-[#443760] py-2 font-['Times_New_Roman'] text-lg font-bold text-white transition hover:brightness-110"
            >
              Done
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <PasswordField
              label="Current password"
              value={oldPassword}
              onChange={setOldPassword}
              autoComplete="current-password"
              autoFocus
            />
            <PasswordField
              label={`New password (min ${MIN_LENGTH} characters)`}
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />
            <PasswordField
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
            />

            {error && (
              <p role="alert" className="rounded-lg bg-[#ff2d2d] px-3 py-2 text-sm font-bold text-white">
                {error}
              </p>
            )}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={close}
                disabled={saving}
                className="flex-1 rounded-[10px] bg-[#d3bbcc] py-2 font-['Times_New_Roman'] text-lg font-bold text-[#443760] shadow-sm transition hover:brightness-95 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-[10px] bg-[#443760] py-2 font-['Times_New_Roman'] text-lg font-bold text-white shadow-[4px_4px_0px_0px_rgba(68,55,96,0.35)] transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}