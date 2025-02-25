import { useQuery, useMutation } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from "@fullcalendar/core/locales/fr";
import interactionPlugin from "@fullcalendar/interaction";
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
    mutationFn: async (data: { id: number, startTime: string, endTime: string }) => {
      console.log("Moving availability:", data);
      const res = await apiRequest("PATCH", `/api/availability/${data.id}`, {
        startTime: data.startTime,
        endTime: data.endTime,
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Succès",
        description: "La plage horaire a été déplacée",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAvailability = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/availability/${id}`);
      if (!res.ok) {
        throw new Error("Erreur lors de la suppression");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Succès",
        description: "La plage horaire a été supprimée",
      });
      setSelectedEvent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrer les médecins en fonction du terme de recherche
  const filteredDoctors = doctors?.filter(doctor => {
    const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Formatage du nom du médecin
  const formatDoctorName = (doctor: User) => {
    return `${doctor.lastName} ${doctor.firstName}`;
  };

  // Convertir les disponibilités en événements pour FullCalendar
  const events = availabilities?.map(availability => {
    const doctor = doctors?.find(d => d.id === availability.doctorId);
    return {
      id: availability.id.toString(),
      title: doctor ? formatDoctorName(doctor) : "Disponible",
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

  const handleEventDrop = (info: any) => {
    const eventId = parseInt(info.event.id);
    const startTime = info.event.start.toISOString();
    const endTime = info.event.end.toISOString();

    updateAvailability.mutate({
      id: eventId,
      startTime,
      endTime,
    });
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
              {formatDoctorName(doctor)}
            </Button>
          ))}
        </div>
      )}

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
          eventClick={handleEventClick}
          editable={true}
          eventDrop={handleEventDrop}
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
      )}
    </div>
  );
}