import { Injectable, computed, signal, inject } from '@angular/core';
import { ConsultationsService } from '../../../api/services/consultations.service';
import { ConsultationResponseDto } from '../../../api/models/consultation-response-dto';
import { CreateConsultationDto } from '../../../api/models/create-consultation-dto';
import { UpdateConsultationDto } from '../../../api/models/update-consultation-dto';

interface ConsultationState {
  consultations: ConsultationResponseDto[];
  loading: boolean;
  error: string | null;
  filters: {
    status?: string;
    search?: string;
    clientId?: number;
    dateFrom?: string;
    dateTo?: string;
  };
  selectedConsultation: ConsultationResponseDto | null;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultationStore {
  private consultationsService = inject(ConsultationsService);

  // State signals
  private state = signal<ConsultationState>({
    consultations: [],
    loading: false,
    error: null,
    filters: {},
    selectedConsultation: null
  });

  // Computed signals for derived state
  readonly consultations = computed(() => this.state().consultations);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly filters = computed(() => this.state().filters);
  readonly selectedConsultation = computed(() => this.state().selectedConsultation);

  // Filtered consultations based on current filters
  readonly filteredConsultations = computed(() => {
    const consultations = this.state().consultations;
    const filters = this.state().filters;

    return consultations.filter(consultation => {
      // Status filter
      if (filters.status && consultation.status !== filters.status) {
        return false;
      }

      // Search filter (symptoms, diagnosis, client name)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSymptoms = consultation.symptoms?.toLowerCase().includes(searchTerm);
        const matchesDiagnosis = consultation.diagnosis?.toLowerCase().includes(searchTerm);
        const matchesClientName = (consultation.client as any)?.name?.toLowerCase().includes(searchTerm);
        const matchesConsultationNumber = consultation.consultationNumber?.toLowerCase().includes(searchTerm);
        
        if (!matchesSymptoms && !matchesDiagnosis && !matchesClientName && !matchesConsultationNumber) {
          return false;
        }
      }

      // Client filter
      if (filters.clientId && consultation.clientId !== filters.clientId) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const consultationDate = new Date(consultation.createdAt);
        
        if (filters.dateFrom && consultationDate < new Date(filters.dateFrom)) {
          return false;
        }
        
        if (filters.dateTo && consultationDate > new Date(filters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  });

  // Statistics computed signals
  readonly totalConsultations = computed(() => this.state().consultations.length);
  
  readonly pendingConsultations = computed(() => 
    this.state().consultations.filter(c => c.status === 'pending').length
  );
  
  readonly inProgressConsultations = computed(() => 
    this.state().consultations.filter(c => c.status === 'in_progress').length
  );
  
  readonly completedConsultations = computed(() => 
    this.state().consultations.filter(c => c.status === 'completed').length
  );
  
  readonly cancelledConsultations = computed(() => 
    this.state().consultations.filter(c => c.status === 'cancelled').length
  );

  readonly consultationsToday = computed(() => {
    const today = new Date().toDateString();
    return this.state().consultations.filter(c => 
      new Date(c.createdAt).toDateString() === today
    ).length;
  });

  readonly averageConsultationDuration = computed(() => {
    const consultationsWithDuration = this.state().consultations.filter(c => 
      c.startTime && c.endTime
    );
    
    if (consultationsWithDuration.length === 0) return 0;
    
    const totalMinutes = consultationsWithDuration.reduce((sum, consultation) => {
      const start = new Date(`2000-01-01 ${consultation.startTime}`);
      const end = new Date(`2000-01-01 ${consultation.endTime}`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      return sum + duration;
    }, 0);
    
    return Math.round(totalMinutes / consultationsWithDuration.length);
  });

  readonly consultationsNeedingFollowUp = computed(() => 
    this.state().consultations.filter(c => 
      c.followUpRequired && c.status === 'completed'
    ).length
  );

  // Actions
  async loadConsultations(params?: any): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await this.consultationsService.consultationControllerFindAll(params).toPromise();
      const consultations = (response as any)?.data || response || [];
      this.setConsultations(consultations);
    } catch (error) {
      console.error('Error loading consultations:', error);
      this.setError('Error al cargar las consultas');
      
      // Load mock data on error for development
      this.loadMockData();
    } finally {
      this.setLoading(false);
    }
  }

  async createConsultation(consultationData: CreateConsultationDto): Promise<ConsultationResponseDto | null> {
    this.setLoading(true);
    this.setError(null);

    try {
      const newConsultation = await this.consultationsService.consultationControllerCreate({
        body: consultationData
      }).toPromise();

      if (newConsultation) {
        this.addConsultation(newConsultation);
        return newConsultation;
      }
      return null;
    } catch (error) {
      console.error('Error creating consultation:', error);
      this.setError('Error al crear la consulta');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async updateConsultation(id: number, consultationData: UpdateConsultationDto): Promise<ConsultationResponseDto | null> {
    this.setLoading(true);
    this.setError(null);

    try {
      const updatedConsultation = await this.consultationsService.consultationControllerUpdate({
        id,
        body: consultationData
      }).toPromise();

      if (updatedConsultation) {
        this.updateConsultationInState(updatedConsultation);
        return updatedConsultation;
      }
      return null;
    } catch (error) {
      console.error('Error updating consultation:', error);
      this.setError('Error al actualizar la consulta');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async deleteConsultation(id: number): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    try {
      await this.consultationsService.consultationControllerRemove({ id }).toPromise();
      this.removeConsultationFromState(id);
      return true;
    } catch (error) {
      console.error('Error deleting consultation:', error);
      this.setError('Error al eliminar la consulta');
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  async getConsultationById(id: number): Promise<ConsultationResponseDto | null> {
    this.setLoading(true);
    this.setError(null);

    try {
      const consultation = await this.consultationsService.consultationControllerFindOne({ id }).toPromise();
      if (consultation) {
        this.setSelectedConsultation(consultation);
        return consultation;
      }
      return null;
    } catch (error) {
      console.error('Error getting consultation:', error);
      this.setError('Error al obtener la consulta');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  // Filter actions
  setFilters(filters: Partial<ConsultationState['filters']>): void {
    this.state.update(state => ({
      ...state,
      filters: { ...state.filters, ...filters }
    }));
  }

  clearFilters(): void {
    this.state.update(state => ({
      ...state,
      filters: {}
    }));
  }

  // Private state update methods
  private setLoading(loading: boolean): void {
    this.state.update(state => ({ ...state, loading }));
  }

  private setError(error: string | null): void {
    this.state.update(state => ({ ...state, error }));
  }

  private setConsultations(consultations: ConsultationResponseDto[]): void {
    this.state.update(state => ({ ...state, consultations }));
  }

  private addConsultation(consultation: ConsultationResponseDto): void {
    this.state.update(state => ({
      ...state,
      consultations: [consultation, ...state.consultations]
    }));
  }

  private updateConsultationInState(updatedConsultation: ConsultationResponseDto): void {
    this.state.update(state => ({
      ...state,
      consultations: state.consultations.map(consultation =>
        consultation.id === updatedConsultation.id ? updatedConsultation : consultation
      )
    }));
  }

  private removeConsultationFromState(id: number): void {
    this.state.update(state => ({
      ...state,
      consultations: state.consultations.filter(consultation => consultation.id !== id)
    }));
  }

  private setSelectedConsultation(consultation: ConsultationResponseDto | null): void {
    this.state.update(state => ({ ...state, selectedConsultation: consultation }));
  }

  // Mock data for development
  private loadMockData(): void {
    const mockConsultations: ConsultationResponseDto[] = [
      {
        id: 1,
        consultationNumber: 'CONS-001',
        clientId: 1,
        userId: 1,
        status: 'pending',
        symptoms: 'Dolor de cabeza persistente, mareos ocasionales',
        diagnosis: 'Pendiente de evaluación',
        treatment: '',
        temperature: 36.5,
        bloodPressure: '120/80',
        heartRate: 75,
        weight: 70,
        height: 175,
        medications: ['Paracetamol 500mg'],
        allergies: ['Penicilina'],
        followUpRequired: false,
        recommendations: 'Descanso y hidratación',
        notes: 'Paciente refiere síntomas desde hace 3 días',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        client: {
          id: 1,
          name: 'Juan Pérez',
          email: 'juan.perez@email.com',
          phone: '+34 600 123 456'
        }
      },
      {
        id: 2,
        consultationNumber: 'CONS-002',
        clientId: 2,
        userId: 1,
        status: 'completed',
        symptoms: 'Dolor en rodilla izquierda después de ejercicio',
        diagnosis: 'Lesión menor en ligamentos',
        treatment: 'Reposo y antiinflamatorios por 7 días',
        temperature: 36.2,
        bloodPressure: '110/70',
        heartRate: 68,
        weight: 65,
        height: 168,
        medications: ['Ibuprofeno 400mg', 'Crema antiinflamatoria'],
        allergies: [],
        followUpRequired: true,
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        recommendations: 'Evitar ejercicio intenso por una semana',
        notes: 'Revisar evolución en una semana',
        startTime: '10:00',
        endTime: '10:30',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        client: {
          id: 2,
          name: 'María García',
          email: 'maria.garcia@email.com',
          phone: '+34 600 654 321'
        }
      },
      {
        id: 3,
        consultationNumber: 'CONS-003',
        clientId: 3,
        userId: 1,
        status: 'in_progress',
        symptoms: 'Fiebre alta, dolor de garganta',
        diagnosis: 'Probable infección viral',
        treatment: 'Antipirético y reposo',
        temperature: 38.5,
        bloodPressure: '130/85',
        heartRate: 90,
        weight: 80,
        height: 180,
        medications: ['Paracetamol 1g'],
        allergies: [],
        followUpRequired: true,
        recommendations: 'Consultar si empeoran los síntomas',
        notes: 'Síntomas de 2 días de evolución',
        startTime: '11:00',
        endTime: '11:45',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        client: {
          id: 3,
          name: 'Carlos López',
          email: 'carlos.lopez@email.com',
          phone: '+34 600 789 123'
        }
      }
    ];

    this.setConsultations(mockConsultations);
  }

  // Statistics helper method
  getMonthlyConsultationStats(months: number = 6): { labels: string[], data: number[] } {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(monthNames[date.getMonth()]);
      
      const monthConsultations = this.state().consultations.filter(consultation => {
        const consultationDate = new Date(consultation.createdAt);
        return consultationDate.getMonth() === date.getMonth() && 
               consultationDate.getFullYear() === date.getFullYear();
      }).length;
      
      data.push(monthConsultations);
    }

    return { labels, data };
  }
}