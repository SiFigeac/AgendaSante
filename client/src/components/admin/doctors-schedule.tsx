import { useQuery } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from "@fullcalendar/core/locales/fr";
import type { User, Availability } from "@shared/schema";
import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function DoctorsSchedule() {
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

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

  const selectedDoctorName = doctors?.find(d => d.id === selectedDoctor)
    ? `${doctors.find(d => d.id === selectedDoctor)?.firstName} ${doctors.find(d => d.id === selectedDoctor)?.lastName}`
    : "Tous les médecins";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[250px] justify-between"
            >
              {selectedDoctorName}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0">
            <Command>
              <CommandInput placeholder="Rechercher un médecin..." />
              <CommandEmpty>Aucun médecin trouvé.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setSelectedDoctor(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !selectedDoctor ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Tous les médecins
                </CommandItem>
                {doctors?.map((doctor) => (
                  <CommandItem
                    key={doctor.id}
                    onSelect={() => {
                      setSelectedDoctor(doctor.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedDoctor === doctor.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {doctor.firstName} {doctor.lastName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
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