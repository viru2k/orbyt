import { CreateClientDto } from './../../../../src/app/api/model/createClientDto';
  export const genderOptions: GenderOption[] = [
    { label: 'Masculino', value: CreateClientDto.GenderEnum.Male },
    { label: 'Femenino', value: CreateClientDto.GenderEnum.Female },
    { label: 'Otro', value: CreateClientDto.GenderEnum.Other },
  ];

    export const statusOptions: StatusOption[] = [
    { label: 'Activo', value: CreateClientDto.StatusEnum.Active },
    { label: 'Inactivo', value: CreateClientDto.StatusEnum.Inactive },
    { label: 'Creado', value: CreateClientDto.StatusEnum.Created },
  ];


  export type GenderOption = { label: string; value: CreateClientDto.GenderEnum };
export type StatusOption = { label: string; value: CreateClientDto.StatusEnum };
export type ButtonSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast'; // String para permitir otras severidades de PrimeNG
export type ButtonStyleType = 'text' | 'outlined' | 'raised' | 'rounded' | string; // String para permitir otras
export type ButtonType = 'button' | 'submit' | 'reset';
export type FooterAlignment = 'left' | 'center' | 'right';
export type TooltipPosition = 'top' | 'left' | 'right' | 'bottom';
