import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { EventDropArg } from "@fullcalendar/core";
import type { User, Availability } from "@shared/schema";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import frLocale from "@fullcalendar/core/locales/fr";
import interactionPlugin from "@fullcalendar/interaction";

export function DoctorsSchedule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { toast } = useToast();

  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<User[]>({
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

  const events = availabilities?.map(availability => {
    const doctor = doctors?.find(d => d.id === availability.doctorId);
    return {
      id: availability.id.toString(),
      title: doctor ? `${doctor.lastName} ${doctor.firstName}` : "Disponible",
      start: availability.startTime,
      end: availability.endTime,
      backgroundColor: doctor?.color || '#cbd5e1',
      borderColor: doctor?.color || '#cbd5e1',
      textColor: '#000000',
      classNames: ['availability-event'],
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

  const filteredDoctors = doctors?.filter(doctor => {
    const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  if (isLoadingDoctors) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: doctor.color }}
                />
                {doctor.lastName} {doctor.firstName}
              </div>
            </Button>
          ))}
        </div>
      )}

      <style>
        {`
          .fc {
            height: 100%;
            min-height: 600px;
          }
          .fc-timegrid-event-harness {
            margin: 0 !important;
          }
          .fc-timegrid-event {
            border: none !important;
            margin: 0 !important;
          }
          .fc-timegrid-event .fc-event-main {
            padding: 2px 4px !important;
            font-size: 0.875rem !important;
          }
          .fc .fc-timegrid-slot {
            height: 3em !important;
          }
          .fc .fc-timegrid-slot-lane {
            border-bottom: 1px solid var(--border) !important;
          }
          .fc .fc-timegrid-col-events {
            margin: 0 !important;
            position: relative !important;
          }
          .fc-direction-ltr .fc-timegrid-col-events {
            margin: 0 1% !important;
          }
          .availability-event {
            border-radius: 4px !important;
            margin: 1px !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
            opacity: 0.9 !important;
          }
          .availability-event:hover {
            opacity: 1 !important;
            z-index: 5 !important;
            transform: scale(1.02);
          }
          .fc-timegrid-event.fc-event-mirror {
            opacity: 0.7 !important;
          }
          .fc-timegrid-more-link {
            background: none !important;
            border: 1px solid var(--border) !important;
            padding: 2px 4px !important;
            border-radius: 4px !important;
            color: var(--foreground) !important;
          }
          .fc-timegrid-now-indicator-line {
            border-color: #ef4444 !important;
          }
          .fc-timegrid-now-indicator-arrow {
            border-color: #ef4444 !important;
          }
          .fc-multimonth-title {
            font-size: 1.25rem !important;
            padding: 0.5rem !important;
            background-color: var(--background) !important;
            border-bottom: 1px solid var(--border) !important;
          }
          .fc-multimonth-header {
            background-color: var(--muted) !important;
          }
          .fc-multimonth-daygrid {
            background-color: var(--background) !important;
          }
          .fc-multimonth-month {
            border: 1px solid var(--border) !important;
            border-radius: 0.5rem !important;
            overflow: hidden !important;
            margin: 0.5rem !important;
          }
          @media (max-width: 640px) {
            .fc .fc-toolbar {
              flex-direction: column;
              gap: 1rem;
            }
            .fc .fc-toolbar-title {
              font-size: 1.2rem;
            }
            .fc-header-toolbar {
              margin-bottom: 1.5em !important;
            }
            .fc-timegrid-event .fc-event-main {
              font-size: 0.75rem !important;
            }
          }
        `}
      </style>

      <div className="rounded-md border overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay'
          }}
          views={{
            multiMonthYear: {
              type: 'multiMonth',
              duration: { years: 1 }
            }
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
          forceEventDuration={true}
          displayEventEnd={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          eventDidMount={(info) => {
            info.el.title = `${info.event.title}\nDébut: ${new Date(info.event.start!).toLocaleTimeString('fr-FR')}\nFin: ${new Date(info.event.end!).toLocaleTimeString('fr-FR')}`;
          }}
          eventClick={handleEventClick}
        />
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plage horaire</DialogTitle>
            <DialogDescription>
              {selectedEvent && (
                <>
                  {selectedEvent.title}
                  <br />
                  Du {new Date(selectedEvent.start).toLocaleString('fr-FR')}
                  <br />
                  Au {new Date(selectedEvent.end).toLocaleString('fr-FR')}
                </>
              )}
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
    </div>
  );
}