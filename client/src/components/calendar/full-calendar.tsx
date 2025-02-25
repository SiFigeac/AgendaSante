import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { fr } from 'date-fns/locale';
import type { Appointment, Patient } from "@shared/schema";

interface FullCalendarProps {
  appointments: Appointment[];
  patients: Patient[];
  onDateSelect: (date: Date) => void;
  onEventClick: (appointment: Appointment) => void;
}

export function AppointmentCalendar({ appointments, patients, onDateSelect, onEventClick }: FullCalendarProps) {
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

  return (
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
        eventClick={(info) => onEventClick(info.event.extendedProps.appointment)}
        height="auto"
      />
    </div>
  );
}
