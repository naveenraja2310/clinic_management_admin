import { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/table';
import { Modal } from '../components/ui/modal';
import Form from '../components/form/Form';
import Input from '../components/form/input/InputField';
import type { Hospital, HospitalFormData } from '../types/hospital';
import { AlertIcon } from '../icons';

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
    registrationId: '',
    registrationDate: '',
    clinicName: '',
    speciality: '',
    address: '',
    address2: '',
    pinCode: '',
    country: '',
    state: '',
    city: '',
    phoneNumber: '',
    mobileNumber: '',
    workingHours: {
      fromTime: '',
      toTime: ''
    }
  };

  const [formData, setFormData] = useState<HospitalFormData>(initialFormData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('workingHours.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        workingHours: {
          ...prev.workingHours,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (editingHospital) {
        // Update existing hospital
        const response = await fetch(`https://api.example.com/hospitals/${editingHospital.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update hospital');
        }
        
        // Update local state
        setHospitals(prev =>
          prev.map(hospital =>
            hospital.id === editingHospital.id
              ? { ...formData, id: hospital.id }
              : hospital
          )
        );
      } else {
        // Create new hospital
        const response = await fetch('https://api.example.com/hospitals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create hospital');
        }
        
        const newHospital = await response.json();
        setHospitals(prev => [...prev, newHospital]);
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
    setFormData(hospital);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this hospital?')) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://api.example.com/hospitals/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete hospital');
        }
        
        setHospitals(prev => prev.filter(hospital => hospital.id !== id));
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

  // API functions for hospital data
  const fetchHospitals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('https://api.example.com/hospitals');
      if (!response.ok) {
        throw new Error('Failed to fetch hospitals');
      }
      const data = await response.json();
      setHospitals(data);
    } catch (err) {
      setError('Error loading hospital data. Please try again later.');
      console.error('Error fetching hospitals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load hospitals on component mount
  useEffect(() => {
    fetchHospitals();
  }, []);

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.registrationId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);
  const currentHospitals = filteredHospitals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
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
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Registration ID</TableCell>
                <TableCell isHeader>Clinic Name</TableCell>
                <TableCell isHeader>Speciality</TableCell>
                <TableCell isHeader>Contact</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentHospitals.length > 0 ? (
                currentHospitals.map((hospital) => (
                  <TableRow key={hospital.id}>
                    <TableCell>{hospital.registrationId}</TableCell>
                    <TableCell>{hospital.clinicName}</TableCell>
                    <TableCell>{hospital.speciality}</TableCell>
                    <TableCell>{hospital.phoneNumber}</TableCell>
                    <TableCell>
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
                  <TableCell>
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500" style={{ gridColumn: `span 5 / span 5` }}>
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

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="max-w-2xl p-6"
      >
        <h2 className="text-2xl font-semibold mb-6">
          {editingHospital ? 'Edit Hospital' : 'Create Hospital'}
        </h2>
        <Form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="registrationId" className="text-sm font-medium text-gray-700 dark:text-gray-300">Registration ID</label>
              <Input
                id="registrationId"
                type="text"
                name="registrationId"
                placeholder="Registration ID"
                value={formData.registrationId}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="registrationDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Registration Date</label>
              <Input
                id="registrationDate"
                type="date"
                name="registrationDate"
                value={formData.registrationDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="clinicName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Clinic Name</label>
              <Input
                id="clinicName"
                type="text"
                name="clinicName"
                placeholder="Clinic Name"
                value={formData.clinicName}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="speciality" className="text-sm font-medium text-gray-700 dark:text-gray-300">Speciality</label>
              <Input
                id="speciality"
                type="text"
                name="speciality"
                placeholder="Speciality"
                value={formData.speciality}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              <Input
                id="address"
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="address2" className="text-sm font-medium text-gray-700 dark:text-gray-300">Address 2</label>
              <Input
                id="address2"
                type="text"
                name="address2"
                placeholder="Address 2"
                value={formData.address2}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="pinCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">Pin Code</label>
              <Input
                id="pinCode"
                type="text"
                name="pinCode"
                placeholder="Pin Code"
                value={formData.pinCode}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="country" className="text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
              <Input
                id="country"
                type="text"
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="state" className="text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
              <Input
                id="state"
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
              <Input
                id="city"
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <Input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
              <Input
                id="mobileNumber"
                type="tel"
                name="mobileNumber"
                placeholder="Mobile Number"
                value={formData.mobileNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="workingHoursFrom" className="text-sm font-medium text-gray-700 dark:text-gray-300">Working Hours From</label>
              <Input
                id="workingHoursFrom"
                type="time"
                name="workingHours.fromTime"
                placeholder="From Time"
                value={formData.workingHours.fromTime}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="workingHoursTo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Working Hours To</label>
              <Input
                id="workingHoursTo"
                type="time"
                name="workingHours.toTime"
                placeholder="To Time"
                value={formData.workingHours.toTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
            >
              {editingHospital ? 'Update' : 'Save'}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default HospitalManagement;