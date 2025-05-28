import { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/table';
import { Modal } from '../components/ui/modal';
import Form from '../components/form/Form';
import Input from '../components/form/input/InputField';
import TimePicker from '../components/form/time-picker';
import DatePicker from '../components/form/date-picker';
import type { Hospital, HospitalFormData } from '../types/hospital';
import { AlertIcon } from '../icons';
import api from '../services/api';

const HospitalManagement = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [validation, setValidation] = useState<Record<string, string>>({});
  const itemsPerPage = 10;

  // Get today's date in YYYY-MM-DD format for the default registration date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const initialFormData: HospitalFormData = {
    registration_id: "",
    registration_date: getTodayDate(),
    clinic_name: '',
    speciality: '',
    logo: '',
    email: '',
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

    // Clear validation error when field is edited
    if (validation[name]) {
      setValidation(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.clinic_name) errors.clinic_name = 'Clinic Name is required';
    if (!formData.address) errors.address = 'Address is required';
    if (!formData.pin_code) errors.pin_code = 'Pin Code is required';

    // Pin code format validation (assuming pin code is a 6-digit number)
    if (formData.pin_code && !/^\d{6}$/.test(formData.pin_code)) {
      errors.pin_code = 'Pin Code must be a 6-digit number';
    }

    // Phone number validation
    if (formData.phone_number && !/^\d{10,12}$/.test(formData.phone_number.replace(/[-()\s]/g, ''))) {
      errors.phone_number = 'Please enter a valid phone number';
    }

    // Mobile number validation
    if (formData.mobile_number && !/^\d{10,12}$/.test(formData.mobile_number.replace(/[-()\s]/g, ''))) {
      errors.mobile_number = 'Please enter a valid mobile number';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Working hours validation
    if (formData.working_hours_from && formData.working_hours_to) {
      const fromTime = new Date(`1970-01-01T${formData.working_hours_from}`);
      const toTime = new Date(`1970-01-01T${formData.working_hours_to}`);

      if (fromTime >= toTime) {
        errors.working_hours_to = 'Working Hours To must be later than Working Hours From';
      }
    }

    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const hospitalData = {
      registration_date: new Date(formData.registration_date),
      clinic_name: formData.clinic_name,
      speciality: formData.speciality,
      logo: formData.logo,
      email: formData.email,
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
      registration_date = '',
      clinic_name = '',
      speciality = '',
      logo = '',
      email = '',
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
      registration_id: "",
      registration_date,
      clinic_name,
      speciality,
      logo,
      email,
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

    // Clear any previous validation errors
    setValidation({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this hospital?')) {
      setIsLoading(true);
      setError(null);
      try {
        await api.delete(`/hospital/${id}`);
        // Refresh the current page after deletion
        await fetchHospitals();
      } catch (err) {
        setError('Error deleting hospital. Please try again.');
        console.error('Error deleting hospital:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    console.log("triggering handleCloseModal")
    setIsModalOpen(false);
    setEditingHospital(null);
    setFormData(initialFormData);
    setValidation({});
  };

  // Function to handle modal click events to prevent closing when clicking inside
  const handleModalContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log("handleModalContentClick0")
    e.stopPropagation();
  };

  const fetchHospitals = async (page = currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      // Add search and pagination parameters to the API call
      const response = await api.get('/hospital', {
        params: {
          page,
          limit: itemsPerPage,
          search: searchTerm.trim() || undefined
        }
      });

      // Extract data according to the expected API response structure
      const data = response.data;
      setHospitals(data?.data?.hospitals || []);
      setTotalCount(data?.data?.totalCount || 0);
      setCurrentPage(data?.data?.page || page);
    } catch (err) {
      setError('Error loading hospital data. Please try again later.');
      console.error('Error fetching hospitals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchHospitals(page);
  };

  // Effect to fetch hospitals on initial load
  // useEffect(() => {
  //   fetchHospitals(1);
  // }, []);

  // Effect to handle search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchHospitals(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Calculate total pages based on total count from API
  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
                {hospitals.length > 0 ? (
                  hospitals.map((hospital) => (
                    <TableRow key={hospital.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                        {hospital.registration_id}
                      </TableCell>
                      <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
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
                    <TableCell className="px-5 py-4" >
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

        {/* Pagination Controls - Updated for API-based pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-white/[0.05]">
            <div className="text-sm text-gray-500">
              Showing {hospitals.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
            </div>
            <div className="flex gap-2">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Previous
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show pages around the current page
                let pageNumber;

                if (totalPages <= 5) {
                  // If total pages are 5 or less, show all pages
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  // If we're at the beginning
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  // If we're at the end
                  pageNumber = totalPages - 4 + i;
                } else {
                  // We're in the middle
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1 rounded ${currentPage === pageNumber
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal with fixed closing behavior */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="max-w-2xl p-6"
        closeOnOutsideClick={false}
      >
        <div onClick={handleModalContentClick}>
          <h2 className="text-2xl font-semibold mb-6">
            {editingHospital ? 'Edit Hospital' : 'Create Hospital'}
          </h2>
          <Form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clinic Name */}
              <div className="flex flex-col gap-1">
                <label htmlFor="clinic_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Clinic Name *
                </label>
                <Input
                  id="clinic_name"
                  type="text"
                  name="clinic_name"
                  value={formData.clinic_name}
                  onChange={handleInputChange}
                  placeholder="Clinic Name"
                  error={!!validation.clinic_name}
                />
                {validation.clinic_name && (
                  <p className="text-red-500 text-xs mt-1">{validation.clinic_name}</p>
                )}
              </div>

              {/* Speciality */}
              <div className="flex flex-col gap-1">
                <label htmlFor="speciality" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Speciality
                </label>
                <Input
                  id="speciality"
                  type="text"
                  name="speciality"
                  value={formData.speciality}
                  onChange={handleInputChange}
                  placeholder="Speciality"
                />
              </div>

              {/* Logo */}
              <div className="flex flex-col gap-1">
                <label htmlFor="logo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Logo
                </label>
                <Input
                  id="logo"
                  type="text"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  placeholder="Logo URL"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email Address"
                  error={!!validation.email}
                />
                {validation.email && (
                  <p className="text-red-500 text-xs mt-1">{validation.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1">
                <label htmlFor="phone_number" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <Input
                  id="phone_number"
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  error={!!validation.phone_number}
                />
                {validation.phone_number && (
                  <p className="text-red-500 text-xs mt-1">{validation.phone_number}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="flex flex-col gap-1">
                <label htmlFor="mobile_number" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mobile Number
                </label>
                <Input
                  id="mobile_number"
                  type="text"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                  placeholder="Mobile Number"
                  error={!!validation.mobile_number}
                />
                {validation.mobile_number && (
                  <p className="text-red-500 text-xs mt-1">{validation.mobile_number}</p>
                )}
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1">
                <label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address *
                </label>
                <Input
                  id="address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address"
                  error={!!validation.address}
                />
                {validation.address && (
                  <p className="text-red-500 text-xs mt-1">{validation.address}</p>
                )}
              </div>

              {/* Address 2 */}
              <div className="flex flex-col gap-1">
                <label htmlFor="address2" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address 2
                </label>
                <Input
                  id="address2"
                  type="text"
                  name="address2"
                  value={formData.address2}
                  onChange={handleInputChange}
                  placeholder="Address 2"
                />
              </div>

              {/* City */}
              <div className="flex flex-col gap-1">
                <label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  City
                </label>
                <Input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </div>

              {/* State */}
              <div className="flex flex-col gap-1">
                <label htmlFor="state" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  State
                </label>
                <Input
                  id="state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                />
              </div>

              {/* Country */}
              <div className="flex flex-col gap-1">
                <label htmlFor="country" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Country
                </label>
                <Input
                  id="country"
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                />
              </div>

              {/* Pin Code */}
              <div className="flex flex-col gap-1">
                <label htmlFor="pin_code" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pin Code *
                </label>
                <Input
                  id="pin_code"
                  type="text"
                  name="pin_code"
                  value={formData.pin_code}
                  onChange={handleInputChange}
                  placeholder="Pin Code"
                  error={!!validation.pin_code}
                />
                {validation.pin_code && (
                  <p className="text-red-500 text-xs mt-1">{validation.pin_code}</p>
                )}
              </div>

              {/* Date Picker */}
              <div className="flex flex-col gap-1">
                <DatePicker
                  id="registration_date"
                  label="Registration Date"
                  defaultDate={formData.registration_date ? new Date(formData.registration_date) : new Date()}
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

              {/* Working Hours From */}
              <div className="flex flex-col gap-1">
                <TimePicker
                  id="working_hours_from"
                  label="Working Hours From"
                  defaultTime={formData.working_hours_from ? new Date(`1970-01-01T${formData.working_hours_from}`) : undefined}
                  onChange={(selectedDates) => {
                    if (selectedDates.length > 0) {
                      const time = selectedDates[0];
                      const timeString = time.toTimeString().split(' ')[0].substring(0, 5);
                      setFormData(prev => ({
                        ...prev,
                        working_hours_from: timeString
                      }));

                      // Clear validation error
                      if (validation.working_hours_to) {
                        setValidation(prev => ({
                          ...prev,
                          working_hours_to: ''
                        }));
                      }
                    }
                  }}
                />
              </div>

              {/* Working Hours To */}
              <div className="flex flex-col gap-1">
                <TimePicker
                  id="working_hours_to"
                  label="Working Hours To"
                  defaultTime={formData.working_hours_to ? new Date(`1970-01-01T${formData.working_hours_to}`) : undefined}
                  onChange={(selectedDates) => {
                    if (selectedDates.length > 0) {
                      const time = selectedDates[0];
                      const timeString = time.toTimeString().split(' ')[0].substring(0, 5);
                      setFormData(prev => ({
                        ...prev,
                        working_hours_to: timeString
                      }));

                      // Validate working hours if both fields have values
                      if (formData.working_hours_from && timeString) {
                        const fromTime = new Date(`1970-01-01T${formData.working_hours_from}`);
                        const toTime = new Date(`1970-01-01T${timeString}`);

                        if (fromTime >= toTime) {
                          setValidation(prev => ({
                            ...prev,
                            working_hours_to: 'Working Hours To must be later than Working Hours From'
                          }));
                        } else {
                          setValidation(prev => ({
                            ...prev,
                            working_hours_to: ''
                          }));
                        }
                      }
                    }
                  }}
                />
                {validation.working_hours_to && (
                  <p className="text-red-500 text-xs mt-1">{validation.working_hours_to}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default HospitalManagement;