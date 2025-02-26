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
import listPlugin from "@fullcalendar/list";
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

  // Récupérer les rendez-vous pour afficher les couleurs des médecins
  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments"],
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

  // Combiner les disponibilités et les rendez-vous pour le calendrier
  const events = [
    ...(availabilities?.map(availability => {
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
          type: 'availability',
          isBooked: availability.isBooked,
          doctorId: availability.doctorId,
        }
      };
    }) || []),
    ...(appointments?.map(appointment => {
      const doctor = doctors?.find(d => d.id === appointment.doctorId);
      return {
        id: `apt-${appointment.id}`,
        title: `RDV: ${appointment.type}`,
        start: appointment.startTime,
        end: appointment.endTime,
        backgroundColor: doctor?.color || '#cbd5e1',
        borderColor: doctor?.color || '#cbd5e1',
        textColor: '#000000',
        classNames: ['appointment-event'],
        extendedProps: {
          type: 'appointment',
          doctorId: appointment.doctorId,
          patientName: appointment.patientName || 'Non spécifié',
        }
      };
    }) || [])
  ].filter(event => !selectedDoctor || event.extendedProps.doctorId === selectedDoctor);

  const handleEventClick = (info: any) => {
    if (info.event.extendedProps.type === 'availability') {
      setSelectedEvent({
        id: parseInt(info.event.id),
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        isBooked: info.event.extendedProps.isBooked,
      });
    }
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
            --fc-border-color: var(--border);
            --fc-button-text-color: var(--foreground);
            --fc-button-bg-color: var(--primary);
            --fc-button-border-color: var(--primary);
            --fc-button-hover-bg-color: var(--primary-hover);
            --fc-button-hover-border-color: var(--primary-hover);
            --fc-button-active-bg-color: var(--primary-active);
            --fc-button-active-border-color: var(--primary-active);
          }
          .fc .fc-button {
            @apply shadow-sm;
          }
          .fc .fc-button-primary:not(:disabled) {
            @apply bg-primary text-primary-foreground hover:bg-primary/90;
          }
          .fc .fc-button-primary:disabled {
            @apply opacity-50 cursor-not-allowed;
          }
          .fc .fc-toolbar-title {
            @apply text-xl font-semibold;
          }
          .fc-theme-standard .fc-list {
            @apply border rounded-md;
          }
          .fc .fc-list-empty {
            @apply bg-muted/50;
          }
          .fc .fc-list-event:hover td {
            @apply bg-muted/50;
          }
          .fc-direction-ltr .fc-list-day-side-text {
            @apply float-none;
          }
          .fc .fc-list-event-dot {
            @apply border-4;
          }
          .fc-theme-standard .fc-list-day-cushion {
            @apply bg-muted/30;
          }
          .availability-event, .appointment-event {
            @apply rounded-md shadow-sm transition-transform duration-200;
          }
          .availability-event:hover, .appointment-event:hover {
            @apply transform scale-[1.02] shadow-md z-10;
          }
          .fc-timegrid-event-harness {
            @apply m-0;
          }
          .fc-timegrid-event {
            @apply border-none m-[1px];
          }
          .fc-timegrid-event .fc-event-main {
            @apply p-2 text-sm;
          }
          .fc .fc-timegrid-slot {
            @apply h-12;
          }
          .fc .fc-timegrid-col-events {
            @apply m-0;
          }
          .fc-direction-ltr .fc-timegrid-col-events {
            @apply mx-[1%];
          }
          .fc-v-event {
            @apply border-none;
          }
          .fc-multimonth {
            @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4;
          }
          .fc-multimonth-month {
            @apply border rounded-lg overflow-hidden;
          }
          .fc-multimonth-title {
            @apply text-lg font-semibold p-4 bg-muted/30;
          }
          @media (max-width: 640px) {
            .fc .fc-toolbar {
              @apply flex-col gap-4;
            }
            .fc .fc-toolbar-title {
              @apply text-lg;
            }
            .fc-header-toolbar {
              @apply mb-6;
            }
            .fc-timegrid-event .fc-event-main {
              @apply text-xs;
            }
          }
        `}
      </style>

      <div className="rounded-lg border overflow-hidden bg-card">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          views={{
            multiMonthYear: {
              type: 'multiMonth',
              duration: { years: 1 }
            },
            listWeek: {
              type: 'list',
              duration: { days: 30 },
              buttonText: '30 jours'
            }
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
            const type = info.event.extendedProps.type;
            const title = type === 'availability'
              ? `${info.event.title}\nDébut: ${new Date(info.event.start!).toLocaleTimeString('fr-FR')}\nFin: ${new Date(info.event.end!).toLocaleTimeString('fr-FR')}`
              : `${info.event.title}\nPatient: ${info.event.extendedProps.patientName}\nDébut: ${new Date(info.event.start!).toLocaleTimeString('fr-FR')}\nFin: ${new Date(info.event.end!).toLocaleTimeString('fr-FR')}`;
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