/**
 * Backoffice Hub API
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export interface CreateClientDto { 
    fullname: string;
    name: string;
    lastName: string;
    address?: string;
    email?: string;
    phone?: string;
    gender?: CreateClientDto.GenderEnum;
    birthDate?: string;
    status?: CreateClientDto.StatusEnum;
    notes?: string;
}
export namespace CreateClientDto {
    export type GenderEnum = 'male' | 'female' | 'other';
    export const GenderEnum = {
        Male: 'male' as GenderEnum,
        Female: 'female' as GenderEnum,
        Other: 'other' as GenderEnum
    };
    export type StatusEnum = 'ACTIVE' | 'INACTIVE' | 'CREATED' | 'UNUSED';
    export const StatusEnum = {
        Active: 'ACTIVE' as StatusEnum,
        Inactive: 'INACTIVE' as StatusEnum,
        Created: 'CREATED' as StatusEnum,
        Unused: 'UNUSED' as StatusEnum
    };
}


