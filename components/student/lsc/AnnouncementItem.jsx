export default function AnnouncementItem({ announcement }) {
  return (
    <li className="rounded-md bg-[#e8c3da] p-4 text-[#392641]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-bold text-[#48305d]">{announcement.title}</h3>
        <time className="text-xs text-[#684f6c]">{announcement.date}</time>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[#684f6c]">
        {announcement.message}
      </p>
    </li>
  );
}
