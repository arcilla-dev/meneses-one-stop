"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dancing_Script, Dela_Gothic_One ,Bodoni_Moda} from "next/font/google";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
});

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
});

export default function LoginPage() {
  
  //Hook States
  const [showLogin, setShowLogin] = useState(false);        //handles the transition from start to login form
  const [hideHero, setHideHero] = useState(false);          //status handler for hiding the intial login UI
  const [email, setEmail] = useState("");                   //for tracking email inputs
  const [password, setPassword] = useState("");             //for tracking password inputs
  const [showPassword, setShowPassword] = useState(false);  //for toggling hide or unhide password input (eye icon)
  const [loginVisible, setLoginVisible] = useState(false);  //drives the staged entrance after the form mounts
  useEffect(() => {
    if (!showLogin) return;
    // Short delay so the hidden state is painted before flipping, otherwise no transition occurs
    const id = setTimeout(() => setLoginVisible(true), 50);
    return () => clearTimeout(id);
  }, [showLogin]);

  //Main UI Code
  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Background*/}
      <Image
        src="/campus-bg.png"
        alt="Meneses Campus"
        fill
        priority
        className="object-fill"
      />

      {/* Color Gradient on top of the background #CF9493  #9B7675 #FFA2D2 #9F517A #DC62A1 #FFA2D2*/}
      <div className="w-full min-h-screen left-0 top-0 absolute opacity-75 bg-[radial-gradient(at_0%_0%,#CF9493_0%,#9B7675_20%,#FFA2D2_40%,#9F517A_60%,#DC62A1_80%,#FFA2D2_100%)]" />

      {/* UI after pressing LOG In ➔ */}
      {showLogin && (
        <div
          className={`
            absolute inset-0
            transition-all duration-700 ease-out motion-reduce:transition-none
            ${loginVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
          `}>  
          {/* Black Rectangle w/ opacity of 25 */}
          <div className="absolute left-[3vw] right-[3vw] top-[3vh] bottom-[3vh] rounded-[50px] bg-black/25" />

          {/*{ Temporary red middle line } <div className="absolute left-1/2 top-0 h-full w-px bg-red-500" />*/}

          {/* Log In Card template with bg-color #CD7BA4 and #443760 */}
          <div className="absolute right-[2vw] top-[4.5vh] bottom-[1.5vh] rounded-[50px] w-[40%] bg-[#443760]" />
          <div className={`absolute right-[3vw] top-[3vh] bottom-[3vh] rounded-[50px] w-[40%] bg-[#CD7BA4]/70 `}/>

          {/* Log In Card: children flow inside it via flexbox */}
          <div
            className={`
              ${bodoniModa.className}
              absolute right-[3vw] top-[3vh] bottom-[3vh]
              w-[40%] rounded-[50px]
              bg-[#CD7BA4]/70
              flex flex-col items-center justify-center gap-[2.5vh]
              px-[4vw] py-[3vh]
              text-white text-[clamp(1rem,1.25vw,2rem)]
            `}
          >
            {/* Header */}
            <div className="text-center">
              <div className="font-['Times_New_Roman'] font-bold text-[clamp(1.25rem,2.5vw,3rem)]">
                Welcome Back!
              </div>
              <div>Log in to continue to your MCOS account</div>
            </div>

            {/* Email */}
            <div className="flex w-full flex-col">
              <label htmlFor="email">Email or Student Number</label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or student number"
                className="
                  mt-[1vh] h-[clamp(2.75rem,5vh,4rem)] w-full
                  rounded-[10px] border-none bg-[#C48AB2]
                  px-5 text-[#443760] outline-none
                  text-[clamp(1rem,1.2vw,1.5rem)]
                  shadow-[10px_5px_0px_0px_rgba(68,55,96,1),15px_10px_4px_0px_rgba(0,0,0,0.25)]
                "
              />
            </div>

            {/* Password + Forgot Password */}
            <div className="flex w-full flex-col">
              <label htmlFor="password">Password</label>

              <div className="relative mt-[1vh]">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="
                    h-[clamp(2.75rem,5vh,4rem)] w-full
                    rounded-[10px] border-none bg-[#C48AB2]
                    pl-5 pr-14 text-[#443760] outline-none
                    text-[clamp(1rem,1.2vw,1.5rem)]
                    shadow-[10px_5px_0px_0px_rgba(68,55,96,1),15px_10px_4px_0px_rgba(0,0,0,0.25)]
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#443760] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>

              <Link
                href="/forgot-password"
                className="mt-[1.5vh] self-end font-extrabold text-[clamp(1rem,1vw,2rem)] text-[#FFA2D2] transition hover:text-[#443760]"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login */}
            <button
              className="
                h-12 w-2/3 rounded-[10px] bg-[#443760]
                text-white cursor-pointer transition hover:brightness-110
                text-[clamp(1rem,1.15vw,2rem)]
                shadow-[5px_5px_0px_0px_rgba(68,55,96,0.50),12px_10px_4px_0px_rgba(0,0,0,0.20)]
              "
            >
              LOGIN
            </button>

            <div>- or continue with -</div>

            {/* Google */}
            <button
              className="
                relative flex h-12 w-2/3 items-center justify-center
                rounded-[10px] bg-[#443760]
                text-white cursor-pointer transition hover:brightness-110
                text-[clamp(1rem,1.15vw,2rem)]
                shadow-[5px_5px_0px_0px_rgba(68,55,96,0.50),12px_10px_4px_0px_rgba(0,0,0,0.20)]
              "
            >
              <Image
                src="/google.png"
                alt="Google Icon"
                width={100}
                height={100}
                className="absolute left-[5%] top-1/2 -translate-y-1/2 size-[clamp(15px,5vw,30px)]"
              />
              Continue with Google
            </button>

            {/* Register */}
            <div className="text-center">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-extrabold text-[clamp(1rem,1vw,2rem)] text-[#FFA2D2] transition hover:text-[#443760]"
              >
                Register here
              </Link>
            </div>
          </div>


          {/* Paper Plane */}
          <div
            className={`
              absolute left-[5%] top-[-12%] w-[58vw]
              transition-all duration-700 delay-700 ease-out motion-reduce:transition-none
              ${loginVisible ? "translate-x-0 opacity-100" : "-translate-x-16 opacity-0"}
            `}
          > 
              <Image
                src="/paper-plane.png"
                alt="Paper Plane"
                width={800}
                height={400}
                className="w-full h-auto"
              />

            {/* Texts below the paper plane */}
              <div className="absolute left-[31%] top-[65%] w-[70%] text-white">
                <div className={`${dancingScript.className} ml-[17%] text-[clamp(2rem,5vw,4rem)] leading-none`}>
                  Your Campus
                </div>

                <div className={`${dancingScript.className} ml-[36%] text-[clamp(2rem,5vw,4rem)] leading-none`}>
                  Services,
                </div>

                <div className={`${delaGothicOne.className} ml-[-9%] text-[clamp(2rem,4vw,4rem)] leading-none`}>
                  In One Place
                </div>
              </div>
            </div>
        </div>
      )}

      {/* UI before pressing LOG In ➔*/}
      
      {!showLogin && (
        <>
          <div
            className={`
              absolute left-1/2 top-[30%] w-full
              -translate-x-1/2 text-center text-white
              transition-all duration-700 ease-out
              ${
                hideHero
                  ? "-translate-y-8 scale-95 opacity-0"
                  : "translate-y-0 scale-100 opacity-100"
              }
            `}
          >
            <div className="absolute left-1/2 top-[50%] w-full -translate-x-1/2 text-center text-white">
              <div className={`${dancingScript.className} text-[clamp(3rem,8vw,8rem)] leading-none`}>
                Meneses Campus
              </div>

              <div className={`${delaGothicOne.className} text-[clamp(2.5rem,5vw,6rem)] leading-none`}>
                ONE-STOP
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setHideHero(true);

              setTimeout(() => {
                setShowLogin(true);
              }, 700);
            }}
            className={`
              absolute bottom-[15%] left-1/2
              h-[clamp(3rem,5vw,4rem)]
              w-[clamp(12rem,20vw,30rem)]
              -translate-x-1/2
              text-[clamp(1.125rem,1.25vw,2em)]
              rounded-[100px] 
              bg-[#b477a1] 
              font-bold 
              text-white 
              shadow-[6px_11px_0px_0px_rgba(68,55,96,0.25),12px_22px_4px_0px_rgba(0,0,0,0.25)] 
              transition hover:brightness-110 
              active:translate-y-1
              transition-all duration-500
              cursor-pointer
              ${
                hideHero
                  ? "translate-y-8 opacity-0"
                  : "translate-y-0 opacity-100"
              }
            `}
          >
            LOG IN ➔
          </button>
        </>
      )}
      {/* Logo Part */}
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