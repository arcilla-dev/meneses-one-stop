"use client"

import Image from "next/image"
import { useState, useEffect } from "react";
import FloatingPanel from "../../components/FloatingPanel";
import { Dancing_Script, Dela_Gothic_One} from "next/font/google";
import IdentifierInput from "../../components/IdentifierInput";
import Toast from "../../components/Toast";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
import { useRouter } from "next/navigation";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
});

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

export default function RegistrationPage(){

  const router = useRouter();

  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);

  //states for phase 1
  const [email, setEmail] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [phone, setPhone] = useState("");

  //states for phase 2
  const [program, setProgram] = useState("");
  const [fullName, setFullName] = useState("");
  const [yearAndsection, setYearAndSection] = useState("");

  //states for phase 3
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [successVisible, setSuccessVisible] = useState(false);

  const [toast, setToast] = useState<{      //Toast error handler
    message: string;
    type: "error" | "success";
  } | null>(null);

  useEffect(() => {
    if (phase !== 4) return;
    // Short delay so the hidden state is painted before flipping, otherwise no transition occurs
    const id = setTimeout(() => setSuccessVisible(true), 50);
    return () => clearTimeout(id);
  }, [phase]);

  const requirements = {
  minLength: password.length >= 12,
  upperCase: /[A-Z]/.test(password),
  lowerCase: /[a-z]/.test(password),
  specialChar: /[^A-Za-z0-9]/.test(password),
  digit: /[0-9]/.test(password),
  equality: password==confirmPassword,
};

  // Panel "bus stop" for each phase. Phase 4 has no panel.
  const panelPosition = phase === 1 ? "left" : phase === 2 ? "mid" : "right";

 const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegister = async () => {
  // Validate required fields
  if (
    !email.trim() ||
    !studentNumber.trim() ||
    !phone.trim() ||
    !fullName.trim() ||
    !program.trim() ||
    !yearAndsection.trim()
  ) {
    setToast({
      type: "error",
      message: "Please complete all registration fields.",
    });
    return;
  }

  // Validate password requirements
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
    setToast({
      type: "error",
      message: "Passwords do not match.",
    });
    return;
  }

  setIsSubmitting(true);

  try {
    // Create the account and send student details as metadata.
    // The database trigger will create both profile records.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          student_number: studentNumber.trim(),
          phone: phone.trim(),
          full_name: fullName.trim(),
          program: program.trim(),
          year_section: yearAndsection.trim(),
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      setToast({
        type: "error",
        message: error.message,
      });
      return;
    }

    if (!data.user) {
      setToast({
        type: "error",
        message: "Account creation failed. Please try again.",
      });
      return;
    }

    console.log("Signup successful:", data.user.id);

    if (!data.session) {
      setToast({
        type: "success",
        message: "Your account has been created. Please check your email to confirm your registration.",
      });
    }

    setPhase(4);
  } catch (err) {
    console.error("Registration error:", err);
    setToast({
      type: "error",
      message: "Something went wrong during registration.",
    });
  } finally {
    setIsSubmitting(false);
  }
};


  return(
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Renders Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

      {/* Background*/}
      <Image
        src="/sunflower.png"
        alt="Registration Page Background"
        fill
        priority
        className="object-fill"
      />

      {/* Color Gradient on top of the background #CF9493  #9B7675 #FFA2D2 #9F517A #DC62A1 #FFA2D2*/}
      <div className="w-full min-h-screen left-0 top-0 absolute opacity-75 bg-[radial-gradient(at_0%_0%,#CF9493_0%,#9B7675_20%,#FFA2D2_40%,#9F517A_60%,#DC62A1_80%,#FFA2D2_100%)]" />
      
      <div className="absolute left-[3vw] right-[3vw] top-[3vh] bottom-[3vh] rounded-[50px] bg-black/25" />

      {/* One persistent panel for phases 1-3: it stays mounted so its position can animate */}
      {phase !== 4 && (
        <FloatingPanel position={panelPosition}>

          {phase === 1 && (
            <>
              <div className="text-center">
                <div className={`${dancingScript.className} text-[clamp(1.25rem,2.5vw,3rem)]`}>
                  Meneses Campus
                </div>
                <div className={`${delaGothicOne.className} text-[clamp(1.25rem,2vw,3rem)]`}>ONE-STOP</div>
              </div>

              <div className="relative w-full">
                {/* Line */}
                <div className="absolute top-1/2 left-0 w-full h-[3px] bg-[#FFD6EA] -translate-y-1/2" />

                {/* Circles */}
                <div className="relative flex justify-between items-center">
                  <div className="w-15 h-15 rounded-full bg-[#C48AB2] flex items-center justify-center text-[#443760]">
                    1
                  </div>

                  <div className="w-12 h-12 rounded-full bg-[#C48AB2] flex items-center justify-center text-[#443760]">
                    2
                  </div>

                  <div className="w-12 h-12 rounded-full bg-[#C48AB2] flex items-center justify-center text-[#443760]">
                    3
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col ml-[-3%] mt-[-3%]">Account</div>


              {/* Student Number */}
              <IdentifierInput 
                uniqueIdentifier="studentNumber"
                inputLabel="Student Number"
                id="studentNumber" 
                type="text" 
                value={studentNumber} 
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="20xxxxxxxx"
                shadowDirection="left"
              />

              {/* Email */}
              <IdentifierInput 
                uniqueIdentifier="email"
                inputLabel="Email"
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="meneses.onestop@gmail.com"
                shadowDirection="left"
              />

              {/* Phone Number */}
              <IdentifierInput 
                uniqueIdentifier="phone"
                inputLabel="Phone"
                id="phone" 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(+63) 9xx-xxx-xxxx"
                shadowDirection="left"
              />

              <button 
                onClick={() => setPhase(2)}
                className="relative flex h-12 w-9/20 ml-[55%] items-center justify-center
                    rounded-[10px] bg-[#443760]
                    text-white cursor-pointer transition hover:brightness-110
                    text-[clamp(1rem,1.15vw,2rem)]
                    shadow-[-5px_5px_0px_0px_rgba(68,55,96,0.50),-12px_10px_4px_0px_rgba(0,0,0,0.20)]">
                  Next 
                  <Image
                  src="/arrow-right.png"
                  alt="arrow right icon"
                  width={50}
                  height={50}
                  className="ml-[5%]"/>
              </button>
              
              <div className="text-center">
                Already have an account? 
                <Link
                  href="/login"
                  className="font-extrabold text-[clamp(1rem,1vw,2rem)] [-webkit-text-stroke:0.25px_#FFA2D2] text-[#FFA2D2] transition hover:text-[#443760] hover:[-webkit-text-stroke:0.5px_#443760]"
                >
                  Sign In here
                </Link>
              </div>
            </>
          )}

          {phase === 2 && (
            <>
              <div className="mb-[0%] text-center">
                <div className={`${dancingScript.className} text-[clamp(1.25rem,2.5vw,3rem)]`}>
                  Meneses Campus
                </div>
                <div className={`${delaGothicOne.className} text-[clamp(1.25rem,2vw,3rem)]`}>ONE-STOP</div>
              </div>

              <div className="relative w-full">
                {/* Line */}
                <div className="absolute top-1/2 left-0 w-full h-[3px] bg-[#FFD6EA] -translate-y-1/2" />

                {/* Circles */}
                <div className="relative flex justify-between items-center">
                  <div className="w-12 h-12 rounded-full bg-[#C48AB2] flex items-center justify-center text-[#443760]">
                    1
                  </div>

                  <div className="w-15 h-15 rounded-full bg-[#C48AB2] flex items-center justify-center text-[#443760]">
                    2
                  </div>

                  <div className="w-12 h-12 rounded-full bg-[#C48AB2] flex items-center justify-center text-[#443760]">
                    3
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col items-center justify-center ml-[1%] mt-[-3%]">Personal</div>

              {/* Full Name */}
              <IdentifierInput 
                uniqueIdentifier="fullName"
                inputLabel="Full Name"
                id="fullName" 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan M. Dela Cruz"
                shadowDirection="mid"
              />
              {/* Program */}
              <IdentifierInput 
                uniqueIdentifier="program"
                inputLabel="Program"
                id="program" 
                type="text" 
                value={program} 
                onChange={(e) => setProgram(e.target.value)}
                placeholder="BS in Computer Engineering"
                shadowDirection="mid"
              />
              {/* Year and Section */}
              <IdentifierInput 
                uniqueIdentifier="yearAndSection"
                inputLabel="Year & Section"
                id="yearAndSection" 
                type="text" 
                value={yearAndsection} 
                onChange={(e) => setYearAndSection(e.target.value)}
                placeholder="4B"
                shadowDirection="mid"
              />

              <div className="flex w-full justify-between gap-4 mb-[2%]">
                <button
                  onClick={() => setPhase(1)}
                  className="relative flex h-12 w-9/20 items-center justify-center
                    rounded-[10px] bg-[#443760]
                    text-white cursor-pointer transition hover:brightness-110
                    text-[clamp(1rem,1.15vw,2rem)]
                    shadow-[0px_5px_0px_0px_rgba(68,55,96,0.50),0px_10px_4px_0px_rgba(0,0,0,0.20)]"
                >
                  Previous
                  <Image
                    src="/arrow-left.png"
                    alt="arrow left icon"
                    width={50}
                    height={50}
                    className="ml-[5%]"
                  />
                </button>

                <button
                  onClick={() => setPhase(3)}
                  className="relative flex h-12 w-9/20 items-center justify-center
                    rounded-[10px] bg-[#443760]
                    text-white cursor-pointer transition hover:brightness-110
                    text-[clamp(1rem,1.15vw,2rem)]
                    shadow-[0px_5px_0px_0px_rgba(68,55,96,0.50),0px_10px_4px_0px_rgba(0,0,0,0.20)]"
                >
                  Next
                  <Image
                    src="/arrow-right.png"
                    alt="arrow right icon"
                    width={50}
                    height={50}
                    className="ml-[5%]"
                  />
                </button>
              </div>
              
              <div className="text-center mb-[7%]">
                Already have an account? 
                <Link
                  href="/login"
                  className="font-extrabold text-[clamp(1rem,1vw,2rem)] [-webkit-text-stroke:0.25px_#FFA2D2] text-[#FFA2D2] transition hover:text-[#443760] hover:[-webkit-text-stroke:0.5px_#443760]"
                >
                  Sign In here
                </Link>
              </div>
            </>
          )}

          {phase === 3 && (
            <>
              {/* Typo fixed: removed the invalid "mt-[30%]]" class (it was being ignored, so visuals are unchanged) */}
              <div className="text-center">
                <div className={`${dancingScript.className} text-[clamp(1.25rem,2.5vw,3rem)]`}>
                  Meneses Campus
                </div>
                <div className={`${delaGothicOne.className} text-[clamp(1.25rem,2vw,3rem)]`}>ONE-STOP</div>
              </div>

              <div className="relative w-full mb-[-25%]">
                {/* Line */}
                <div className="absolute top-1/2 left-0 w-full h-[3px] bg-[#FFD6EA] -translate-y-1/2" />

                {/* Circles */}
                <div className="relative flex justify-between items-center">
                  <div className="w-12 h-12 rounded-full bg-[#C48AB2] flex items-center justify-center text-[#443760]">
                    1
                  </div>

                  <div className="w-12 h-12 rounded-full bg-[#C48AB2] flex items-center justify-center text-[#443760]">
                    2
                  </div>

                  <div className="w-15 h-15 rounded-full bg-[#C48AB2] flex items-center justify-center text-[#443760]">
                    3
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col ml-[170%] mt-[20%] mb-[-7%]">Password</div>
              {/* Create Password */}
              <IdentifierInput
                uniqueIdentifier="createPassword"
                inputLabel="Create Password"
                id="createPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="************"
                shadowDirection="right">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#443760] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
              </IdentifierInput>
              <div className="text-sm">
                <div className="flex flex-row items-center">
                  <Image
                    src={requirements.minLength ? "/passed-icon.png" : "/not-passed-icon.png"}
                    alt="validation status"
                    width={20}
                    height={20}/> 
                  At least 12 characters
                </div>

                <div className="flex flex-row items-center">
                  <Image
                    src={(requirements.upperCase && requirements.lowerCase) ? "/passed-icon.png" : "/not-passed-icon.png"}
                    alt="validation status"
                    width={20}
                    height={20}/> 
                  At least one uppercase and lowercase letter
                </div>

                <div className="flex flex-row items-center">
                  <Image
                    src={requirements.digit ? "/passed-icon.png" : "/not-passed-icon.png"}
                    alt="validation status"
                    width={20}
                    height={20}/>
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
              <IdentifierInput
                uniqueIdentifier="confirmPassword"
                inputLabel="Confirm Password"
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="************"
                shadowDirection="right">
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#443760] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
              </IdentifierInput>
              <p className={requirements.equality ? "text-sm text-[#00BF15]" : "text-sm text-[#671410]"}>
                {`${requirements.equality ? "Password matched" : "Password does not match"}`}
              </p>
              <div className="flex w-full justify-between gap-4 mb-[2%]">
                <button
                  onClick={() => setPhase(2)}
                  className="relative flex h-12 w-9/20 items-center justify-center
                    rounded-[10px] bg-[#443760]
                    text-white cursor-pointer transition hover:brightness-110
                    text-[clamp(1rem,1.15vw,2rem)]
                    shadow-[0px_5px_0px_0px_rgba(68,55,96,0.50),0px_10px_4px_0px_rgba(0,0,0,0.20)]"
                >
                  Previous
                  <Image
                    src="/arrow-left.png"
                    alt="arrow left icon"
                    width={50}
                    height={50}
                    className="ml-[5%]"
                  />
                </button>

                <button
                  onClick={handleRegister}
              disabled={isSubmitting}
                  className="relative flex h-12 w-9/20 items-center justify-center
                    rounded-[10px] bg-[#443760]
                    text-white cursor-pointer transition hover:brightness-110
                    text-[clamp(1rem,1.15vw,2rem)]
                    shadow-[0px_5px_0px_0px_rgba(68,55,96,0.50),0px_10px_4px_0px_rgba(0,0,0,0.20)]"
                >
                  {isSubmitting ? "Creating..." : "Create Account"} 
                </button>
              </div>
              
              <div className="text-center mb-[7%]">
                Already have an account? 
                <Link
                  href="/login"
                  className="font-extrabold text-[clamp(1rem,1vw,2rem)] [-webkit-text-stroke:0.25px_#FFA2D2] text-[#FFA2D2] transition hover:text-[#443760] hover:[-webkit-text-stroke:0.5px_#443760]"
                >
                  Sign In here
                </Link>
              </div>
            </>
          )}

        </FloatingPanel>
      )}

      {phase === 4 && ( 
        <div
          className={`
            absolute inset-0
            transition-all duration-700 ease-out motion-reduce:transition-none
            ${successVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
          `}
        >
          {/* Logo Part */} 
          <div className="absolute left-[4%] top-[5%] flex items-start gap-[1vw]"> 
            <Image 
            src="/mns-logo.png" 
            alt="Meneses logo" 
            width={100} 
            height={100} 
            className="size-[clamp(50px,7vw,100px)]" /> 
            <div className="text-white"> 
              <div className="font-['Times_New_Roman'] font-bold text-[clamp(1.25rem,2vw,2.5rem)]"> 
                BULACAN STATE UNIVERSITY 
              </div> 
              <div className="font-['Times_New_Roman'] text-[clamp(1rem,1.75vw,2rem)]"> 
                MENESES CAMPUS 
              </div> 
            </div> 
          </div> 
          <div className="absolute top-[20%] left-[42%]"> 
            <Image 
            src="/register-success.png" 
            alt="status success" 
            width={200} height={200} 
            className="size-[clamp(50px, 100vw, 500px)]" /> 
          </div> 
          <div className={`absolute top-[45%] left-[25%] ${delaGothicOne.className} text-center text-[clamp(1.15rem,1.75vw,5rem)]`}> 
          <div className={`${dancingScript.className} font-bold text-[clamp(1.25rem,6vw,6rem)]`}> 
            You’re All Set!!! 
          </div> 
          <div>
            YOUR MCOS ACCOUNT HAS BEEN CREATED
          </div> 
          <div>
            SUCCESSFULLY. WELCOME ABORD
          </div> 
        </div> 
        <button onClick={() => { 
          router.push("/login"); 
        }} className={ 
          `absolute bottom-[12%] left-1/2 
          h-[clamp(3rem,3vw,4rem)] 
          w-[clamp(12rem,20vw,30rem)] 
          -translate-x-1/2 
          text-[clamp(1.125rem,1.25vw,2em)] 
          rounded-[100px] 
          bg-[#b477a1] 
          font-bold 
          text-white 
          shadow-[5px_10px_0px_0px_rgba(68,55,96,0.25),10px_20px_4px_0px_rgba(0,0,0,0.25)] 
          transition hover:brightness-110 
          active:translate-y-1 
          transition-all duration-500 
          cursor-pointer `
        } > 
          LOG IN ➔ 
        </button> 
      </div> 
      )} 
    </div> 
  ) 
}
