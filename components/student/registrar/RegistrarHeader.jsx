import { FilePenLine } from "lucide-react";
import { registrarDisplayFont } from "./fonts";

const tabs = [
  { label: "Overview" },
  { label: "Requests" },
  { label: "Add/Remove Subjects" },
  { label: "Notifications" },
];

export default function RegistrarHeader({ activeTab, onTabChange }) {
  return (
    <section className="relative isolate overflow-hidden rounded-xl bg-[#33213f] px-4 py-2 text-[#fff0f8] shadow-sm sm:px-5">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[url('/campus-bg.png')] bg-cover bg-[center_44%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#392542]/95 via-[#482b46]/85 to-[#351f38]/95"
      />
      <div className="flex items-center gap-4">
        <FilePenLine className="h-9 w-9 shrink-0 text-[#d59bc1]" strokeWidth={1.8} />
        <div>
          <h1 className={`${registrarDisplayFont.className} text-[clamp(1.8rem,4vw,2.65rem)] leading-none tracking-tight`}>
            Registrar
          </h1>
          <p className="mt-1 text-xs font-semibold text-[#f5d8e9] sm:text-sm">
            Manage your enrollment, subjects, and official requests.
          </p>
        </div>
      </div>
      <div className="my-1.5 flex items-center gap-2" aria-hidden="true">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d699c0] to-[#d699c0]" />
        <span className="h-1.5 w-1.5 rotate-45 bg-[#d699c0]" />
        <span className="h-px flex-1 bg-gradient-to-r from-[#d699c0] via-[#d699c0] to-transparent" />
      </div>
      <nav aria-label="Registrar sections" className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1.15fr_1fr]">
        {tabs.map(({ label }) => (
          <button
            key={label}
            type="button"
            onClick={() => onTabChange(label)}
            aria-current={activeTab === label ? "page" : undefined}
            className={`rounded-md px-2 py-1 text-center font-sans text-[11px] font-bold transition-colors sm:text-xs ${
              activeTab === label
                ? "bg-[#c58bb1] text-white shadow-inner"
                : "bg-[#d8a6c7] text-white hover:bg-[#c58bb1]"
            }`}
          >
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}
