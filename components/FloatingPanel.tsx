import { Bodoni_Moda } from "next/font/google";

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
});

type FloatingPanelProps = {
  position: "left" | "mid" | "right";
  children: React.ReactNode;
};

const leftOf = {
  left:  { panel: "3vw",             shadow: "2vw" },
  mid:   { panel: "30%",             shadow: "30%" },
  right: { panel: "calc(60% - 3vw)", shadow: "calc(60% - 2vw)" },
};

const transition = "left 700ms cubic-bezier(0.65, 0, 0.35, 1)";

export default function FloatingPanel({ position, children }: FloatingPanelProps) {
  return (
    <>
      <div
        style={{ left: leftOf[position].shadow, transition }}
        className="absolute top-[4.5vh] bottom-[1.5vh] rounded-[50px] w-[40%] bg-[#443760]"
      />
      <div
        style={{ left: leftOf[position].panel, transition }}
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
        `}
      >
        {children}
      </div>
    </>
  );
}