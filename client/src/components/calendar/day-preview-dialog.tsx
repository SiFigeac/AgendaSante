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
                  className="rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedAppointment(apt.extendedProps.appointment)}
                >
                  {/* En-tête avec patient et statut */}
                  <div className="border-b p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: apt.backgroundColor }}
                          />
                          <span className="font-medium">{apt.title}</span>
                        </div>
                        {apt.extendedProps.appointment.motif && (
                          <div className="text-sm pl-4">
                            {apt.extendedProps.appointment.motif}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={apt.extendedProps.status === 'confirmed' ? 'default' :
                                apt.extendedProps.status === 'cancelled' ? 'destructive' : 'secondary'}
                        className="capitalize flex-shrink-0"
                      >
                        {apt.extendedProps.status === 'confirmed' ? 'Confirmé' :
                         apt.extendedProps.status === 'cancelled' ? 'Annulé' : 'Planifié'}
                      </Badge>
                    </div>
                  </div>

                  {/* Détails du rendez-vous */}
                  <div className="p-3 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {apt.extendedProps.doctor ? 
                        `Dr. ${apt.extendedProps.doctor.lastName} ${apt.extendedProps.doctor.firstName}` : 
                        'Médecin non assigné'}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {format(new Date(apt.start), 'HH:mm')} - {format(new Date(apt.end), 'HH:mm')}
                      </span>
                      •
                      <span className="capitalize">
                        {apt.extendedProps.type === 'consultation' ? 'Consultation' :
                         apt.extendedProps.type === 'follow-up' ? 'Suivi' : 'Urgence'}
                      </span>
                    </div>
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