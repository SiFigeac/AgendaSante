import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useQuery } from "@tanstack/react-query";
import type { Appointment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { AppointmentCalendar } from "@/components/calendar/full-calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: doctors } = useQuery({
    queryKey: ["/api/admin/users"],
    select: (users) => users?.filter((u: any) => u.role === "doctor"),
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowAddAppointment(true);
  };

  const formattedAppointments = appointments?.map(appointment => {
    const doctor = doctors?.find(d => d.id === appointment.doctorId);
    const patient = patients?.find(p => p.id === appointment.patientId);

    return {
      id: appointment.id.toString(),
      resourceId: appointment.id.toString(),
      title: patient ? `${patient.lastName} ${patient.firstName}` : "Patient inconnu",
      start: new Date(appointment.startTime).toISOString(),
      end: new Date(appointment.endTime).toISOString(),
      backgroundColor: doctor?.color || '#cbd5e1',
      borderColor: doctor?.color || '#cbd5e1',
      display: 'block',
      extendedProps: {
        appointment,
        patient,
        doctor,
        type: appointment.type,
        status: appointment.status,
        notes: appointment.notes
      }
    };
  }) || [];

  // Filtrer les rendez-vous selon le médecin sélectionné
  const filteredAppointments = selectedDoctorId
    ? formattedAppointments.filter(apt => apt.extendedProps.doctor?.id.toString() === selectedDoctorId)
    : formattedAppointments;

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <SidebarNav />
      </aside>
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Calendrier</h1>
          <div className="flex items-center gap-4">
            <Select
              value={selectedDoctorId || "all"}
              onValueChange={(value) => setSelectedDoctorId(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les médecins" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les médecins</SelectItem>
                {doctors?.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id.toString()}>
                    Dr. {doctor.lastName} {doctor.firstName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddAppointment(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau rendez-vous
            </Button>
          </div>
        </div>

        <style>
          {`
            .fc {
              height: 100%;
              min-height: 700px;
            }
            .fc-timegrid-slot {
              height: 3.3em !important;
            }
            .fc-timegrid-slot-lane {
              height: 3.3em !important;
            }
            .fc-timegrid-event-harness {
              margin: 2px 0 !important;
            }
            .fc-timegrid-event {
              margin: 0 4px !important;
              border-radius: 4px !important;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
            }
            .fc-event-time {
              font-size: 0.875rem !important;
              padding: 2px 4px !important;
            }
            .fc-event-title {
              padding: 2px 4px !important;
              font-size: 0.875rem !important;
            }
            .fc-daygrid-event {
              margin: 2px 4px !important;
              padding: 2px 4px !important;
              border-radius: 4px !important;
            }
          `}
        </style>

        <div className="rounded-md border p-4">
          {appointments && patients && doctors && (
            <AppointmentCalendar
              appointments={filteredAppointments}
              patients={patients}
              onDateSelect={handleDateSelect}
              selectedDoctorId={selectedDoctorId}
            />
          )}
        </div>

        <AppointmentForm
          open={showAddAppointment}
          onOpenChange={setShowAddAppointment}
          selectedDate={selectedDate}
          preselectedDoctorId={selectedDoctorId ? parseInt(selectedDoctorId) : undefined}
        />
      </main>
    </div>
  );
}