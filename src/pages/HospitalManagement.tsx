import { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/table';
import { Modal } from '../components/ui/modal';
import Form from '../components/form/Form';
import Input from '../components/form/input/InputField';
import TimePicker from '../components/form/time-picker';
import DatePicker from '../components/form/date-picker';
import type { Hospital, HospitalFormData } from '../types/hospital';
import { AlertIcon } from '../icons';
import axios from 'axios';

// Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
});

const HospitalManagement = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  const initialFormData: HospitalFormData = {
    registration_id: '',
    registration_date: '',
    clinic_name: '',
    speciality: '',
    address: '',
    address2: '',
    pin_code: '',
    country: '',
    state: '',
    city: '',
    phone_number: '',
    mobile_number: '',
    working_hours_from: '',
    working_hours_to: ''
  };

  const [formData, setFormData] = useState<HospitalFormData>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const hospitalData = {
      registration_id: formData.registration_id,
      registration_date: new Date(formData.registration_date),
      clinic_name: formData.clinic_name,
      speciality: formData.speciality,
      address: formData.address,
      address2: formData.address2,
      pin_code: formData.pin_code,
      country: formData.country,
      state: formData.state,
      city: formData.city,
      phone_number: formData.phone_number,
      mobile_number: formData.mobile_number,
      working_hours_from: formData.working_hours_from,
      working_hours_to: formData.working_hours_to,
    };

    try {
      if (editingHospital) {
        const response = await api.put(`/hospital/${editingHospital.id}`, hospitalData);
        if (response.status === 200 || response.status === 201) {
          await fetchHospitals();
        }
      } else {
        const response = await api.post('/hospital', hospitalData);
        if (response.status === 200 || response.status === 201) {
          await fetchHospitals();
        }
      }
      handleCloseModal();
    } catch (err) {
      setError('Error saving hospital data. Please try again.');
      console.error('Error saving hospital:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (hospital: Hospital) => {
    setEditingHospital(hospital);
    const {
      registration_id = '',
      registration_date = '',
      clinic_name = '',
      speciality = '',
      address = '',
      address2 = '',
      pin_code = '',
      country = '',
      state = '',
      city = '',
      phone_number = '',
      mobile_number = '',
      working_hours_from = '',
      working_hours_to = ''
    } = hospital;

    setFormData({
      registration_id,
      registration_date,
      clinic_name,
      speciality,
      address,
      address2,
      pin_code,
      country,
      state,
      city,
      phone_number,
      mobile_number,
      working_hours_from,
      working_hours_to,
    });

    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this hospital?')) {
      setIsLoading(true);
      setError(null);
      try {
        await api.delete(`/hospital/${id}`);
        setHospitals(prev => prev.filter(h => h.id !== id));
      } catch (err) {
        setError('Error deleting hospital. Please try again.');
        console.error('Error deleting hospital:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHospital(null);
    setFormData(initialFormData);
  };

  const fetchHospitals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/hospital');
      const fetchedHospitals = response?.data?.data?.hospitals || response?.data?.hospitals || response?.data || [];
      setHospitals(fetchedHospitals);
    } catch (err) {
      setError('Error loading hospital data. Please try again later.');
      console.error('Error fetching hospitals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const filteredHospitals = Array.isArray(hospitals)
    ? hospitals.filter(hospital =>
      (hospital.clinic_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hospital.registration_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : [];

  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);
  const currentHospitals = filteredHospitals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  console.log("currentHospitals", currentHospitals)
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Input
          type="text"
          placeholder="Search hospitals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          Create Hospital
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center p-8 text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Registration ID
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Clinic Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Speciality
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Contact
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {currentHospitals.length > 0 ? (
                  currentHospitals.map((hospital) => (
                    <TableRow key={hospital.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                        {hospital.registration_id}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {hospital.clinic_name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {hospital.speciality}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {hospital.phone_number}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(hospital)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(hospital.id)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="px-5 py-4">
                      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <AlertIcon className="w-12 h-12 mb-2 text-gray-400" />
                        <p className="text-lg font-medium">No Data Found</p>
                        <p className="text-sm">No hospital records are available at the moment.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded ${currentPage === page
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-2xl p-6">
        <h2 className="text-2xl font-semibold mb-6">
          {editingHospital ? 'Edit Hospital' : 'Create Hospital'}
        </h2>
        <Form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Regular text inputs */}
            {[
              ['registration_id', 'Registration ID'],
              ['clinic_name', 'Clinic Name'],
              ['speciality', 'Speciality'],
              ['address', 'Address'],
              ['address2', 'Address 2'],
              ['pin_code', 'Pin Code'],
              ['country', 'Country'],
              ['state', 'State'],
              ['city', 'City'],
              ['phone_number', 'Phone Number'],
              ['mobile_number', 'Mobile Number'],
            ].map(([name, label]) => (
              <div key={name} className="flex flex-col gap-1">
                <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                <Input
                  id={name}
                  type="text"
                  name={name}
                  value={formData[name as keyof HospitalFormData]}
                  onChange={handleInputChange}
                  placeholder={label}
                />
              </div>
            ))}

            {/* Date Picker */}
            <div className="flex flex-col gap-1">
              <DatePicker
                id="registration_date"
                label="Registration Date"
                defaultDate={formData.registration_date ? new Date(formData.registration_date) : undefined}
                onChange={(selectedDates) => {
                  if (selectedDates.length > 0) {
                    const date = selectedDates[0];
                    setFormData(prev => ({
                      ...prev,
                      registration_date: date.toISOString().split('T')[0]
                    }));
                  }
                }}
              />
            </div>

            {/* Time Pickers */}
            <div className="flex flex-col gap-1">
              <TimePicker
                id="working_hours_from"
                label="Working Hours From"
                defaultTime={formData.working_hours_from ? new Date(`1970-01-01T${formData.working_hours_from}`) : undefined}
                onChange={(selectedDates) => {
                  if (selectedDates.length > 0) {
                    const time = selectedDates[0];
                    setFormData(prev => ({
                      ...prev,
                      working_hours_from: time.toTimeString().split(' ')[0].substring(0, 5)
                    }));
                  }
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <TimePicker
                id="working_hours_to"
                label="Working Hours To"
                defaultTime={formData.working_hours_to ? new Date(`1970-01-01T${formData.working_hours_to}`) : undefined}
                onChange={(selectedDates) => {
                  if (selectedDates.length > 0) {
                    const time = selectedDates[0];
                    setFormData(prev => ({
                      ...prev,
                      working_hours_to: time.toTimeString().split(' ')[0].substring(0, 5)
                    }));
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default HospitalManagement;
