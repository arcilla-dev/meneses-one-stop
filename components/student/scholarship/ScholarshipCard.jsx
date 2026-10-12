import { GraduationCap } from "lucide-react";

const statusStyles = {
  Open: "bg-green-100 text-green-800",
  Closed: "bg-gray-100 text-gray-700",
};

export default function ScholarshipCard({ scholarship, onViewDetails }) {
  return (
    <li className="rounded-md bg-[#e8c3da] p-4 text-[#392641]">
      <div className="flex flex-wrap items-start gap-3">
        <GraduationCap
          className="mt-0.5 h-6 w-6 shrink-0 text-[#8c6895]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold">{scholarship.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                statusStyles[scholarship.status] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {scholarship.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#684f6c]">
            {scholarship.description}
          </p>
          <p className="mt-1 text-xs text-[#684f6c]">
            Deadline: {scholarship.deadline}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onViewDetails(scholarship)}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[#684f6c] transition-colors hover:bg-[#d8a6c7] hover:text-[#48305d]"
        >
          View Details
        </button>
      </div>
    </li>
  );
}
