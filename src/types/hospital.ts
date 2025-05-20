export interface Hospital {
  id: string;
  registrationId: string;
  registrationDate: string;
  clinicName: string;
  speciality: string;
  address: string;
  address2: string;
  pinCode: string;
  country: string;
  state: string;
  city: string;
  phoneNumber: string;
  mobileNumber: string;
  workingHours: {
    fromTime: string;
    toTime: string;
  };
}

export interface HospitalFormData extends Omit<Hospital, 'id'> {}