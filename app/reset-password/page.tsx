"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
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

const LOGIN_ROUTE = "/"; // change to your actual login route

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);          // true once the recovery session exists
  const [checked, setChecked] = useState(false);      // true once we've looked for that session
  const [visible, setVisible] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const requirements = {
    minLength: password.length >= 12,
    upperCase: /[A-Z]/.test(password),
    lowerCase: /[a-z]/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
    digit: /[0-9]/.test(password),
    equality: confirmPassword.length > 0 && password === confirmPassword,
  };

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(id);
  }, []);

  // The emailed link signs the user in with a temporary "recovery" session.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setChecked(true);
      }
    });

    // Covers the case where the session was already established before we subscribed
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecked(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (loading) return;

    if (
      !requirements.minLength ||
      !requirements.upperCase ||
      !requirements.lowerCase ||
      !requirements.digit ||
      !requirements.specialChar
    ) {
      setToast({
        type: "error",
        message: "Please meet all password requirements.",
      });
      return;
    }

    if (!requirements.equality) {
      setToast({ type: "error", message: "Passwords do not match." });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error(error.message);
      setLoading(false);
      setToast({ type: "error", message: error.message });
      return;
    }

    // End the recovery session so they log in fresh with the new password
    await supabase.auth.signOut();

    setToast({
      type: "success",
      message: "Password updated. Redirecting to login...",
    });

    setTimeout(() => router.push(LOGIN_ROUTE), 1500);
  };

  const eyeButton = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#443760] cursor-pointer"
    >
      {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
    </button>
  );

  const eyeButton2 = (
    <button
      type="button"
      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#443760] cursor-pointer"
    >
      {showConfirmPassword ? <EyeOff size={24} /> : <Eye size={24} />}
    </button>
  );

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

      <div className="w-full min-h-screen left-0 top-0 absolute opacity-75 bg-[radial-gradient(at_0%_0%,#CF9493_0%,#9B7675_20%,#FFA2D2_40%,#9F517A_60%,#DC62A1_80%,#FFA2D2_100%)]" />

      <div
        className={`
          absolute inset-0
          transition-all duration-700 ease-out motion-reduce:transition-none
          ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
        `}
      >
        <div className="absolute left-[3vw] right-[3vw] top-[3vh] bottom-[3vh] rounded-[50px] bg-black/25" />

        <FloatingPanel position="right">
          {checked && !ready ? (
            /* Opened without a valid link, or the link expired */
            <>
              <div className="text-center">
                <div className="font-['Times_New_Roman'] font-bold text-[clamp(1.25rem,2.5vw,3rem)]">
                  Link expired
                </div>
                <div>
                  This reset link is invalid or has expired. Request a new one
                  to continue.
                </div>
              </div>

              <button
                onClick={() => router.push("/forgot-password")}
                className="
                  h-12 w-2/3 rounded-[10px] bg-[#443760]
                  text-white cursor-pointer transition hover:brightness-110
                  text-[clamp(1rem,1.15vw,2rem)]
                  shadow-[5px_5px_0px_0px_rgba(68,55,96,0.50),12px_10px_4px_0px_rgba(0,0,0,0.20)]
                "
              >
                REQUEST NEW LINK
              </button>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="font-['Times_New_Roman'] font-bold text-[clamp(1.25rem,2.5vw,3rem)]">
                  Reset Password
                </div>
                <div>Choose a new password for your MCOS account</div>
              </div>

              {/* New Password */}
              <IdentifierInput
                uniqueIdentifier="createPassword"
                inputLabel="New Password"
                id="createPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="************"
                shadowDirection="right"
              >
                {eyeButton}
              </IdentifierInput>

              <div className="text-sm">
                <div className="flex flex-row items-center">
                  <Image
                    src={requirements.minLength ? "/passed-icon.png" : "/not-passed-icon.png"}
                    alt="validation status"
                    width={20}
                    height={20}
                  />
                  At least 12 characters
                </div>

                <div className="flex flex-row items-center">
                  <Image
                    src={(requirements.upperCase && requirements.lowerCase) ? "/passed-icon.png" : "/not-passed-icon.png"}
                    alt="validation status"
                    width={20}
                    height={20}
                  />
                  At least one uppercase and lowercase letter
                </div>

                <div className="flex flex-row items-center">
                  <Image
                    src={requirements.digit ? "/passed-icon.png" : "/not-passed-icon.png"}
                    alt="validation status"
                    width={20}
                    height={20}
                  />
                  At least one number
                </div>

                <div className="flex flex-row items-center">
                  <Image
                    src={requirements.specialChar ? "/passed-icon.png" : "/not-passed-icon.png"}
                    alt="validation status"
                    width={20}
                    height={20}
                  />
                  At least one special character
                </div>
              </div>

              {/* Confirm Password */}
              <div
                className="contents"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReset();
                }}
              >
                <IdentifierInput
                  uniqueIdentifier="confirmPassword"
                  inputLabel="Confirm Password"
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="************"
                  shadowDirection="right"
                >
                  {eyeButton2}
                </IdentifierInput>
              </div>

              <p className={requirements.equality ? "text-sm text-[#00BF15]" : "text-sm text-[#671410]"}>
                {requirements.equality ? "Password matched" : "Password does not match"}
              </p>

              <button
                onClick={handleReset}
                disabled={loading || !ready}
                className="
                  h-12 w-2/3 rounded-[10px] bg-[#443760]
                  text-white cursor-pointer transition hover:brightness-110
                  text-[clamp(1rem,1.15vw,2rem)]
                  shadow-[5px_5px_0px_0px_rgba(68,55,96,0.50),12px_10px_4px_0px_rgba(0,0,0,0.20)]
                  disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100
                "
              >
                {loading ? "SAVING..." : "UPDATE PASSWORD"}
              </button>
            </>
          )}
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
        Recovery is
      </div>

      <div className={`${greatVibes.className} leading-none`}>
        One Step Away
      </div>

      <div className={`${delaGothicOne.className} text-[1.1em] leading-none`}>
        From Completion.
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
