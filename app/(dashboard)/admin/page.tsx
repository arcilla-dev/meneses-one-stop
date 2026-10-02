export default function AdminPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#fcdced]">
      <h1 className="text-2xl font-black text-[#352542] mb-4">Admin Dashboard</h1>
      <p className="text-sm text-[#543b59]">
        Admin-only tools (e.g. create new admin accounts) go here.
      </p>
    </div>
  );
}