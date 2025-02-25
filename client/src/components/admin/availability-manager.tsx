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
import { useState } from "react";

export function AvailabilityManager() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);

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

  const createAvailability = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/availability", data);
      if (!res.ok) {
        throw new Error(await res.text());
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

  // Filtrer les médecins en fonction du terme de recherche
  const filteredDoctors = doctors?.filter(doctor => {
    const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const selectedDoctorName = doctors?.find(d => d.id === selectedDoctor)
    ? `${doctors.find(d => d.id === selectedDoctor)?.firstName} ${doctors.find(d => d.id === selectedDoctor)?.lastName}`
    : "Sélectionnez un médecin";

  return (
    <div className="space-y-6">
      <div className="rounded-md border p-4">
        <h2 className="text-lg font-semibold mb-4">Créer une plage horaire</h2>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createAvailability.mutate({...data, doctorId: selectedDoctor}))}
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
                            {doctor.firstName} {doctor.lastName}
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
              return (
                <TableRow key={availability.id}>
                  <TableCell>{doctor?.firstName} {doctor?.lastName}</TableCell>
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
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}