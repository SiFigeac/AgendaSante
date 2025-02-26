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
      try {
        console.log("Updating availability with data:", data);

        const res = await apiRequest("PATCH", `/api/availability/${data.id}`, {
          startTime: data.startTime.toISOString(),
          endTime: data.endTime.toISOString(),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("Update availability error response:", errorData);
          throw new Error(errorData.error || "Erreur lors de la mise à jour");
        }

        return await res.json();
      } catch (error) {
        console.error("Update availability error:", error);
        throw error instanceof Error ? error : new Error("Erreur inconnue");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Succès",
        description: "La plage horaire a été mise à jour",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEventDrop = async (info: EventDropArg) => {
    const eventEl = info.el;

    try {
      console.log("Event drop - Start handling drop event");

      const eventId = parseInt(info.event.id);
      if (isNaN(eventId)) {
        throw new Error("ID d'événement invalide");
      }

      const startTime = info.event.start;
      const endTime = info.event.end;

      if (!startTime || !endTime) {
        throw new Error("Dates invalides pour la plage horaire");
      }

      console.log("Event drop - Dates:", { startTime, endTime });

      // Retour visuel pendant la mise à jour
      eventEl.style.opacity = "0.5";
      eventEl.style.cursor = "wait";

      // Utiliser mutateAsync pour une meilleure gestion des erreurs
      await updateAvailability.mutateAsync({
        id: eventId,
        startTime,
        endTime,
      });

    } catch (error) {
      console.error("Error in handleEventDrop:", error);
      info.revert();
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du déplacement",
        variant: "destructive",
      });
    } finally {
      if (eventEl) {
        eventEl.style.opacity = "";
        eventEl.style.cursor = "";
      }
    }
  };

  // Filtrer les médecins en fonction du terme de recherche
  const filteredDoctors = doctors?.filter(doctor => {
    const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Formatage des événements pour le calendrier
  const events = availabilities?.map(availability => {
    const doctor = doctors?.find(d => d.id === availability.doctorId);
    return {
      id: availability.id.toString(),
      title: doctor ? `${doctor.lastName} ${doctor.firstName}` : "Disponible",
      start: availability.startTime,
      end: availability.endTime,
      backgroundColor: doctor?.color || '#22c55e',
      extendedProps: {
        isBooked: availability.isBooked,
        doctorId: availability.doctorId,
      }
    };
  }).filter(event => !selectedDoctor || event.extendedProps.doctorId === selectedDoctor);

  const handleEventClick = (info: any) => {
    const event = {
      id: parseInt(info.event.id),
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      isBooked: info.event.extendedProps.isBooked,
    };
    setSelectedEvent(event);
  };

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
            cursor: move !important;
            transition: all 0.2s ease !important;
            border-radius: 4px !important;
            margin: 1px !important;
          }
          .fc-event:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          .fc-event.fc-event-dragging {
            transform: scale(1.02);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            opacity: 0.8;
            z-index: 9999;
          }
          .fc-event-main {
            padding: 4px !important;
          }
          .fc-timegrid-event-harness {
            margin: 0 2px !important;
          }
          .fc-timegrid-slots td {
            height: 3em !important;
            transition: background-color 0.2s;
          }
          .fc-highlight {
            background: rgba(0, 120, 255, 0.1) !important;
            border: 2px dashed rgba(0, 120, 255, 0.4) !important;
          }
          .fc-day {
            transition: background-color 0.2s !important;
          }
          .fc-day.fc-day-today {
            background-color: rgba(0, 120, 255, 0.05) !important;
          }
          .fc-timegrid-col {
            transition: all 0.2s ease-in-out;
          }
          .fc-timegrid-col.drop-highlight {
            background-color: rgba(59, 130, 246, 0.1);
          }
          .fc-timegrid-col.drop-valid {
            background-color: rgba(34, 197, 94, 0.1);
          }
          .fc-timegrid-col.drop-invalid {
            background-color: rgba(239, 68, 68, 0.1);
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
            info.el.style.cursor = 'grab';
          }}
          eventDragStart={(info) => {
            console.log("Event drag start");
            info.el.style.cursor = 'grabbing';
            info.el.style.opacity = '0.7';
          }}
          eventDragStop={(info) => {
            console.log("Event drag stop");
            info.el.style.cursor = 'grab';
            info.el.style.opacity = '';
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