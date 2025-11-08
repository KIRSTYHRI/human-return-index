export default function DashboardPage() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-3xl font-bold text-yellow-400 mb-4">
        Human Return Index™ – Pilot Dashboard
      </h1>
      <p className="text-lg text-gray-200 max-w-2xl mx-auto">
        This is your live preview of the Human Return Index™ dashboard.
        The data you see below is sample data while we connect the live Supabase backend.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Once live, you’ll see your organisation’s wellbeing and performance metrics in real time.
      </p>
    </main>
  );
}
