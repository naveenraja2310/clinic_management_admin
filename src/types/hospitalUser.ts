import type { Hospital } from './hospital';

export interface HospitalUser {
    _id: string;
    title: string;
    first_name: string;
    last_name: string;
    hospital_id: string;
    hospital_details: Hospital;
    gender: 'Male' | 'Female' | 'Other';
    email_id: string;
    mobile_number: string;
    phone_number: string;
    qualification: string;
    designation: string;
    is_doctor: boolean;
    color: string;
    staff_status: 'Active' | 'Inactive';
    set_availability: boolean;
    user_role: string;
    is_admin: boolean;
    photo: string;
    createdAt: string;
    updatedAt: string;
}

export interface HospitalUserFormData extends Omit<HospitalUser, | 'createdAt' | 'updatedAt'> { } 