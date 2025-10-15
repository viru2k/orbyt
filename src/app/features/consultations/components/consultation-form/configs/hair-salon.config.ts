import { BusinessTypeFormConfig } from '../interfaces/form-config.interface';

export const HAIR_SALON_CONFIG: BusinessTypeFormConfig = {
  businessTypeCode: 'hair_salon',
  sections: [
    {
      key: 'client_info',
      title: 'Información del Cliente',
      fields: []
    },
    {
      key: 'appointment_info',
      title: 'Información de la Cita',
      fields: [
        { key: 'startTime', label: 'Fecha y Hora de Inicio', type: 'datetime', required: true },
        { key: 'endTime', label: 'Fecha y Hora de Finalización', type: 'datetime', required: true }
      ]
    },
    {
      key: 'hair_service',
      title: 'Servicio de Peluquería',
      fields: [
        {
          key: 'symptoms',
          label: 'Servicio Solicitado',
          type: 'textarea',
          required: false,
          placeholder: 'Corte, color, peinado, tratamiento capilar...'
        }
      ]
    },
    {
      key: 'hair_condition',
      title: 'Estado y Tipo de Cabello',
      fields: [
        {
          key: 'diagnosis',
          label: 'Análisis del Cabello',
          type: 'textarea',
          required: false,
          placeholder: 'Tipo de cabello, estado, tratamientos previos...'
        }
      ]
    },
    {
      key: 'treatment_result',
      title: 'Tratamiento Realizado',
      fields: [
        {
          key: 'treatment',
          label: 'Servicio Realizado',
          type: 'textarea',
          required: false,
          placeholder: 'Productos utilizados, técnicas aplicadas...'
        },
        {
          key: 'recommendations',
          label: 'Cuidados del Cabello',
          type: 'textarea',
          required: false,
          placeholder: 'Productos recomendados para el hogar...'
        },
        {
          key: 'followUpRequired',
          label: 'Requiere Mantenimiento',
          type: 'checkbox',
          required: false
        },
        {
          key: 'followUpDate',
          label: 'Próxima Cita Sugerida',
          type: 'datetime',
          required: false
        },
        {
          key: 'notes',
          label: 'Observaciones',
          type: 'textarea',
          required: false,
          placeholder: 'Notas del estilista...'
        }
      ]
    }
  ]
};