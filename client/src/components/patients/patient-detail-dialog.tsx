import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Patient, Appointment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentDetailDialog } from "@/components/appointments/appointment-detail-dialog";
import { useState } from "react";

interface PatientDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}

export function PatientDetailDialog({
  open,
  onOpenChange,
  patient,
}: PatientDetailDialogProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  // Filtrer les rendez-vous du patient
  const patientAppointments = appointments?.filter(apt => apt.patientId === patient.id) || [];

  // Séparer les rendez-vous passés et à venir
  const now = new Date();
  const upcomingAppointments = patientAppointments
    .filter(apt => new Date(apt.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const pastAppointments = patientAppointments
    .filter(apt => new Date(apt.startTime) <= now)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {patient.firstName} {patient.lastName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm space-y-2">
              <p>Date de naissance : {format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')}</p>
              <p>Téléphone : {patient.phone}</p>
              <p>Email : {patient.email}</p>
              {patient.notes && <p>Notes : {patient.notes}</p>}
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="upcoming" className="flex-1">
                  Rendez-vous à venir ({upcomingAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="flex-1">
                  Rendez-vous passés ({pastAppointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4 mt-4">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun rendez-vous à venir
                  </p>
                ) : (
                  upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 rounded-lg border flex items-center justify-between hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedAppointment(apt)}
                    >
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(apt.startTime), 'dd MMMM yyyy', { locale: fr })}
                        </div>
                        <div className="font-medium">
                          {format(new Date(apt.startTime), 'HH:mm')} - {format(new Date(apt.endTime), 'HH:mm')}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          Type : {apt.type === 'consultation' ? 'Consultation' :
                                 apt.type === 'follow-up' ? 'Suivi' : 'Urgence'}
                        </div>
                      </div>
                      <Badge
                        variant={apt.status === 'confirmed' ? 'default' : 
                                apt.status === 'cancelled' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {apt.status === 'confirmed' ? 'Confirmé' :
                         apt.status === 'cancelled' ? 'Annulé' : 'Planifié'}
                      </Badge>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4 mt-4">
                {pastAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun rendez-vous passé
                  </p>
                ) : (
                  pastAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 rounded-lg border flex items-center justify-between hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedAppointment(apt)}
                    >
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(apt.startTime), 'dd MMMM yyyy', { locale: fr })}
                        </div>
                        <div className="font-medium">
                          {format(new Date(apt.startTime), 'HH:mm')} - {format(new Date(apt.endTime), 'HH:mm')}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          Type : {apt.type === 'consultation' ? 'Consultation' :
                                 apt.type === 'follow-up' ? 'Suivi' : 'Urgence'}
                        </div>
                      </div>
                      <Badge
                        variant={apt.status === 'confirmed' ? 'default' : 
                                apt.status === 'cancelled' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {apt.status === 'confirmed' ? 'Confirmé' :
                         apt.status === 'cancelled' ? 'Annulé' : 'Planifié'}
                      </Badge>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {selectedAppointment && (
        <AppointmentDetailDialog
          open={!!selectedAppointment}
          onOpenChange={(open) => !open && setSelectedAppointment(null)}
          appointment={selectedAppointment}
        />
      )}
    </>
  );
}
