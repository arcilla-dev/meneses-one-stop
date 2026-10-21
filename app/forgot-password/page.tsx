"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import IdentifierInput from "../../components/IdentifierInput";
import FloatingPanel from "../../components/FloatingPanel";
import Toast from "../../components/Toast";
import { Dela_Gothic_One, Great_Vibes} from "next/font/google";

const greatVibes = Great_Vibes({  
  weight: "400",
  subsets: ["latin"],
});


const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});


const supabase = createClient();

const RESEND_SECONDS = 60;
const LOGIN_ROUTE = "/login"; // change to your actual login route

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");   // email or student number
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);            // swaps the form for the confirmation view
  const [cooldown, setCooldown] = useState(0);        // seconds until "Resend" is allowed again
  const [visible, setVisible] = useState(false);      // entrance animation
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(id);
  }, []);

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleSubmit = async () => {
    const value = identifier.trim();
    if (!value || loading || cooldown > 0) return;

    setLoading(true);

    let targetEmail = value;

    // Student number → email, same RPC the login page uses
    if (!value.includes("@")) {
      const { data: resolvedEmail, error: lookupError } = await supabase.rpc(
        "get_login_email",
        { p_student_number: value }
      );

      if (lookupError) console.error(lookupError.message);

      // Don't reveal whether the student number exists (prevents account probing).
      // Show the same confirmation screen either way.
      if (lookupError || !resolvedEmail) {
        setLoading(false);
        setSent(true);
        setCooldown(RESEND_SECONDS);
        return;
      }

      targetEmail = resolvedEmail;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      // Must be listed under Authentication → URL Configuration → Redirect URLs in Supabase
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      console.error(error.message);
      setToast({
        type: "error",
        message:
          error.status === 429
            ? "Too many requests. Please wait a moment and try again."
            : "Could not send the reset link. Please try again.",
      });
      return;
    }

    setSent(true);
    setCooldown(RESEND_SECONDS);
  };

  const flightPath =
  "M -3 377 C 266 337 420 88 243 185 C 60 111 268 299 314 300 C 374 332 459 299 597 330";

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Background */}
      <div className="relative w-full h-screen overflow-hidden">
        <Image
          src="/campus-bg.png"
          alt="Meneses Campus"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Color gradient overlay (same as login) */}
      <div className="w-full min-h-screen left-0 top-0 absolute opacity-75 bg-[radial-gradient(at_0%_0%,#CF9493_0%,#9B7675_20%,#FFA2D2_40%,#9F517A_60%,#DC62A1_80%,#FFA2D2_100%)]" />

      <div
        className={`
          absolute inset-0
          transition-all duration-700 ease-out motion-reduce:transition-none
          ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
        `}
      >
        {/* Dark rounded rectangle */}
        <div className="absolute left-[3vw] right-[3vw] top-[3vh] bottom-[3vh] rounded-[50px] bg-black/25" />

        <FloatingPanel position="right">
          {!sent ? (
            <>
              {/* Header */}
              <div className="text-center">
                <div className="font-['Times_New_Roman'] font-bold text-[clamp(1.25rem,2.5vw,3rem)]">
                  Forgot Password?
                </div>
                <div>
                  Enter your email or student number and we&apos;ll send you a
                  link to reset your password.
                </div>
              </div>

              {/* Identifier (Enter submits) */}
              <div
                className="contents"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              >
                <IdentifierInput
                  uniqueIdentifier="email"
                  inputLabel="Email or Student Number"
                  id="email"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email or student number"
                  shadowDirection="right"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !identifier.trim()}
                className="
                  h-12 w-2/3 rounded-[10px] bg-[#443760]
                  text-white cursor-pointer transition hover:brightness-110
                  text-[clamp(1rem,1.15vw,2rem)]
                  shadow-[5px_5px_0px_0px_rgba(68,55,96,0.50),12px_10px_4px_0px_rgba(0,0,0,0.20)]
                  disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100
                "
              >
                {loading ? "SENDING..." : "SEND RESET LINK"}
              </button>
            </>
          ) : (
            <>
              {/* Confirmation */}
              <MailCheck size={56} className="text-[#443760]" aria-hidden="true" />

              <div className="text-center">
                <div className="font-['Times_New_Roman'] font-bold text-[clamp(1.25rem,2.5vw,3rem)]">
                  Check your email
                </div>
                <div>
                  If an account matches what you entered, a password reset link
                  is on its way. The link expires after a short time.
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || cooldown > 0}
                className="
                  h-12 w-2/3 rounded-[10px] bg-[#443760]
                  text-white cursor-pointer transition hover:brightness-110
                  text-[clamp(1rem,1.15vw,2rem)]
                  shadow-[5px_5px_0px_0px_rgba(68,55,96,0.50),12px_10px_4px_0px_rgba(0,0,0,0.20)]
                  disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100
                "
              >
                {cooldown > 0 ? `RESEND IN ${cooldown}s` : "RESEND LINK"}
              </button>
            </>
          )}

          {/* Back to login */}
          <Link
            href={LOGIN_ROUTE}
            className="inline-flex items-center justify-center gap-2 font-extrabold text-[clamp(1rem,1vw,2rem)] [-webkit-text-stroke:0.25px_#FFA2D2] text-[#FFA2D2] transition hover:text-[#443760] hover:[-webkit-text-stroke:0.5px_#443760]"
          >
            <ArrowLeft size={20} aria-hidden="true" />
            Back to login
          </Link>
        </FloatingPanel>
      </div>

      {/* Paper Plane flying along its trail, ending aimed at the LOGIN button */}
      <div className="pointer-events-none absolute left-0 top-[-4%] w-[78vw]">
        <svg
          viewBox="0 0 1000 500"
          className="h-auto w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <mask id="trailMask" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1300" height="800">
              <path
                d={flightPath}
                fill="none"
                stroke="white"
                strokeWidth="19"
                strokeLinecap="round"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset="1"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="1"
                  to="0"
                  begin="0.6s"
                  dur="3.4s"
                  fill="freeze"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines="0.4 0 0.2 1"
                />
              </path>
            </mask>
          </defs>

          {/* Dashed trail */}
          <path
            d={flightPath}
            fill="none"
            stroke="white"
            strokeOpacity="0.85"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="7 16"
            mask="url(#trailMask)"
          />

          {/* Plane (bigger). Its final heading = the direction of the path's last segment */}
          <g opacity="0">
            <set attributeName="opacity" to="1" begin="0.6s" />
            <animateMotion
              path={flightPath}
              begin="0.6s"
              dur="3.4s"
              fill="freeze"
              rotate="auto"
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.4 0 0.2 1"
            />
            {/* Change rotate(0) if your plane image doesn't point right by default */}
            <g transform="rotate(-5) scale (1.3)">
              <image
                href="/paper-plane.png"
                x="-120"
                y="-80"
                width="340"
                height="170"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
          </g>
        </svg>
      </div>
    

    {/* Tagline: its right edge is pinned just left of the login card */}
    <div className="absolute bottom-[9%] right-[45%] w-max text-right text-white text-[clamp(1.5rem,4.2vw,5rem)]">
      <div className={`${greatVibes.className} leading-none`}>
        Don&apos;t 
      </div>

      <div className={`${greatVibes.className} leading-none`}>
        Worry,
      </div>

      <div className={`${delaGothicOne.className} text-[1.1em] leading-none`}>
        Help is Here.
      </div>
    </div>

      {/* Logo */}
      <div className="absolute left-[4%] top-[5%] flex items-start gap-[1vw]">
        <Image
          src="/mns-logo.png"
          alt="Meneses logo"
          width={100}
          height={100}
          className="size-[clamp(50px,7vw,100px)]"
        />
        <div className="text-white">
          <div className="font-['Times_New_Roman'] font-bold text-[clamp(1.25rem,2vw,2.5rem)]">
            BULACAN STATE UNIVERSITY
          </div>
          <div className="font-['Times_New_Roman'] text-[clamp(1rem,1.75vw,2rem)]">
            MENESES CAMPUS
          </div>
        </div>
      </div>
    </div>
  );
}
