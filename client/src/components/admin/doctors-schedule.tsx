import { useQuery, useMutation } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import frLocale from "@fullcalendar/core/locales/fr";
import interactionPlugin from "@fullcalendar/interaction";
import type { User, Availability } from "@shared/schema";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAvailabilitySchema } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { addHours } from "date-fns";

export function DoctorsSchedule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: doctors } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    select: (users) => users?.filter(u => u.role === "doctor"),
  });

  const { data: availabilities } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
  });

  const form = useForm({
    resolver: zodResolver(insertAvailabilitySchema),
  });

  // Surveiller les changements de la date de début pour mettre à jour la date de fin
  const startTime = form.watch("startTime");
  useEffect(() => {
    if (startTime) {
      const newEndTime = addHours(new Date(startTime), 1);
      form.setValue("endTime", newEndTime.toISOString().slice(0, 16));
    }
  }, [startTime, form]);

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

  const updateAvailability = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedEvent?.id) {
        throw new Error("Aucune plage horaire sélectionnée");
      }

      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);

      if (startDate >= endDate) {
        throw new Error("La date de début doit être antérieure à la date de fin");
      }

      console.log("Updating availability:", selectedEvent.id, data);

      const res = await apiRequest("PATCH", `/api/availability/${selectedEvent.id}`, {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la modification");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({
        title: "Succès",
        description: "La plage horaire a été modifiée",
      });
      setSelectedEvent(null);
      setIsEditing(false);
      form.reset();
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
    setIsEditing(false);

    // Initialiser le formulaire avec les valeurs actuelles
    form.reset({
      startTime: event.start.toISOString().slice(0, 16),
      endTime: event.end.toISOString().slice(0, 16)
    });
  };

  const handleModifyClick = () => {
    if (!selectedEvent) return;

    // Réinitialiser le formulaire avec les valeurs actuelles
    form.reset({
      startTime: new Date(selectedEvent.start).toISOString().slice(0, 16),
      endTime: new Date(selectedEvent.end).toISOString().slice(0, 16)
    });

    setIsEditing(true);
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
        />
      </div>

      {selectedEvent && (
        <Dialog 
          open={!!selectedEvent} 
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEvent(null);
              setIsEditing(false);
              form.reset();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Plage horaire</DialogTitle>
              {!isEditing ? (
                <DialogDescription>
                  {selectedEvent?.title}
                  <br />
                  Du {new Date(selectedEvent?.start).toLocaleString('fr-FR')}
                  <br />
                  Au {new Date(selectedEvent?.end).toLocaleString('fr-FR')}
                </DialogDescription>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) => {
                      console.log("Form submitted with data:", data);
                      updateAvailability.mutate(data);
                    })}
                    className="space-y-4 mt-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date et heure de début</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date et heure de fin</FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={updateAvailability.isPending}>
                        {updateAvailability.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Modifier
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </DialogHeader>
            {!isEditing && (
              <div className="flex justify-end gap-2 mt-4">
                {!selectedEvent?.isBooked && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleModifyClick}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteAvailability.mutate(selectedEvent?.id)}
                    >
                      Supprimer
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                  Fermer
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}