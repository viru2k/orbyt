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