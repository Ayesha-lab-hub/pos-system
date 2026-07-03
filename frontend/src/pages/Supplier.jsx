import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { IoMdAdd } from 'react-icons/io';
import { Link } from 'react-router-dom';
import { LiaFileInvoiceSolid } from "react-icons/lia";
import { RiPrinterLine } from "react-icons/ri";
import AddSupplierModal from '../components/AddSupplierModal';
import ViewModal from '../components/ViewModal';
import { getAllSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../services/api';

const Supplier = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [supplierToView, setSupplierToView] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await getAllSuppliers();
      setSuppliers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEditSupplier = async (data) => {
    try {
      if (supplierToEdit) {
        const res = await updateSupplier(supplierToEdit._id, data);
        setSuppliers(suppliers.map(s => s._id === res._id ? res : s));
      } else {
        const res = await addSupplier(data);
        setSuppliers(prev => [res, ...prev]);
      }
      setIsModalOpen(false);
      setSupplierToEdit(null);
    } catch (err) {
      throw new Error(err?.response?.data?.message || "Error saving supplier");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await deleteSupplier(id);
        setSuppliers(suppliers.filter(s => s._id !== id));
      } catch (err) {
        alert("Error deleting supplier");
      }
    }
  };

  const openAddModal = () => {
    setSupplierToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setSupplierToEdit(supplier);
    setIsModalOpen(true);
  };

  const handlePrintClick = (supplier) => {
    setSelectedSupplier(supplier);
    setPrintModalOpen(true);
  };

  const handleViewClick = (supplier) => {
    setSupplierToView(supplier);
    setViewModalOpen(true);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(s.supplierId).includes(searchTerm) ||
    s.phone?.includes(searchTerm)
  );

  return (
    <div className='w-full p-4 md:p-6'>
      <div className='w-full mx-auto max-w-7xl'>

          {/* Stats + Buttons */}
          <div className='flex flex-col md:flex-row justify-between items-center bg-white shadow-md rounded-lg p-6 w-full max-w-4xl gap-4'>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-600">Total Suppliers</h2>
              <p className="text-3xl font-bold text-blue-600">{suppliers.length}</p>
            </div>

            <div className='flex flex-col sm:flex-row items-center justify-center gap-4 flex-2 w-full md:w-auto'>
              <Link className='flex items-center rounded-lg gap-4 justify-center px-4 py-2 bg-blue-400 text-white w-full sm:w-auto' to="/supplier-invoice">
                <button>Make Invoice</button>
                <LiaFileInvoiceSolid className='text-xl' />
              </Link>

              <div
                onClick={openAddModal}
                className='flex items-center gap-4 justify-center rounded-lg px-4 py-2 bg-green-400 text-white cursor-pointer w-full sm:w-auto'
              >
                <button>Add Supplier</button>
                <IoMdAdd className='text-xl' />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white shadow-md rounded-lg p-4 overflow-x-auto mt-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold">Suppliers</h2>
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
              <p className="text-center py-4">Loading suppliers...</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4">Supplier ID</th>
                    <th className="py-2 px-4">Name</th>
                    <th className="py-2 px-4">Phone</th>
                    <th className="py-2 px-4">Balance</th>
                    <th className="py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier, index) => (
                      <tr key={supplier._id || index} className="border-t">
                        <td className="py-2 px-4">{supplier.supplierId || supplier._id}</td>
                        <td className="py-2 px-4">{supplier.name}</td>
                        <td className="py-2 px-4">{supplier.phone}</td>
                        <td className="py-2 px-4">{supplier.balance ?? '0'}</td>
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-4">
                            <FaEye 
                              onClick={() => handleViewClick(supplier)}
                              className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" 
                              title="View" 
                            />
                            <FaEdit 
                              onClick={() => openEditModal(supplier)}
                              className="text-green-600 cursor-pointer hover:scale-110 transition-transform" 
                              title="Edit" 
                            />
                            <FaTrash 
                              onClick={() => handleDelete(supplier._id)}
                              className="text-red-600 cursor-pointer hover:scale-110 transition-transform" 
                              title="Delete" 
                            />
                            <RiPrinterLine
                              className="text-gray-800 cursor-pointer hover:scale-110 transition-transform"
                              title="Print"
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">No suppliers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Modals */}
          <AddSupplierModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleAddOrEditSupplier}
            initialData={supplierToEdit}
          />
          <ViewModal
            isOpen={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            title="Supplier"
            data={supplierToView}
          />
        </div>
      </div>
  );
};

export default Supplier;
