import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { IoMdAdd } from 'react-icons/io';
import { Link } from 'react-router-dom';
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { RiPrinterLine } from "react-icons/ri";
import AddCustomerModal from '../components/AddCustomerModal';
import PrintCustomerModal from '../components/PrintCustomerModal';
import ViewModal from '../components/ViewModal';
import { getAllCustomers, addCustomer, updateCustomer, deleteCustomer } from '../services/api';

const Customer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [customerToView, setCustomerToView] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await getAllCustomers();
      setCustomers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEditCustomer = async (data) => {
    try {
      if (customerToEdit) {
        const res = await updateCustomer(customerToEdit._id, data);
        setCustomers(customers.map(c => c._id === res._id ? res : c));
      } else {
        const res = await addCustomer(data);
        setCustomers(prev => [res, ...prev]);
      }
      setIsModalOpen(false);
      setCustomerToEdit(null);
    } catch (err) {
      throw new Error(err?.response?.data?.message || "Error saving customer");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer(id);
        setCustomers(customers.filter(c => c._id !== id));
      } catch (err) {
        alert("Error deleting customer");
      }
    }
  };

  const openAddModal = () => {
    setCustomerToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setCustomerToEdit(customer);
    setIsModalOpen(true);
  };

  const handlePrintClick = (customer) => {
    setSelectedCustomer(customer);
    setPrintModalOpen(true);
  };

  const handleViewClick = (customer) => {
    setCustomerToView(customer);
    setViewModalOpen(true);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(c.customerId).includes(searchTerm) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className='w-full p-4 md:p-6'>
      <div className='w-full mx-auto max-w-7xl'>

          {/* Stats + Buttons */}
          <div className='flex flex-col md:flex-row justify-between items-center w-full gap-4'>
            <div className="bg-white flex-2 shadow-md rounded-lg p-6 border-l-4 border-blue-500 w-full md:w-auto text-center md:text-left">
              <h2 className="text-lg font-semibold text-gray-600">Total Customers</h2>
              <p className="text-3xl font-bold text-blue-600">{customers.length}</p>
            </div>

            <div className='flex flex-col sm:flex-row items-center justify-center gap-4 flex-2 w-full md:w-auto'>
              <Link className='flex items-center rounded-lg gap-4 justify-center px-4 py-2 bg-blue-400 text-white w-full sm:w-auto' to="/customer-invoice">
                <button>Make Invoice</button>
                <LiaFileInvoiceSolid className='text-xl' />
              </Link>

              <div
                onClick={openAddModal}
                className='flex items-center gap-4 justify-center rounded-lg px-4 py-2 bg-green-400 text-white cursor-pointer w-full sm:w-auto'
              >
                <button>Add Customer</button>
                <IoMdAdd className='text-xl' />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white shadow-md rounded-lg p-4 overflow-x-auto mt-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold">Customers</h2>
              <div className="relative w-full md:w-1/3">
                <input
                  type="text"
                  placeholder="Search by Name, ID, or Phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
              </div>
            </div>

            {loading ? (
              <p className="text-center py-4">Loading customers...</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4">Customer ID</th>
                    <th className="py-2 px-4">Name</th>
                    <th className="py-2 px-4">Phone</th>
                    <th className="py-2 px-4">Balance</th>
                    <th className="py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer, index) => (
                      <tr key={customer._id || index} className="border-t">
                        <td className="py-2 px-4">{customer.customerId || customer._id}</td>
                        <td className="py-2 px-4">{customer.name}</td>
                        <td className="py-2 px-4">{customer.phone}</td>
                        <td className="py-2 px-4">{customer.balance ?? '0'}</td>
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-4">
                            <FaEye 
                              onClick={() => handleViewClick(customer)}
                              className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" 
                              title="View" 
                            />
                            <FaEdit 
                              onClick={() => openEditModal(customer)} 
                              className="text-green-600 cursor-pointer hover:scale-110 transition-transform" 
                              title="Edit" 
                            />
                            <FaTrash 
                              onClick={() => handleDelete(customer._id)}
                              className="text-red-600 cursor-pointer hover:scale-110 transition-transform" 
                              title="Delete" 
                            />
                            <RiPrinterLine
                              onClick={() => handlePrintClick(customer)}
                              className="text-gray-800 cursor-pointer hover:scale-110 transition-transform"
                              title="Print"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">No customers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Modals */}
          <AddCustomerModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleAddOrEditCustomer}
            initialData={customerToEdit}
          />
          <PrintCustomerModal
            isOpen={printModalOpen}
            onClose={() => setPrintModalOpen(false)}
            customer={selectedCustomer}
          />
          <ViewModal
            isOpen={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            title="Customer"
            data={customerToView}
          />
        </div>
      </div>
  );
};

export default Customer;
