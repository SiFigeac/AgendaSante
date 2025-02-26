import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
}

export function AppointmentForm({ open, onOpenChange, selectedDate }: AppointmentFormProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: doctors } = useQuery({
    queryKey: ["/api/users"],
    select: (users) => users?.filter((u: any) => u.role === "doctor"),
  });

  const form = useForm({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      startTime: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
      status: "scheduled" as const,
    },
  });

  // Obtenir le patient sélectionné
  const selectedPatientId = form.watch("patientId");
  const currentPatient = patients?.find((p: any) => p.id === selectedPatientId);

  // Filtrer les médecins selon la recherche
  const filteredDoctors = doctors?.filter((doctor: any) => {
    const search = searchTerm.toLowerCase();
    if (!search) return true;
    const lastName = doctor.lastName?.toLowerCase() || '';
    const firstName = doctor.firstName?.toLowerCase() || '';
    return lastName.includes(search) || firstName.includes(search);
  });

  const createAppointment = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Succès",
        description: "Rendez-vous créé avec succès",
      });
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouveau rendez-vous</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createAppointment.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients?.map((patient: any) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentPatient && (
              <div className="text-sm text-muted-foreground">
                Date de naissance : {format(new Date(currentPatient.dateOfBirth), 'dd/MM/yyyy')}
              </div>
            )}

            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Médecin</FormLabel>
                  <div className="flex gap-4 justify-end">
                    <div className="flex gap-2 items-center w-full">
                      <Input
                        placeholder="Rechercher un médecin..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                      {selectedDoctor && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedDoctor(null);
                            setSearchTerm("");
                            field.onChange(null);
                          }}
                        >
                          Effacer
                        </Button>
                      )}
                    </div>
                  </div>

                  {searchTerm && filteredDoctors && filteredDoctors.length > 0 && (
                    <div className="border rounded-md p-2 space-y-1 bg-card mt-2">
                      {filteredDoctors.map(doctor => (
                        <Button
                          key={doctor.id}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            field.onChange(doctor.id);
                            setSelectedDoctor(doctor.id);
                            setSearchTerm(`${doctor.lastName} ${doctor.firstName}`);
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="follow-up">Suivi</SelectItem>
                      <SelectItem value="emergency">Urgence</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif de la consultation</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Décrivez le motif de la consultation" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date et heure du rendez-vous</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        // Mettre à jour automatiquement l'heure de fin (+1 heure)
                        const startDate = new Date(e.target.value);
                        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                        form.setValue("endTime", format(endDate, "yyyy-MM-dd'T'HH:mm"));
                      }}
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
                  <FormLabel>Date et heure de fin du rendez-vous</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={createAppointment.isPending}>
              {createAppointment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Créer le rendez-vous
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}