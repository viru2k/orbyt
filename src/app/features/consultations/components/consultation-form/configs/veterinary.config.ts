import { BusinessTypeFormConfig } from '../interfaces/form-config.interface';

export const VETERINARY_CONFIG: BusinessTypeFormConfig = {
  businessTypeCode: 'veterinary',
  sections: [
    {
      key: 'pet_owner_info',
      title: 'Información de la Mascota y Propietario',
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
      key: 'symptoms_behavior',
      title: 'Síntomas y Comportamiento',
      fields: [
        {
          key: 'symptoms',
          label: 'Síntomas Observados',
          type: 'textarea',
          required: false,
          placeholder: 'Comportamiento, síntomas físicos, cambios observados...'
        }
      ]
    },
    {
      key: 'veterinary_exam',
      title: 'Examen Veterinario',
      fields: [
        {
          key: 'temperature',
          label: 'Temperatura Corporal',
          type: 'number',
          required: false,
          suffix: '°C',
          min: 35,
          max: 42
        },
        {
          key: 'heartRate',
          label: 'Frecuencia Cardíaca',
          type: 'number',
          required: false,
          suffix: 'bpm',
          min: 60,
          max: 220
        },
        {
          key: 'weight',
          label: 'Peso de la Mascota',
          type: 'number',
          required: false,
          suffix: 'kg',
          min: 0,
          max: 100
        }
      ]
    },
    {
      key: 'diagnosis_treatment',
      title: 'Diagnóstico Veterinario y Tratamiento',
      fields: [
        {
          key: 'diagnosis',
          label: 'Diagnóstico Veterinario',
          type: 'textarea',
          required: false,
          placeholder: 'Diagnóstico profesional...'
        },
        {
          key: 'treatment',
          label: 'Tratamiento Prescrito',
          type: 'textarea',
          required: false,
          placeholder: 'Medicación y cuidados...'
        },
        {
          key: 'recommendations',
          label: 'Recomendaciones al Propietario',
          type: 'textarea',
          required: false,
          placeholder: 'Cuidados en casa...'
        }
      ]
    },
    {
      key: 'medications_follow_up',
      title: 'Medicamentos y Seguimiento',
      fields: [
        {
          key: 'medications',
          label: 'Medicamentos Prescritos',
          type: 'textarea',
          required: false,
          placeholder: 'Medicación veterinaria...'
        },
        {
          key: 'followUpRequired',
          label: 'Requiere Control',
          type: 'checkbox',
          required: false
        },
        {
          key: 'followUpDate',
          label: 'Fecha de Control',
          type: 'datetime',
          required: false
        },
        {
          key: 'notes',
          label: 'Observaciones Veterinarias',
          type: 'textarea',
          required: false,
          placeholder: 'Notas del veterinario...'
        }
      ]
    }
  ]
};