import Image from "next/image";
import { Dancing_Script, Dela_Gothic_One } from "next/font/google";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
});

const delaGothicOne = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
});

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Background Part*/}
      <Image
        src="/campus-bg.png"
        alt="Meneses Campus"
        fill
        priority
        className="object-fill"
      />

      {/* Color Gradient */}
      <div className="w-full min-h-screen left-0 top-0 absolute opacity-75 bg-radial-[at_0%_0%] from-stone-400 via-stone-500 via 20% to-pink-300" />

      {/* Logo Part */}
      <Image
        src="/mns-logo.png"
        alt="Meneses logo"
        width={100}
        height={100}
        className="absolute left-[5%] top-[5%]"
      />

      <div className="absolute left-[13%] top-[5%] text-white">
        <div className="font-['Times_New_Roman'] font-bold text-[2rem]">
          BULACAN STATE UNIVERSITY
        </div>

        <div className="font-['Times_New_Roman'] text-[1.5rem]">
          MENESES CAMPUS
        </div>
      </div>

      <div className="absolute left-1/2 top-[30%] w-full -translate-x-1/2 text-center text-white">
        <div className={`${dancingScript.className} text-[clamp(3rem,7vw,8rem)] leading-none`}>
          Meneses Campus
        </div>

        <div className={`${delaGothicOne.className} text-[clamp(2.5rem,4.5vw,6rem)] leading-none`}>
          ONE-STOP
        </div>
      </div>
     
      <button
        type="button"
        className="absolute bottom-[20%] left-1/2 h-16 w-[300] text-3xl -translate-x-1/2 rounded-[100px] bg-[#b477a1] font-bold text-white shadow-[6px_11px_0px_0px_rgba(68,55,96,0.25),12px_22px_4px_0px_rgba(0,0,0,0.25)] transition hover:brightness-110 active:translate-y-1"
      >
        LOG IN ➔
      </button>
    </div>
  );
}