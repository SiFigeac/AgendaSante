import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema, type Appointment } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";

interface AppointmentDetailDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 appointment: Appointment;
}

export function AppointmentDetailDialog({
 open,
 onOpenChange,
 appointment,
}: AppointmentDetailDialogProps) {
 const { toast } = useToast();
 const [doctorSearch, setDoctorSearch] = useState("");
 const [showDoctorResults, setShowDoctorResults] = useState(false);

 const { data: patients } = useQuery({
   queryKey: ["/api/patients"],
 });

 const { data: doctors } = useQuery({
   queryKey: ["/api/users"],
   select: (users) => users?.filter((u: any) => u.role === "doctor"),
 });

 // Trouver le patient actuel
 const currentPatient = patients?.find(p => p.id === appointment.patientId);
 const patientName = currentPatient 
   ? `${currentPatient.firstName} ${currentPatient.lastName}`
   : 'Patient inconnu';

 // Filtrer les médecins selon la recherche
 const filteredDoctors = doctors?.filter((doctor: any) => {
   if (!doctorSearch) return true;
   const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
   return fullName.includes(doctorSearch.toLowerCase());
 });

 // Trouver le médecin actuel
 const currentDoctor = doctors?.find(d => d.id === appointment.doctorId);
 const [selectedDoctor, setSelectedDoctor] = useState(currentDoctor);

 const form = useForm({
   resolver: zodResolver(insertAppointmentSchema),
   defaultValues: {
     doctorId: appointment.doctorId,
     patientId: appointment.patientId,
     startTime: format(new Date(appointment.startTime), "yyyy-MM-dd'T'HH:mm"),
     endTime: format(new Date(appointment.endTime), "yyyy-MM-dd'T'HH:mm"),
     type: appointment.type,
     status: appointment.status,
     notes: appointment.notes || "",
   },
 });

 const updateAppointment = useMutation({
   mutationFn: async (data) => {
     const formattedData = {
       ...data,
       startTime: new Date(data.startTime).toISOString(),
       endTime: new Date(data.endTime).toISOString(),
     };
     const res = await apiRequest(
       "PATCH",
       `/api/appointments/${appointment.id}`,
       formattedData
     );
     return res.json();
   },
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
     toast({
       title: "Succès",
       description: "Rendez-vous modifié avec succès",
     });
     onOpenChange(false);
   },
   onError: (error: Error) => {
     toast({
       title: "Erreur",
       description: error.message,
       variant: "destructive",
     });
   },
 });

 const deleteAppointment = useMutation({
   mutationFn: async () => {
     await apiRequest("DELETE", `/api/appointments/${appointment.id}`);
   },
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
     toast({
       title: "Succès",
       description: "Rendez-vous supprimé avec succès",
     });
     onOpenChange(false);
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
         <DialogTitle>Détails du rendez-vous - {patientName}</DialogTitle>
       </DialogHeader>

       <div className="mb-4 text-sm text-muted-foreground">
         {currentPatient && (
           <p>Date de naissance : {format(new Date(currentPatient.dateOfBirth), 'dd/MM/yyyy')}</p>
         )}
       </div>

       <Form {...form}>
         <form
           onSubmit={form.handleSubmit((data) => updateAppointment.mutate(data))}
           className="space-y-4"
         >
           <FormField
             control={form.control}
             name="doctorId"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Médecin</FormLabel>
                 <div className="relative">
                   <div className="flex gap-2">
                     <FormControl>
                       <Input
                         placeholder="Rechercher un médecin..."
                         value={doctorSearch || (selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : '')}
                         onChange={(e) => {
                           setDoctorSearch(e.target.value);
                           setShowDoctorResults(true);
                         }}
                         onFocus={() => setShowDoctorResults(true)}
                       />
                     </FormControl>
                     <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                   </div>
                   {showDoctorResults && filteredDoctors && filteredDoctors.length > 0 && (
                     <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
                       {filteredDoctors.map((doctor: any) => (
                         <div
                           key={doctor.id}
                           className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                           onClick={() => {
                             field.onChange(doctor.id);
                             setSelectedDoctor(doctor);
                             setDoctorSearch("");
                             setShowDoctorResults(false);
                           }}
                         >
                           <div
                             className="w-3 h-3 rounded-full"
                             style={{ backgroundColor: doctor.color }}
                           />
                           <span>{doctor.lastName} {doctor.firstName}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
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
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
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
             name="status"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Statut</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                   <FormControl>
                     <SelectTrigger>
                       <SelectValue placeholder="Sélectionnez le statut" />
                     </SelectTrigger>
                   </FormControl>
                   <SelectContent>
                     <SelectItem value="scheduled">Planifié</SelectItem>
                     <SelectItem value="confirmed">Confirmé</SelectItem>
                     <SelectItem value="cancelled">Annulé</SelectItem>
                   </SelectContent>
                 </Select>
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
                     onChange={(e) => field.onChange(e.target.value)}
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

           <div className="flex gap-2">
             <Button
               type="button"
               variant="destructive"
               onClick={() => deleteAppointment.mutate()}
               disabled={deleteAppointment.isPending}
               className="flex-1"
             >
               {deleteAppointment.isPending && (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               )}
               Supprimer
             </Button>
             <Button
               type="submit"
               disabled={updateAppointment.isPending}
               className="flex-1"
             >
               {updateAppointment.isPending && (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               )}
               Modifier
             </Button>
           </div>
         </form>
       </Form>
     </DialogContent>
   </Dialog>
 );
}