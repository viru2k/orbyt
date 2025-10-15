import { BusinessTypeFormConfig } from '../interfaces/form-config.interface';

export const MEDICAL_CONFIG: BusinessTypeFormConfig = {
  businessTypeCode: 'medical',
  sections: [
    {
      key: 'patient_info',
      title: 'Información del Paciente',
      fields: []
    },
    {
      key: 'consultation_info',
      title: 'Horario de la Consulta',
      fields: [
        { key: 'startTime', label: 'Fecha y Hora de Inicio', type: 'datetime', required: true },
        { key: 'endTime', label: 'Fecha y Hora de Finalización', type: 'datetime', required: true }
      ]
    },
    {
      key: 'symptoms',
      title: 'Síntomas y Motivo de Consulta',
      fields: [
        {
          key: 'symptoms',
          label: 'Síntomas',
          type: 'textarea',
          required: false,
          placeholder: 'Describe los síntomas del paciente...'
        }
      ]
    },
    {
      key: 'vital_signs',
      title: 'Examen Físico y Signos Vitales',
      fields: [
        {
          key: 'temperature',
          label: 'Temperatura',
          type: 'number',
          required: false,
          suffix: '°C',
          min: 30,
          max: 45
        },
        {
          key: 'bloodPressure',
          label: 'Presión Arterial',
          type: 'text',
          required: false,
          placeholder: 'ej: 120/80'
        },
        {
          key: 'heartRate',
          label: 'Frecuencia Cardíaca',
          type: 'number',
          required: false,
          suffix: 'bpm',
          min: 30,
          max: 200
        },
        {
          key: 'weight',
          label: 'Peso',
          type: 'number',
          required: false,
          suffix: 'kg',
          min: 0,
          max: 300
        },
        {
          key: 'height',
          label: 'Altura',
          type: 'number',
          required: false,
          suffix: 'm',
          min: 0,
          max: 3
        }
      ]
    },
    {
      key: 'diagnosis_treatment',
      title: 'Diagnóstico y Tratamiento',
      fields: [
        {
          key: 'diagnosis',
          label: 'Diagnóstico',
          type: 'textarea',
          required: false,
          placeholder: 'Diagnóstico médico...'
        },
        {
          key: 'treatment',
          label: 'Tratamiento',
          type: 'textarea',
          required: false,
          placeholder: 'Plan de tratamiento...'
        },
        {
          key: 'recommendations',
          label: 'Recomendaciones',
          type: 'textarea',
          required: false,
          placeholder: 'Recomendaciones para el paciente...'
        }
      ]
    },
    {
      key: 'medications_allergies',
      title: 'Medicamentos y Alergias',
      fields: [
        {
          key: 'medications',
          label: 'Medicamentos Actuales',
          type: 'textarea',
          required: false,
          placeholder: 'Lista de medicamentos...'
        },
        {
          key: 'allergies',
          label: 'Alergias Conocidas',
          type: 'textarea',
          required: false,
          placeholder: 'Alergias del paciente...'
        }
      ]
    },
    {
      key: 'follow_up',
      title: 'Seguimiento',
      fields: [
        {
          key: 'followUpRequired',
          label: 'Requiere Seguimiento',
          type: 'checkbox',
          required: false
        },
        {
          key: 'followUpDate',
          label: 'Fecha de Seguimiento',
          type: 'datetime',
          required: false
        },
        {
          key: 'notes',
          label: 'Notas Adicionales',
          type: 'textarea',
          required: false,
          placeholder: 'Observaciones generales...'
        }
      ]
    }
  ]
};