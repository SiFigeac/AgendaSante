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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  preselectedDoctorId?: number;
}

export function AppointmentForm({ 
  open, 
  onOpenChange, 
  selectedDate,
  preselectedDoctorId 
}: AppointmentFormProps) {
  const { toast } = useToast();
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: doctors } = useQuery({
    queryKey: ["/api/admin/users"],
    select: (users) => users?.filter((u: any) => u.role === "doctor"),
  });

  const form = useForm({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      startTime: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(new Date(selectedDate.getTime() + 30 * 60000), "yyyy-MM-dd'T'HH:mm"),
      status: "scheduled" as const,
      doctorId: preselectedDoctorId,
    },
  });

  // Obtenir le patient sélectionné
  const selectedPatientId = form.watch("patientId");
  const currentPatient = patients?.find((p: any) => p.id === selectedPatientId);

  // Filtrer les médecins selon la recherche
  const filteredDoctors = doctors?.filter((doctor: any) => {
    if (!searchValue) return true;
    const search = searchValue.toLowerCase();
    const lastName = (doctor.lastName || '').toLowerCase();
    const firstName = (doctor.firstName || '').toLowerCase();
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
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className="w-full justify-between"
                        >
                          {field.value
                            ? doctors?.find((doctor) => doctor.id === field.value)?.lastName + " " +
                              doctors?.find((doctor) => doctor.id === field.value)?.firstName
                            : "Sélectionnez un médecin"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Rechercher un médecin..."
                          value={searchValue}
                          onValueChange={setSearchValue}
                        />
                        <CommandEmpty>Aucun médecin trouvé.</CommandEmpty>
                        <CommandGroup>
                          {filteredDoctors?.map((doctor) => (
                            <CommandItem
                              key={doctor.id}
                              value={`${doctor.lastName} ${doctor.firstName}`}
                              onSelect={() => {
                                field.onChange(doctor.id);
                                setOpenCombobox(false);
                                setSearchValue("");
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: doctor.color }}
                                />
                                <span>Dr. {doctor.lastName} {doctor.firstName}</span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  field.value === doctor.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                        // Mettre à jour automatiquement l'heure de fin (+30 minutes)
                        const startDate = new Date(e.target.value);
                        const endDate = new Date(startDate.getTime() + 30 * 60000);
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
                    <Input {...field} placeholder="Notes additionnelles" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createAppointment.isPending}
            >
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