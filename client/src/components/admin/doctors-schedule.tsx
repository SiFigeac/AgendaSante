import { useQuery } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from "@fullcalendar/core/locales/fr";
import type { User, Availability } from "@shared/schema";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DoctorsSchedule() {
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);

  const { data: doctors } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (users) => users?.filter(u => u.role === "doctor"),
  });

  const { data: availabilities } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
  });

  // Filtrer les disponibilités par médecin si un médecin est sélectionné
  const filteredAvailabilities = selectedDoctor
    ? availabilities?.filter(a => a.doctorId === selectedDoctor)
    : availabilities;

  // Convertir les disponibilités en événements pour FullCalendar
  const events = filteredAvailabilities?.map(availability => ({
    id: availability.id.toString(),
    title: `Disponible ${availability.isBooked ? '(Réservé)' : ''}`,
    start: availability.startTime,
    end: availability.endTime,
    backgroundColor: availability.isBooked ? '#94a3b8' : '#22c55e',
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select onValueChange={(value) => setSelectedDoctor(value ? parseInt(value) : null)} value={selectedDoctor?.toString() || ""}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tous les médecins" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les médecins</SelectItem>
            {doctors?.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id.toString()}>
                {doctor.firstName} {doctor.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          locale={frLocale}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          events={events}
          height="auto"
          slotDuration="00:15:00"
        />
      </div>
    </div>
  );
}