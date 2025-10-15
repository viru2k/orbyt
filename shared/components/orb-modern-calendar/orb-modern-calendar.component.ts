import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule, DateAdapter, CalendarUtils, CalendarA11y } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CalendarEvent, CalendarView, CalendarDateFormatter, CalendarEventTitleFormatter, CalendarEventAction, CalendarEventTimesChangedEvent } from 'angular-calendar';
import { DragAndDropModule } from 'angular-draggable-droppable';
import { Subject } from 'rxjs';
import { startOfDay, endOfDay, subDays, addDays, endOfMonth, startOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth, addHours } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ModernCalendarEvent extends CalendarEvent {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  clientName?: string;
  description?: string;
  type?: string;
  editable?: boolean;
  extendedProps?: any;
  // Make start required to match expected behavior
  start: Date;
}

export interface DateSelectInfo {
  start: Date;
  end: Date;
  allDay: boolean;
  startStr: string;
  endStr: string;
}

// Adapter types to maintain compatibility with orb-fullcalendar
export interface AdaptedEventClickArg {
  event: {
    id: string;
    extendedProps: any;
  };
}

export interface AdaptedDatesSetArg {
  start: Date;
  end: Date;
}

@Component({
  selector: 'orb-modern-calendar',
  standalone: true,
  imports: [CommonModule, CalendarModule, DragAndDropModule],
  providers: [
    {
      provide: DateAdapter,
      useFactory: adapterFactory,
    },
    CalendarUtils,
    CalendarA11y,
    CalendarDateFormatter,
    CalendarEventTitleFormatter,
  ],
  templateUrl: './orb-modern-calendar.component.html',
  styleUrls: ['./orb-modern-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,   
  encapsulation: ViewEncapsulation.None
}) 

  
export class OrbModernCalendarComponent implements OnInit, OnChanges {
  @Input() events: any[] = [];
  @Input() view: CalendarView = CalendarView.Week; 
  @Input() viewDate: Date = new Date();
  @Input() locale: string = 'es';  
  @Input() weekStartsOn: number = 1; // Monday
  @Input() excludeDays: number[] = []; // Days to exclude (0 = Sunday, 6 = Saturday) 
  @Input() slotDuration: number = 30;
    
  @Output() eventClick = new EventEmitter<AdaptedEventClickArg>();
  @Output() dayClick = new EventEmitter<{ date: Date; events: ModernCalendarEvent[] }>();
  @Output() eventTimesChanged = new EventEmitter<CalendarEventTimesChangedEvent>();
  @Output() viewChange = new EventEmitter<CalendarView>();
  @Output() viewDateChange = new EventEmitter<Date>();
  @Output() dateSelect = new EventEmitter<DateSelectInfo>();
  @Output() datesSetRange = new EventEmitter<AdaptedDatesSetArg>();
  @Output() eventDrop = new EventEmitter<CalendarEventTimesChangedEvent>();

  view$ = CalendarView;
  refresh$ = new Subject<void>();
  hourSegments: number = 2;

  // Calendar views
  CalendarView = CalendarView;

  constructor() {}

  ngOnInit(): void {
    this.updateHourSegments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events'] && !changes['events'].firstChange) {
      this.refresh$.next();
    }
    if (changes['slotDuration']) {
      this.updateHourSegments();
    }
  }

  private updateHourSegments(): void {
    this.hourSegments = 60 / this.slotDuration;
  }

  // Event handlers
  handleEventClick({ event }: { event: CalendarEvent }): void {
    // Adapt to match orb-fullcalendar API
    // Try both meta and extendedProps for compatibility
    const extendedProps = (event as any).extendedProps || event.meta || {};
    const adaptedEvent: AdaptedEventClickArg = {
      event: {
        id: event.id?.toString() || '',
        extendedProps: extendedProps
      }
    };
    this.eventClick.emit(adaptedEvent);
  }

  // Handle different types of day click events from angular-calendar
  handleDayClick(eventData: any): void {
    let date: Date;
    let events: CalendarEvent[] = [];

    // Handle different event structures from different views
    if (eventData.day) {
      // Month view: { day: MonthViewDay, sourceEvent: Event }
      date = eventData.day.date;
      events = eventData.day.events || [];
    } else if (eventData.date) {
      // Week/Day view hour segment: { date: Date, sourceEvent: Event }
      date = eventData.date;
      // Filter events for this specific time
      events = this.events.filter(event => {
        if (!event.start) return false;
        const eventStart = new Date(event.start);
        return isSameDay(eventStart, date);
      });
    } else {
      // Fallback
      date = new Date();
      events = [];
    }

    this.dayClick.emit({ date, events: events as ModernCalendarEvent[] });
    
    // Also emit date selection for compatibility
    const dateSelectInfo: DateSelectInfo = {
      start: date,
      end: date,
      allDay: true,
      startStr: date.toISOString(),
      endStr: date.toISOString()
    };
    this.dateSelect.emit(dateSelectInfo);
  }

  handleEventTimesChanged(event: CalendarEventTimesChangedEvent): void {
    console.log('Event times changed:', event);
    this.eventTimesChanged.emit(event);
    this.eventDrop.emit(event);
  }

  // Handle view date changes to emit datesSetRange
  handleViewDateChange(date: Date): void {
    // Calculate the range based on current view
    let start: Date;
    let end: Date;

    switch (this.view) {
      case CalendarView.Month:
        start = startOfMonth(date);
        end = endOfMonth(date);
        break;
      case CalendarView.Week:
        start = startOfWeek(date, { weekStartsOn: this.weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
        end = endOfWeek(date, { weekStartsOn: this.weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
        break;
      case CalendarView.Day:
        start = startOfDay(date);
        end = endOfDay(date);
        break;
      default:
        start = startOfDay(date);
        end = endOfDay(date);
    }

    this.datesSetRange.emit({ start, end });
  }

  // Navigation methods
  setView(view: CalendarView): void {
    this.view = view;
    this.viewChange.emit(view);
  }

  closeOpenMonthViewDay(): void {
    // Close any open day view in month view
  }

  // Helper methods
  incrementDate(): void {
    this.changeDate(1);
  }

  decrementDate(): void {
    this.changeDate(-1);
  }

  today(): void {
    this.viewDate = new Date();
    this.viewDateChange.emit(this.viewDate);
    this.handleViewDateChange(this.viewDate);
  }

  private changeDate(increment: number): void {
    let newDate: Date;

    switch (this.view) {
      case CalendarView.Month:
        newDate = addMonths(this.viewDate, increment);
        break;
      case CalendarView.Week:
        newDate = addWeeks(this.viewDate, increment);
        break;
      case CalendarView.Day:
        newDate = addDays(this.viewDate, increment);
        break;
      default:
        newDate = addDays(this.viewDate, increment);
    }

    this.viewDate = newDate;
    this.viewDateChange.emit(this.viewDate);
    this.handleViewDateChange(this.viewDate);
  }

  // Public API methods
  public refetchEvents(): void {
    this.refresh$.next();
  }

  public getViewDate(): Date {
    return this.viewDate;
  }

  public getCurrentView(): CalendarView {
    return this.view;
  }
}

// Helper functions for date manipulation (using date-fns)
function addMonths(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
}

function addWeeks(date: Date, amount: number): Date {
  return addDays(date, amount * 7);
}