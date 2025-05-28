export interface Hospital {
  id: string;
  registration_id: string;
  registration_date: string;
  email: string;
  logo: string;
  clinic_name: string;
  speciality: string;
  address: string;
  address2: string;
  pin_code: string;
  country: string;
  state: string;
  city: string;
  phone_number: string;
  mobile_number: string;
  working_hours_from: string;
  working_hours_to: string;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalFormData extends Omit<Hospital, 'id' | 'createdAt' | 'updatedAt'> { }