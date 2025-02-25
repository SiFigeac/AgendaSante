import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fr } from 'date-fns/locale';
import type { Appointment, Patient } from "@shared/schema";
import { DayPreviewDialog } from './day-preview-dialog';
import { AppointmentDetailDialog } from '@/components/appointments/appointment-detail-dialog';

interface FullCalendarProps {
  appointments: Appointment[];
  patients: Patient[];
  onDateSelect: (date: Date) => void;
}

export function AppointmentCalendar({ appointments, patients, onDateSelect }: FullCalendarProps) {
  const [showDayPreview, setShowDayPreview] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const events = appointments?.map(apt => {
    const patient = patients?.find(p => p.id === apt.patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient inconnu';

    return {
      id: apt.id.toString(),
      title: `${patientName} - ${apt.type === 'consultation' ? 'Consultation' : apt.type === 'follow-up' ? 'Suivi' : 'Urgence'}`,
      start: new Date(apt.startTime),
      end: new Date(apt.endTime),
      backgroundColor: apt.status === 'confirmed' ? 'hsl(142.1 76.2% 36.3%)' :
                      apt.status === 'cancelled' ? 'hsl(346.8 77.2% 49.8%)' :
                      'hsl(221.2 83.2% 53.3%)',
      extendedProps: {
        appointment: apt
      }
    };
  }) || [];

  const handleDateClick = (info: { date: Date }) => {
    setSelectedDate(info.date);
    setShowDayPreview(true);
  };

  const handleEventClick = (info: { event: any }) => {
    setSelectedAppointment(info.event.extendedProps.appointment);
  };

  return (
    <>
      <div className='fc-theme-standard'>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          locale="fr"
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
          }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={(info) => onDateSelect(info.start)}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height="auto"
        />
      </div>

      <DayPreviewDialog
        open={showDayPreview}
        onOpenChange={setShowDayPreview}
        date={selectedDate}
        appointments={appointments}
        patients={patients}
      />

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