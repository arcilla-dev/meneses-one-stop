import { registrarDisplayFont } from "../../../lib/lscFont";
import { byDateDesc } from "../../../lib/lscUtils";
import type { Announcement } from "../../../lib/lscData";
import AnnouncementItem from "./AnnouncementItem";

export default function AnnouncementsTab({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const sorted = [...announcements].sort(byDateDesc((a) => a.date));

  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <h2
        className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}
      >
        Announcements
      </h2>
      {sorted.length > 0 ? (
        <ul className="space-y-3">
          {sorted.map((announcement) => (
            <AnnouncementItem key={announcement.id} announcement={announcement} />
          ))}
        </ul>
      ) : (
        <p className="py-4 text-sm text-[#684f6c]">No announcements yet.</p>
      )}
    </section>
  );
}