import { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../components/ui/table';
import { Modal } from '../components/ui/modal';
import Form from '../components/form/Form';
import Input from '../components/form/input/InputField';
import Checkbox from '../components/form/input/Checkbox';
import Select from '../components/form/Select';
import type { HospitalUser, HospitalUserFormData } from '../types/hospitalUser';
import type { Hospital } from '../types/hospital';
import { AlertIcon } from '../icons';
import api from '../services/api';

const UserManagement = () => {
    const [users, setUsers] = useState<HospitalUser[]>([]);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHospital, setSelectedHospital] = useState('');
    const [editingUser, setEditingUser] = useState<HospitalUser | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [validation, setValidation] = useState<Record<string, string>>({});
    const itemsPerPage = 10;

    const initialFormData: HospitalUserFormData = {
        _id: '',
        title: '',
        first_name: '',
        last_name: '',
        hospital_id: '',
        hospital_details: {} as Hospital,
        gender: 'Male',
        email_id: '',
        mobile_number: '',
        phone_number: '',
        qualification: '',
        designation: '',
        is_doctor: false,
        color: '#000000',
        staff_status: 'Active',
        set_availability: false,
        user_role: '',
        is_admin: false,
        photo: ''
    };

    const [formData, setFormData] = useState<HospitalUserFormData>(initialFormData);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (validation[name]) {
            setValidation(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        // Required fields validation
        if (!formData.first_name) errors.first_name = 'First Name is required';
        if (!formData.last_name) errors.last_name = 'Last Name is required';
        if (!formData.hospital_id) errors.hospital_id = 'Hospital is required';
        if (!formData.email_id) errors.email_id = 'Email is required';

        // Email validation
        if (formData.email_id && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_id)) {
            errors.email_id = 'Please enter a valid email address';
        }

        // Phone number validation
        if (formData.phone_number && !/^\d{10,12}$/.test(formData.phone_number.replace(/[-()\s]/g, ''))) {
            errors.phone_number = 'Please enter a valid phone number';
        }

        // Mobile number validation
        if (formData.mobile_number && !/^\d{10,12}$/.test(formData.mobile_number.replace(/[-()\s]/g, ''))) {
            errors.mobile_number = 'Please enter a valid mobile number';
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

        try {
            if (editingUser) {
                const response = await api.put(`/hospitaluser/${editingUser._id}`, formData);
                if (response.status === 200 || response.status === 201) {
                    await fetchUsers();
                }
            } else {
                const response = await api.post('/hospitaluser', formData);
                if (response.status === 200 || response.status === 201) {
                    await fetchUsers();
                }
            }
            handleCloseModal();
        } catch (err) {
            setError('Error saving user data. Please try again.');
            console.error('Error saving user:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (user: HospitalUser) => {
        setEditingUser(user);
        setFormData({
            _id: user._id,
            title: user.title,
            first_name: user.first_name,
            last_name: user.last_name,
            hospital_id: user.hospital_id,
            hospital_details: user.hospital_details,
            gender: user.gender,
            email_id: user.email_id,
            mobile_number: user.mobile_number,
            phone_number: user.phone_number,
            qualification: user.qualification,
            designation: user.designation,
            is_doctor: user.is_doctor,
            color: user.color,
            staff_status: user.staff_status,
            set_availability: user.set_availability,
            user_role: user.user_role,
            is_admin: user.is_admin,
            photo: user.photo
        });

        // Clear any previous validation errors
        setValidation({});
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            setIsLoading(true);
            setError(null);
            try {
                await api.delete(`/hospitaluser/${id}`);
                // Refresh the current page after deletion
                await fetchUsers();
            } catch (err) {
                setError('Error deleting user. Please try again.');
                console.error('Error deleting user:', err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData(initialFormData);
        setValidation({});
    };

    // Function to handle modal click events to prevent closing when clicking inside
    const handleModalContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    const fetchUsers = async (page = currentPage) => {
        setIsLoading(true);
        setError(null);
        try {
            // Add search and pagination parameters to the API call
            const response = await api.get('/hospitaluser', {
                params: {
                    page,
                    limit: itemsPerPage,
                    search: searchTerm.trim() || undefined,
                    hospital_id: selectedHospital || undefined
                }
            });

            // Extract data according to the expected API response structure
            const data = response.data;
            console.log("user data", data);
            setUsers(data?.data?.users || []);
            setTotalCount(data?.data?.totalCount || 0);
            setCurrentPage(data?.data?.page || page);
        } catch (err) {
            setError('Error loading user data. Please try again later.');
            console.error('Error fetching users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle page changes
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchUsers(page);
    };

    // Effect to fetch users on initial load
    // useEffect(() => {
    //     fetchUsers(1);
    // }, []);

    // Effect to handle search and hospital filter with debounce
    useEffect(() => {
        console.log("searchTerm", searchTerm);
        const delayDebounce = setTimeout(() => {
            fetchUsers(1); // Reset to first page when searching or filtering
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm, selectedHospital]);

    // Calculate total pages based on total count from API
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const fetchHospitals = async () => {
        try {
            const response = await api.get('/hospital', {
                params: {
                    limit: 100 // Get a large number of hospitals for the dropdown
                }
            });
            setHospitals(response.data?.data?.hospitals || []);
        } catch (err) {
            console.error('Error fetching hospitals:', err);
            setError('Error loading hospitals. Please try again later.');
        }
    };

    // Effect to fetch hospitals on component mount
    useEffect(() => {
        fetchHospitals();
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <Input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-xs"
                    />
                    <Select
                        defaultValue={selectedHospital}
                        placeholder='Select Hospital'
                        onChange={(value) => setSelectedHospital(value)}
                        options={[
                            { value: '', label: 'All Hospitals' },
                            ...hospitals.map(hospital => ({
                                value: hospital.id,
                                label: hospital.clinic_name
                            }))
                        ]}
                        className="min-w-[200px]"
                    />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                    Create User
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
                                        Name
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Hospital Name
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Role
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Status
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
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                                                {`${user.title} ${user.first_name} ${user.last_name}`}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                                                {`${user.hospital_details.clinic_name}`}
                                            </TableCell>
                                            <TableCell className="px-5 py-4 sm:px-6 text-start text-gray-500 text-theme-sm dark:text-gray-400">
                                                {user.user_role}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                <span className={`px-2 py-1 rounded-full text-xs ${user.staff_status === 'Active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.staff_status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                                {user.mobile_number}
                                            </TableCell>
                                            <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
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
                                                <p className="text-sm">No user records are available at the moment.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-white/[0.05]">
                        <div className="text-sm text-gray-500">
                            Showing {users.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
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
                                let pageNumber;
                                if (totalPages <= 5) {
                                    pageNumber = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNumber = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNumber = totalPages - 4 + i;
                                } else {
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

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                className="max-w-2xl p-6"
                closeOnOutsideClick={false}
            >
                <div onClick={handleModalContentClick}>
                    <h2 className="text-2xl font-semibold mb-6">
                        {editingUser ? 'Edit User' : 'Create User'}
                    </h2>
                    <Form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Title */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Title
                                </label>
                                <Select
                                    defaultValue={formData.title}
                                    onChange={(value) => handleSelectChange('title', value)}
                                    options={[
                                        { value: 'Dr', label: 'Dr' },
                                        { value: 'Mr', label: 'Mr' },
                                        { value: 'Mrs', label: 'Mrs' },
                                        { value: 'Ms', label: 'Ms' }
                                    ]}
                                />
                            </div>

                            {/* First Name */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="first_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    First Name *
                                </label>
                                <Input
                                    id="first_name"
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    placeholder="First Name"
                                    error={!!validation.first_name}
                                />
                                {validation.first_name && (
                                    <p className="text-red-500 text-xs mt-1">{validation.first_name}</p>
                                )}
                            </div>

                            {/* Last Name */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="last_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Last Name *
                                </label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    placeholder="Last Name"
                                    error={!!validation.last_name}
                                />
                                {validation.last_name && (
                                    <p className="text-red-500 text-xs mt-1">{validation.last_name}</p>
                                )}
                            </div>

                            {/* Hospital */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="hospital_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Hospital *
                                </label>
                                <Select
                                    defaultValue={formData.hospital_id}
                                    onChange={(value) => handleSelectChange('hospital_id', value)}
                                    options={hospitals.map(hospital => ({
                                        value: hospital.id,
                                        label: hospital.clinic_name
                                    }))}
                                    className={validation.hospital_id ? 'border-red-500' : ''}
                                />
                                {validation.hospital_id && (
                                    <p className="text-red-500 text-xs mt-1">{validation.hospital_id}</p>
                                )}
                            </div>

                            {/* Gender */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="gender" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Gender
                                </label>
                                <Select
                                    defaultValue={formData.gender}
                                    onChange={(value) => handleSelectChange('gender', value)}
                                    options={[
                                        { value: 'Male', label: 'Male' },
                                        { value: 'Female', label: 'Female' },
                                        { value: 'Other', label: 'Other' }
                                    ]}
                                />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="email_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email *
                                </label>
                                <Input
                                    id="email_id"
                                    type="email"
                                    name="email_id"
                                    value={formData.email_id}
                                    onChange={handleInputChange}
                                    placeholder="Email Address"
                                    error={!!validation.email_id}
                                />
                                {validation.email_id && (
                                    <p className="text-red-500 text-xs mt-1">{validation.email_id}</p>
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

                            {/* Qualification */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="qualification" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Qualification
                                </label>
                                <Input
                                    id="qualification"
                                    type="text"
                                    name="qualification"
                                    value={formData.qualification}
                                    onChange={handleInputChange}
                                    placeholder="Qualification"
                                />
                            </div>

                            {/* Designation */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="designation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Designation
                                </label>
                                <Input
                                    id="designation"
                                    type="text"
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleInputChange}
                                    placeholder="Designation"
                                />
                            </div>

                            {/* User Role */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="user_role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    User Role
                                </label>
                                <Select
                                    defaultValue={formData.user_role}
                                    onChange={(value) => handleSelectChange('user_role', value)}
                                    options={[
                                        { value: 'Admin', label: 'Admin' },
                                        { value: 'Doctor', label: 'Doctor' },
                                        { value: 'Staff', label: 'Staff' },
                                        { value: 'Accountant', label: 'Accountant' }
                                    ]}
                                />
                            </div>

                            {/* Color */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="color" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Color
                                </label>
                                <Input
                                    id="color"
                                    type="color"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Staff Status */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="staff_status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Staff Status
                                </label>
                                <Select
                                    defaultValue={formData.staff_status}
                                    onChange={(value) => handleSelectChange('staff_status', value)}
                                    options={[
                                        { value: 'Active', label: 'Active' },
                                        { value: 'Inactive', label: 'Inactive' }
                                    ]}
                                />
                            </div>

                            {/* Photo URL */}
                            <div className="flex flex-col gap-1">
                                <label htmlFor="photo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Photo URL
                                </label>
                                <Input
                                    id="photo"
                                    type="text"
                                    name="photo"
                                    value={formData.photo}
                                    onChange={handleInputChange}
                                    placeholder="Photo URL"
                                />
                            </div>

                            {/* Checkboxes */}
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_doctor"
                                        checked={formData.is_doctor}
                                        onChange={(checked) => handleCheckboxChange('is_doctor', checked)}
                                    />
                                    <label htmlFor="is_doctor" className="text-sm text-gray-700 dark:text-gray-300">
                                        Is Doctor
                                    </label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="set_availability"
                                        checked={formData.set_availability}
                                        onChange={(checked) => handleCheckboxChange('set_availability', checked)}
                                    />
                                    <label htmlFor="set_availability" className="text-sm text-gray-700 dark:text-gray-300">
                                        Set Availability
                                    </label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_admin"
                                        checked={formData.is_admin}
                                        onChange={(checked) => handleCheckboxChange('is_admin', checked)}
                                    />
                                    <label htmlFor="is_admin" className="text-sm text-gray-700 dark:text-gray-300">
                                        Is Admin
                                    </label>
                                </div>
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

export default UserManagement; 