import { useQuery, useMutation } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from "@fullcalendar/core/locales/fr";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventDropArg } from "@fullcalendar/core";
import type { User, Availability } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export function DoctorsSchedule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { toast } = useToast();

  const { data: doctors } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    select: (users) => users?.filter(u => u.role === "doctor"),
  });

  const { data: availabilities } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
  });

  const updateAvailability = useMutation({
    mutationFn: async (data: { id: number, startTime: Date, endTime: Date }) => {
      const res = await apiRequest("PATCH", `/api/availability/${data.id}`, {
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Succès",
        description: "La plage horaire a été mise à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la plage horaire",
        variant: "destructive",
      });
    },
  });

  const deleteAvailability = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/availability/${id}`);
      if (!res.ok) throw new Error("Erreur lors de la suppression");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Succès",
        description: "La plage horaire a été supprimée",
      });
      setSelectedEvent(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la plage horaire",
        variant: "destructive",
      });
    },
  });

  const handleEventDrop = (info: EventDropArg) => {
    const eventId = parseInt(info.event.id);
    const startTime = info.event.start;
    const endTime = info.event.end;

    if (!startTime || !endTime) {
      info.revert();
      return;
    }

    // Animation minimale
    info.el.style.opacity = "0.5";

    updateAvailability.mutate(
      { id: eventId, startTime, endTime },
      {
        onSettled: () => {
          info.el.style.opacity = "";
        },
        onError: () => {
          info.revert();
        }
      }
    );
  };

  // Formatage des événements pour le calendrier
  const events = availabilities?.map(availability => {
    const doctor = doctors?.find(d => d.id === availability.doctorId);
    return {
      id: availability.id.toString(),
      title: doctor ? `${doctor.lastName} ${doctor.firstName}` : "Disponible",
      start: availability.startTime,
      end: availability.endTime,
      backgroundColor: doctor?.color || '#22c55e',
      borderColor: doctor?.color || '#22c55e',
      extendedProps: {
        isBooked: availability.isBooked,
        doctorId: availability.doctorId,
      }
    };
  }).filter(event => !selectedDoctor || event.extendedProps.doctorId === selectedDoctor);

  const handleEventClick = (info: any) => {
    setSelectedEvent({
      id: parseInt(info.event.id),
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      isBooked: info.event.extendedProps.isBooked,
    });
  };

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
              {doctor.lastName} {doctor.firstName}
            </Button>
          ))}
        </div>
      )}

      <style>
        {`
          .fc-event {
            cursor: grab !important;
            border-radius: 4px !important;
            margin: 1px !important;
          }
          .fc-event-main {
            padding: 4px !important;
          }
          .fc-timegrid-event-harness {
            margin: 0 2px !important;
          }
          .fc-timegrid-slots td {
            height: 3em !important;
          }
          .fc-highlight {
            background: rgba(0, 120, 255, 0.1) !important;
            border: 2px dashed rgba(0, 120, 255, 0.4) !important;
          }
        `}
      </style>

      <div className="rounded-md border">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
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
          editable={true}
          eventDrop={handleEventDrop}
          dragScroll={true}
          dayMaxEvents={true}
          snapDuration="00:15:00"
          eventResizableFromStart={true}
          eventDurationEditable={true}
          eventOverlap={false}
          nowIndicator={true}
          slotEventOverlap={false}
          eventDidMount={(info) => {
            info.el.title = `${info.event.title}\nDébut: ${new Date(info.event.start!).toLocaleTimeString('fr-FR')}\nFin: ${new Date(info.event.end!).toLocaleTimeString('fr-FR')}`;
          }}
          eventClick={handleEventClick}
        />
      </div>

      {selectedEvent && (
        <Dialog
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Plage horaire</DialogTitle>
              <DialogDescription>
                {selectedEvent?.title}
                <br />
                Du {new Date(selectedEvent?.start).toLocaleString('fr-FR')}
                <br />
                Au {new Date(selectedEvent?.end).toLocaleString('fr-FR')}
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="destructive" 
                onClick={() => deleteAvailability.mutate(selectedEvent.id)}
                disabled={deleteAvailability.isPending}
              >
                {deleteAvailability.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Supprimer"
                )}
              </Button>
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}