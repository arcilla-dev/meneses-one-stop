"use client"

import Image from "next/image"
import { useState, useEffect } from "react";
import FloatingPanel from "../components/FloatingPanel";
import { Dancing_Script, Dela_Gothic_One} from "next/font/google";
import IdentifierInput from "../components/IdentifierInput";
import Link from "next/link";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
});

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

export default function RegistrationPage(){

  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  //states for phase 1
  const [email, setEmail] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [phone, setPhone] = useState("");

  //states for phase 2
  const [program, setProgram] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");

  //states for phase 3
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return(
    <div className="relative min-h-screen w-full overflow-hidden">
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

      {phase == 1 && (
        <FloatingPanel position="left">
          <div className="mb-[10%] text-center">
            <div className={`${dancingScript.className} text-[clamp(1.25rem,2.5vw,3rem)]`}>
              Meneses Campus
            </div>
            <div className={`${delaGothicOne.className} text-[clamp(1.25rem,2vw,3rem)]`}>ONE-STOP</div>
          </div>
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
            className="relative flex h-12 w-2/3 items-center justify-center
                rounded-[10px] bg-[#443760]
                text-white cursor-pointer transition hover:brightness-110
                text-[clamp(1rem,1.15vw,2rem)]
                shadow-[-5px_5px_0px_0px_rgba(68,55,96,0.50),-12px_10px_4px_0px_rgba(0,0,0,0.20)]">
              Next 
              <Image
              src="/arrow-right.png"
              alt="arrow right icon"
              width={100}
              height={100}/>
              
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
        </FloatingPanel>
        
      )}

      {phase==2 &&(
        <FloatingPanel position="mid">
          <></>
        </FloatingPanel>
      )}


    </div>
  )
}