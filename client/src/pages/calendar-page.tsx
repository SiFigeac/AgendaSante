import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useQuery } from "@tanstack/react-query";
import type { Appointment, Patient } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { AppointmentCalendar } from "@/components/calendar/full-calendar";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddAppointment, setShowAddAppointment] = useState(false);

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowAddAppointment(true);
  };

  const handleEventClick = (appointment: Appointment) => {
    // Pour l'instant, on ne fait rien lors du clic sur un rendez-vous
    // À implémenter : ouverture d'un modal de détails/modification
    console.log('Rendez-vous cliqué:', appointment);
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Calendrier</h1>
          <Button onClick={() => setShowAddAppointment(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau rendez-vous
          </Button>
        </div>

        <div className="rounded-md border p-4">
          {appointments && patients && (
            <AppointmentCalendar
              appointments={appointments}
              patients={patients}
              onDateSelect={handleDateSelect}
              onEventClick={handleEventClick}
            />
          )}
        </div>

        <AppointmentForm
          open={showAddAppointment}
          onOpenChange={setShowAddAppointment}
          selectedDate={selectedDate}
        />
      </main>
    </div>
  );
}