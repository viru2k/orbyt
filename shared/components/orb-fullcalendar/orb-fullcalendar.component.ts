// src/app/shared/components/orb-fullcalendar/orb-fullcalendar.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Calendar, CalendarOptions, EventInput, DateSelectArg, EventClickArg, EventApi, DatesSetArg, EventDropArg } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
// Opcional: import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';

import esLocale from '@fullcalendar/core/locales/es';

export interface CalendarDisplayEvent extends EventInput {
  // extendedProps?: { [key: string]: any }; // Ya incluido en EventInput, pero puedes ser más específico
}

@Component({
  selector: 'orb-fullcalendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orb-fullcalendar.component.html',
  styleUrls: ['./orb-fullcalendar.component.scss']
})
export class OrbFullcalendarComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('fullcalendar') calendarEl!: ElementRef;

  @Input() events: CalendarDisplayEvent[] = [];
  @Input() customOptions?: Partial<CalendarOptions>;

  @Output() dateSelect = new EventEmitter<DateSelectArg>();
  @Output() eventClick = new EventEmitter<EventClickArg>();
  @Output() eventsSet = new EventEmitter<EventApi[]>();
  @Output() datesSetRange = new EventEmitter<DatesSetArg>();
  @Output() eventDrop = new EventEmitter<EventDropArg>();

  private calendarInstance?: Calendar;
  public calendarOptions!: CalendarOptions;

  constructor() {}

  ngOnInit(): void {
    this.initializeCalendarOptions();
  }

  ngAfterViewInit(): void {
    if (this.calendarEl) {
      this.renderCalendar();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.calendarInstance) {
      if (changes['events'] && !changes['events'].firstChange) {
        // Si los eventos cambian después de la inicialización, actualiza la fuente de eventos.
        // removeAllEvents y addEventSource es una forma de asegurar que solo los eventos actuales se muestren.
        this.calendarInstance.removeAllEvents();
        this.calendarInstance.addEventSource(this.events);
      }
      if (changes['customOptions'] && !changes['customOptions'].firstChange) {
        // Si las opciones personalizadas cambian, es más seguro reinicializar y re-renderizar
        // ya que setOption es para cambios individuales y no para un objeto completo.
        console.log('Custom options changed, re-rendering calendar...');
        this.initializeCalendarOptions(); // Re-calcula this.calendarOptions
        this.renderCalendar(); // Destruye la instancia vieja y crea una nueva con todas las opciones actualizadas
      }
    }
  }

  private initializeCalendarOptions(): void {
    const defaultOptions: CalendarOptions = {
      plugins: [
        interactionPlugin,
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        // resourceTimeGridPlugin,
      ],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      initialView: 'timeGridWeek',
      locale: esLocale,
      weekends: true,
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      navLinks: true,
      events: this.events, // Carga inicial de eventos a través de las opciones

      select: (selectInfo: DateSelectArg) => {
        this.dateSelect.emit(selectInfo);
        this.calendarInstance?.unselect();
      },
      eventClick: (clickInfo: EventClickArg) => {
        this.eventClick.emit(clickInfo);
      },
      eventsSet: (events: EventApi[]) => {
        this.eventsSet.emit(events);
      },
      datesSet: (dateInfo: DatesSetArg) => {
        this.datesSetRange.emit(dateInfo);
      },
      eventDrop: (dropInfo: EventDropArg) => {
        this.eventDrop.emit(dropInfo);
      }
      // slotEventOverlap: true,
      // eventOverlap: function(stillEvent, movingEvent) {
      //   return stillEvent.allDay || movingEvent.allDay;
      // },
    };
    // Combina las opciones por defecto con las personalizadas. Las personalizadas tienen precedencia.
    // Asegúrate de que 'events' en customOptions no sobreescriba el @Input() events si no es la intención.
    // Si customOptions puede definir 'events', la lógica de carga inicial en renderCalendar podría necesitar ajuste.
    // Por ahora, se asume que si customOptions.events existe, toma precedencia para la carga inicial.
    this.calendarOptions = { ...defaultOptions, ...this.customOptions };
    
    // Si customOptions no define 'events', pero this.events (del @Input) sí tiene,
    // asegúrate que this.calendarOptions.events refleje this.events.
    if (this.customOptions && !this.customOptions.events && this.events.length > 0) {
        this.calendarOptions.events = this.events;
    } else if (!this.customOptions && this.events.length > 0) {
        this.calendarOptions.events = this.events;
    }

  }

  private renderCalendar(): void {
    if (this.calendarInstance) {
      this.calendarInstance.destroy();
    }
    if (this.calendarEl) {
      // this.calendarOptions ya incluye los eventos si se pasaron vía @Input events
      // o a través de customOptions.events debido a initializeCalendarOptions()
      this.calendarInstance = new Calendar(this.calendarEl.nativeElement, this.calendarOptions);
      this.calendarInstance.render();
    } else {
      console.error("OrbFullcalendarComponent: Elemento del calendario no encontrado en el DOM.");
    }
  }

  public getApi(): Calendar | undefined {
    return this.calendarInstance;
  }

  /**
   * Solicita a FullCalendar que vuelva a obtener y renderizar todos sus eventos.
   * Útil si las fuentes de eventos han cambiado externamente.
   */
  public refetchEvents(): void { // Cambiado de rerenderEvents a refetchEvents
    this.calendarInstance?.refetchEvents();
  }

  /**
   * Establece una opción individual del calendario después de la inicialización.
   * @param optionName El nombre de la opción a cambiar.
   * @param optionValue El nuevo valor para la opción.
   */
  public setCalendarOption(optionName: keyof CalendarOptions, optionValue: any): void {
    this.calendarInstance?.setOption(optionName, optionValue);
  }
}