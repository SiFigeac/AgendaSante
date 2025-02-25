import { DoctorsSchedule } from "@/components/admin/doctors-schedule";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export default function SchedulePage() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-8">Planning des médecins</h1>
        <DoctorsSchedule />
      </main>
    </div>
  );
}
