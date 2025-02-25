import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useQuery } from "@tanstack/react-query";
import type { Appointment, Patient } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddAppointment, setShowAddAppointment] = useState(false);

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: patients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Get appointments for the selected date
  const dayAppointments = appointments?.filter(apt => {
    const aptDate = new Date(apt.startTime);
    return format(aptDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  });

  // Find patient names for appointments
  const getPatientName = (patientId: number) => {
    const patient = patients?.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Patient inconnu';
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Calendrier</h1>
          <Button onClick={() => setShowAddAppointment(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau rendez-vous
          </Button>
        </div>

        <div className="flex gap-8">
          <div className="w-[350px]">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              locale={fr}
            />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">
              Rendez-vous du {format(selectedDate, 'd MMMM yyyy', { locale: fr })}
            </h2>

            <div className="space-y-4">
              {dayAppointments?.length === 0 && (
                <p className="text-muted-foreground">Aucun rendez-vous prévu pour ce jour.</p>
              )}

              {dayAppointments?.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-lg border flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{getPatientName(apt.patientId)}</div>
                    <div className="text-sm text-muted-foreground">
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
              ))}
            </div>
          </div>
        </div>

        <AppointmentForm
          open={showAddAppointment}
          onOpenChange={setShowAddAppointment}
          selectedDate={selectedDate}
        />
      </main>
    </div>
  );
}