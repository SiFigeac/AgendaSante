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
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: apt.backgroundColor }}
                        />
                        <span className="font-medium">{apt.title}</span>
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
                  </div>

                  <div className="p-3 space-y-3">
                    {/* Motif de la consultation */}
                    {apt.extendedProps.appointment.motif && (
                      <div className="bg-primary/[0.08] rounded-md p-2.5">
                        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                          Motif
                        </div>
                        <div className="text-sm leading-relaxed">
                          {apt.extendedProps.appointment.motif}
                        </div>
                      </div>
                    )}

                    {/* Horaire et type */}
                    <div className="text-sm flex items-center gap-2.5 flex-wrap">
                      <span className="font-medium whitespace-nowrap">
                        {format(new Date(apt.start), 'HH:mm')} - {format(new Date(apt.end), 'HH:mm')}
                      </span>
                      <span className="text-muted-foreground/70">•</span>
                      <span className="capitalize whitespace-nowrap">
                        {apt.extendedProps.type === 'consultation' ? 'Consultation' :
                         apt.extendedProps.type === 'follow-up' ? 'Suivi' : 'Urgence'}
                      </span>
                    </div>

                    {/* Médecin */}
                    <div className="text-sm text-muted-foreground">
                      {apt.extendedProps.doctor ? 
                        `Dr. ${apt.extendedProps.doctor.lastName} ${apt.extendedProps.doctor.firstName}` : 
                        'Médecin non assigné'}
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