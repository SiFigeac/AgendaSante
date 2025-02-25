import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAvailabilitySchema } from "@shared/schema";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { User, Availability } from "@shared/schema";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addHours } from "date-fns";

export function AvailabilityManager() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  const createAvailability = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedDoctor) {
        throw new Error("Veuillez sélectionner un médecin");
      }

      // Convertir les dates en format ISO
      const formattedData = {
        doctorId: selectedDoctor,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      };

      const res = await apiRequest("POST", "/api/availability", formattedData);
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
        description: "Plage horaire créée avec succès",
      });
      form.reset();
      setSelectedDoctor(null);
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
      const res = await apiRequest("PATCH", `/api/availability/${selectedAvailability.id}`, {
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
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
      setSelectedAvailability(null);
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
      setSelectedAvailability(null);
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

  // Formater le nom du médecin
  const formatDoctorName = (doctor: User) => {
    return `${doctor.lastName} ${doctor.firstName}`;
  };

  const selectedDoctorInfo = doctors?.find(d => d.id === selectedDoctor);
  const selectedDoctorName = selectedDoctorInfo 
    ? formatDoctorName(selectedDoctorInfo)
    : "Sélectionnez un médecin";

  const handleRowClick = (availability: Availability) => {
    setSelectedAvailability(availability);
    form.setValue("startTime", new Date(availability.startTime).toISOString().slice(0, 16));
    form.setValue("endTime", new Date(availability.endTime).toISOString().slice(0, 16));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4">
        <h2 className="text-lg font-semibold mb-4">Créer une plage horaire</h2>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createAvailability.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Médecin</FormLabel>
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Rechercher un médecin..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && filteredDoctors && filteredDoctors.length > 0 && !selectedDoctor && (
                      <div className="border rounded-md p-2 space-y-1">
                        {filteredDoctors.map(doctor => (
                          <Button
                            key={doctor.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              setSelectedDoctor(doctor.id);
                              field.onChange(doctor.id);
                              setSearchTerm("");
                            }}
                          >
                            {formatDoctorName(doctor)}
                          </Button>
                        ))}
                      </div>
                    )}
                    {selectedDoctor && (
                      <div className="flex items-center gap-2">
                        <span>{selectedDoctorName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDoctor(null);
                            field.onChange(null);
                          }}
                        >
                          Changer
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <Button type="submit" disabled={createAvailability.isPending || !selectedDoctor}>
              {createAvailability.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Créer la plage horaire
            </Button>
          </form>
        </Form>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Médecin</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Horaires</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availabilities?.map((availability) => {
              const doctor = doctors?.find(d => d.id === availability.doctorId);
              return doctor ? (
                <TableRow 
                  key={availability.id} 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleRowClick(availability)}
                >
                  <TableCell>{formatDoctorName(doctor)}</TableCell>
                  <TableCell>
                    {format(new Date(availability.startTime), 'dd MMMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(availability.startTime), 'HH:mm')} - {format(new Date(availability.endTime), 'HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={availability.isBooked ? "secondary" : "default"}>
                      {availability.isBooked ? "Réservé" : "Disponible"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ) : null;
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedAvailability} onOpenChange={() => {
        setSelectedAvailability(null);
        setIsEditing(false);
        form.reset();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plage horaire</DialogTitle>
            {!isEditing ? (
              <DialogDescription>
                {doctors?.find(d => d.id === selectedAvailability?.doctorId)
                  ? formatDoctorName(doctors.find(d => d.id === selectedAvailability.doctorId)!)
                  : ""}
                <br />
                Du {selectedAvailability && new Date(selectedAvailability.startTime).toLocaleString('fr-FR')}
                <br />
                Au {selectedAvailability && new Date(selectedAvailability.endTime).toLocaleString('fr-FR')}
              </DialogDescription>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => updateAvailability.mutate(data))}
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
              {!selectedAvailability?.isBooked && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteAvailability.mutate(selectedAvailability?.id)}
                  >
                    Supprimer
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setSelectedAvailability(null)}>
                Fermer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}