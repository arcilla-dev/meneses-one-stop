import { Bodoni_Moda } from "next/font/google";

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
});

type FloatingPanelProps = {
  position: "left" | "mid" | "right";
  children: React.ReactNode;
};

export default function FloatingPanel({
  position,
  children,
}: FloatingPanelProps) {

  const positionClass = {
    left: "left-[3vw]",
    mid: "left-1/2 -translate-x-1/2",
    right: "right-[3vw]",
  }[position];

  const shadowPositionClass = {
    left: "left-[2vw]",
    mid: "left-1/2 -translate-x-1/2",
    right: "right-[2vw]",
  }[position];

  return (
    <>
      <div className={`absolute ${shadowPositionClass} top-[4.5vh] bottom-[1.5vh] rounded-[50px] w-[40%] bg-[#443760]`} />
      <div
        className={`
          ${bodoniModa.className}
          absolute top-[3vh] bottom-[3vh]
          w-[40%]
          rounded-[50px]
          bg-[#CD7BA4]/70

          flex flex-col
          items-center justify-center
          gap-[2.5vh]

          px-[4vw] py-[3vh]
          text-white
          text-[clamp(1rem,1.25vw,2rem)]

          ${positionClass}
        `}
      >
        {children}
      </div>
    </>
  );
}