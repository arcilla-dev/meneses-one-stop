import { Printer } from "lucide-react";
import { LSC_OFFICE_HOURS, PAPER_SIZES, PRINT_RATES } from "../../lib/lscData";
import { formatPeso } from "../../lib/lscUtils";

export default function FeaturedServices() {
  return (
    <section className="h-fit rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <div className="flex items-center gap-3">
        <Printer className="h-8 w-8 shrink-0 text-[#8c6895]" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-bold text-[#48305d]">Featured Services</h2>
          <p className="text-sm font-semibold">
            Printing, Scanning, Photocopying
          </p>
          <p className="text-xs text-[#684f6c]">
            Documents, Reports, B&amp;W / Colored, etc.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#c58bb1] text-[#48305d]">
              <th scope="col" className="py-2 pr-3 font-bold">Paper Size</th>
              <th scope="col" className="px-2 py-2 font-bold">B&amp;W</th>
              <th scope="col" className="px-2 py-2 font-bold">Colored</th>
            </tr>
          </thead>
          <tbody>
            {PAPER_SIZES.map(({ id, label }) => (
              <tr key={id} className="border-b border-[#e3bfd5] last:border-0">
                <th scope="row" className="py-3 pr-3 font-semibold">{label}</th>
                <td className="px-2 py-3">{formatPeso(PRINT_RATES[id].bw)}/page</td>
                <td className="px-2 py-3">{formatPeso(PRINT_RATES[id].colored)}/page</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 rounded-md bg-[#e8c3da] p-3 text-sm text-[#684f6c]">
        Office hours: {LSC_OFFICE_HOURS}
      </p>
    </section>
  );
}