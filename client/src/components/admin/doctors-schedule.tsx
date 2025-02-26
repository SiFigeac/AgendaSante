import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { format } from 'date-fns'

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

  const events = availabilities?.map(availability => {
    const doctor = doctors?.find(d => d.id === availability.doctorId);
    return {
      id: availability.id.toString(),
      resourceId: availability.id.toString(), 
      title: doctor ? `Dr. ${doctor.lastName} ${doctor.firstName}` : "Disponible",
      start: new Date(availability.startTime).toISOString(), 
      end: new Date(availability.endTime).toISOString(),    
      backgroundColor: doctor?.color || '#cbd5e1',
      borderColor: doctor?.color || '#cbd5e1',
      textColor: '#000000',
      display: 'block',
      extendedProps: {
        isBooked: availability.isBooked,
        doctorId: availability.doctorId,
      }
    };
  }).filter(event => !selectedDoctor || event.extendedProps.doctorId === selectedDoctor) || [];

  const handleEventDrop = (info: EventDropArg) => {
    const eventId = parseInt(info.event.id);
    const startTime = info.event.start;
    const endTime = info.event.end;

    if (!startTime || !endTime) {
      info.revert();
      return;
    }

    updateAvailability.mutate({ id: eventId, startTime, endTime });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 justify-end">
        <div className="flex gap-2 items-center w-[250px]">
          <Input
            placeholder="Rechercher un médecin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {selectedDoctor && (
            <Button
              variant="ghost"
              onClick={() => setSelectedDoctor(null)}
            >
              Tous
            </Button>
          )}
        </div>
      </div>

      {searchTerm && doctors && doctors.length > 0 && !selectedDoctor && (
        <div className="border rounded-md p-2 space-y-1 bg-card">
          {doctors.map(doctor => (
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
          .fc-timegrid-slot {
            height: 6em !important;
          }
          .fc-timegrid-slot-lane {
            height: 6em !important;
          }
          .fc-timegrid-event-harness {
            margin: 2px 0 !important;
          }
          .fc-timegrid-event {
            margin: 0 4px !important;
            border-radius: 4px !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
            background-color: var(--event-color, inherit) !important;
          }
          .fc-event-time, .fc-event-title {
            padding: 2px 4px !important;
            font-size: 0.875rem !important;
          }
          .fc-v-event {
            background-color: var(--event-color, inherit) !important;
            border: none !important;
          }
          .fc-event-main {
            padding: 2px !important;
          }
          .fc-event-main-frame {
            height: 100% !important;
          }
          .fc-timegrid-col-events {
            margin: 0 !important;
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
          nowIndicator={true}
          slotEventOverlap={false}
          forceEventDuration={true}
          displayEventEnd={true}
          slotDuration="01:00:00"
          eventDidMount={(info) => {
            if (info.event.backgroundColor) {
              info.el.style.setProperty('--event-color', info.event.backgroundColor);
            }
          }}
          eventContent={(info) => (
            <div className="fc-event-main-frame">
              <div className="fc-event-title-container">
                <div className="fc-event-title fc-sticky">
                  {info.event.title}
                </div>
                <div className="text-xs opacity-75">
                  {format(new Date(info.event.start!), 'HH:mm')} - {format(new Date(info.event.end!), 'HH:mm')}
                </div>
              </div>
            </div>
          )}
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
                  Du {format(new Date(selectedEvent.start), 'dd/MM/yyyy HH:mm')}
                  <br />
                  Au {format(new Date(selectedEvent.end), 'dd/MM/yyyy HH:mm')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}