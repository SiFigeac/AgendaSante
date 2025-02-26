import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EventDropArg } from "@fullcalendar/core";
import type { User, Availability } from "@shared/schema";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    const search = searchTerm.toLowerCase();
    if (!search) return true;
    const lastName = (doctor.lastName || '').toLowerCase();
    const firstName = (doctor.firstName || '').toLowerCase();
    return lastName.includes(search) || firstName.includes(search);
  });

  if (!doctors) {
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
        <div className="border rounded-md p-2 space-y-1 bg-card">
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
            min-height: 700px;
          }
          .availability-event {
            border-radius: 4px !important;
            margin: 0 !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }
          .availability-event:hover {
            transform: scale(1.02);
            z-index: 5 !important;
          }
          .fc-timegrid-event-harness {
            left: 0 !important;
            right: 0 !important;
          }
          .fc-timegrid-event {
            margin: 0 2% !important;
            border: none !important;
          }
          .fc-timegrid-col-events {
            margin: 0 !important;
          }
          .fc-v-event {
            border: none !important;
          }
          .fc-timegrid-event.fc-event-mirror {
            opacity: 0.7 !important;
          }
          .fc-timegrid-slot {
            height: 3em !important;
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
              padding: 2px !important;
            }
          }
        `}
      </style>

      <div className="rounded-lg border overflow-hidden bg-card">
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
          editable={true}
          eventDrop={handleEventDrop}
          dragScroll={true}
          dayMaxEvents={true}
          snapDuration="00:15:00"
          eventResizableFromStart={true}
          eventDurationEditable={true}
          eventOverlap={true}
          nowIndicator={true}
          slotEventOverlap={true}
          forceEventDuration={true}
          displayEventEnd={true}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          eventDidMount={(info) => {
            const title = `${info.event.title}\nDébut: ${new Date(info.event.start!).toLocaleTimeString('fr-FR')}\nFin: ${new Date(info.event.end!).toLocaleTimeString('fr-FR')}`;
            info.el.title = title;
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
            {!selectedEvent?.isBooked && (
              <Button
                variant="destructive"
                onClick={() => deleteAvailability.mutate(selectedEvent?.id)}
                disabled={deleteAvailability.isPending}
              >
                {deleteAvailability.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Supprimer"
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}