import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Appointment, Patient } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AppointmentDetailDialog } from '@/components/appointments/appointment-detail-dialog';

interface DayPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  appointments: any[];
  patients: Patient[];
}

export function DayPreviewDialog({
  open,
  onOpenChange,
  date,
  appointments,
  patients,
}: DayPreviewDialogProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Filtrer les rendez-vous pour la date sélectionnée
  const dayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.start);
    return format(aptDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Rendez-vous du {format(date, 'd MMMM yyyy', { locale: fr })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {dayAppointments.length === 0 ? (
              <p className="text-muted-foreground">
                Aucun rendez-vous prévu pour cette journée.
              </p>
            ) : (
              dayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-lg border flex flex-col gap-2 hover:bg-accent cursor-pointer"
                  onClick={() => setSelectedAppointment(apt.extendedProps.appointment)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{apt.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(apt.start), 'HH:mm')} - {format(new Date(apt.end), 'HH:mm')}
                      </div>
                    </div>
                    <Badge
                      variant={apt.extendedProps.status === 'confirmed' ? 'default' :
                              apt.extendedProps.status === 'cancelled' ? 'destructive' : 'secondary'}
                      className="capitalize"
                    >
                      {apt.extendedProps.status === 'confirmed' ? 'Confirmé' :
                       apt.extendedProps.status === 'cancelled' ? 'Annulé' : 'Planifié'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: apt.backgroundColor }}
                      />
                      {apt.extendedProps.doctor ? 
                        `Dr. ${apt.extendedProps.doctor.lastName} ${apt.extendedProps.doctor.firstName}` : 
                        'Médecin non assigné'}
                    </div>
                    <div className="mt-1">
                      Type : {apt.extendedProps.type === 'consultation' ? 'Consultation' :
                             apt.extendedProps.type === 'follow-up' ? 'Suivi' : 'Urgence'}
                    </div>
                    {apt.extendedProps.appointment.motif && (
                      <div className="mt-1 font-medium">
                        Motif : {apt.extendedProps.appointment.motif}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
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