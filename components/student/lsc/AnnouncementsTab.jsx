import { registrarDisplayFont } from "../registrar/fonts";
import { MOCK_ANNOUNCEMENTS } from "./data";
import AnnouncementItem from "./AnnouncementItem";

export default function AnnouncementsTab() {
  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-6 text-[#392641] shadow-sm">
      <h2
        className={`${registrarDisplayFont.className} mb-4 text-2xl leading-tight text-[#48305d]`}
      >
        Announcements
      </h2>
      <ul className="space-y-3">
        {MOCK_ANNOUNCEMENTS.map((announcement) => (
          <AnnouncementItem
            key={announcement.id}
            announcement={announcement}
          />
        ))}
      </ul>
    </section>
  );
}
