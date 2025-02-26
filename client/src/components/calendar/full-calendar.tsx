import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';
import type { Appointment, Patient } from "@shared/schema";
import { DayPreviewDialog } from './day-preview-dialog';
import { AppointmentDetailDialog } from '@/components/appointments/appointment-detail-dialog';

interface FullCalendarProps {
  appointments: any[];
  patients: Patient[];
  onDateSelect: (date: Date) => void;
}

export function AppointmentCalendar({ appointments, patients, onDateSelect }: FullCalendarProps) {
  const [showDayPreview, setShowDayPreview] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const handleDateClick = (info: { date: Date }) => {
    setSelectedDate(info.date);
    setShowDayPreview(true);
  };

  return (
    <>
      <div className='fc-theme-standard'>
        <style>
          {`
            .fc {
              height: 100%;
              min-height: 700px;
            }
            .fc-timegrid-slot {
              height: 6em !important;
            }
            .fc-timegrid-slot-lane {
              height: 6em !important;
            }
            .fc-v-event {
              display: block !important;
              border: none !important;
              background-color: var(--background) !important;
            }
            .fc-timegrid-event-harness {
              margin: 1px !important;
              left: 0 !important;
              right: 0 !important;
            }
            .fc-timegrid-event {
              border-radius: 4px !important;
              margin: 0 4px !important;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
            }
            .fc-event-time, .fc-event-title {
              padding: 2px 4px !important;
              font-size: 0.875rem !important;
            }
            .fc-timegrid-col-events {
              margin: 0 !important;
            }
          `}
        </style>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          views={{
            listWeek: {
              type: 'list',
              duration: { days: 7 },
              buttonText: 'Liste'
            }
          }}
          locale={frLocale}
          buttonText={{
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            list: 'Liste'
          }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          events={appointments}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={(info) => onDateSelect(info.start)}
          eventClick={(info) => {
            if (info.event.extendedProps.appointment) {
              setSelectedAppointment(info.event.extendedProps.appointment);
            }
          }}
          dateClick={handleDateClick}
          eventContent={(info) => (
            <div className="fc-event-main-frame">
              <div className="fc-event-title-container">
                <div className="fc-event-title fc-sticky">
                  {info.event.title}
                </div>
                {info.event.extendedProps.doctor && (
                  <div className="text-xs opacity-75">
                    Dr. {info.event.extendedProps.doctor.lastName} {info.event.extendedProps.doctor.firstName}
                  </div>
                )}
              </div>
            </div>
          )}
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