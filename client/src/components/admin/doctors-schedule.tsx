import { useQuery } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from "@fullcalendar/core/locales/fr";
import type { User, Availability } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DoctorsSchedule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);

  const { data: doctors } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
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

  // Filtrer les médecins en fonction du terme de recherche
  const filteredDoctors = doctors?.filter(doctor => {
    const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4 justify-end">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Rechercher un médecin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[250px]"
          />
          {selectedDoctor && (
            <Button
              variant="ghost"
              onClick={() => setSelectedDoctor(null)}
            >
              Tous les médecins
            </Button>
          )}
        </div>
      </div>

      {searchTerm && filteredDoctors && filteredDoctors.length > 0 && !selectedDoctor && (
        <div className="border rounded-md p-2 space-y-1">
          {filteredDoctors.map(doctor => (
            <Button
              key={doctor.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setSelectedDoctor(doctor.id);
                setSearchTerm("");
              }}
            >
              {doctor.firstName} {doctor.lastName}
            </Button>
          ))}
        </div>
      )}

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