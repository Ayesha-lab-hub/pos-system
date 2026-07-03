import React, { useState, useEffect, useContext } from 'react';
import { FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import { IoMdAdd } from 'react-icons/io';
import { AuthContext } from '../context/AuthContext';
import ItemModal from '../components/ItemModal';
import ViewModal from '../components/ViewModal';
import { getItems, addItem, updateItem, deleteItem } from '../services/api';

const Items = () => {
  const [showModal, setShowModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [items, setItems] = useState([]);   // ✅ always start with array
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToView, setItemToView] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await getItems();
      console.log("Fetched items:", data);

      // ✅ Ensure array is set
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data.items && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
      setItems([]);
    }
  };

  const handleAddOrEditItem = async ({ itemId, itemName }) => {
    try {
      let res;
      if (itemToEdit) {
        res = await updateItem(itemToEdit._id, { id: itemId, name: itemName });
      } else {
        res = await addItem({ id: itemId, name: itemName });
      }

      // ✅ Show success message
      if (res.message) {
        setMessage(res.message);
      } else {
        setMessage("Item saved successfully");
      }

      // ✅ Refresh list after saving
      fetchItems();
      setItemToEdit(null);
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Error saving item:", error);
      setMessage("Failed to save item");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteItem(id);
        setItems(items.filter(i => i._id !== id));
        setMessage("Item deleted successfully");
        setTimeout(() => setMessage(""), 2000);
      } catch (err) {
        setMessage("Error deleting item");
        setTimeout(() => setMessage(""), 2000);
      }
    }
  };

  const openAddModal = () => {
    setItemToEdit(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setItemToEdit(item);
    setShowModal(true);
  };

  const handleViewClick = (item) => {
    setItemToView(item);
    setViewModalOpen(true);
  };

  const filteredItems = items.filter(i => 
    i.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(i.id).includes(searchTerm)
  );

  return (
    <div className='w-full h-[90vh] p-10 relative'>
      {/* ✅ Success Message */}
      {message && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow">
          {message}
        </div>
      )}

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className="bg-white w-full max-w-[300px] shadow-md rounded-lg p-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-600">Total Items</h2>
          <p className="text-3xl font-bold text-blue-600">{items.length}</p>
        </div>

        {/* Add Item Button */}
        <div
          onClick={openAddModal}
          className='flex items-center gap-4 justify-center rounded-lg px-4 py-2 bg-green-400 text-white cursor-pointer hover:bg-green-500 transition'
        >
          <button>Add Item</button>
          <IoMdAdd className='text-xl' />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow-md rounded-lg p-4 mt-10 overflow-x-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Items List</h2>
          <div className="relative w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search by Name or ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4">Item ID</th>
              <th className="py-2 px-4">Item Name</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => (
                <tr className="border-t" key={item._id || idx}>
                  <td className="py-2 px-4">{item.id}</td>
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-4">
                      <FaEye
                        onClick={() => handleViewClick(item)}
                        className="text-blue-600 cursor-pointer hover:scale-110 transition-transform"
                        title="View"
                      />
                      {user?.role === 'ADMIN' && (
                        <>
                          <FaEdit
                            onClick={() => openEditModal(item)}
                            className="text-orange-500 cursor-pointer hover:scale-110 transition-transform"
                            title="Edit"
                          />
                          <FaTrash
                            onClick={() => handleDelete(item._id)}
                            className="text-red-600 cursor-pointer hover:scale-110 transition-transform"
                            title="Delete"
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <ItemModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddOrEditItem}
        initialData={itemToEdit}
      />
      <ViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Item"
        data={itemToView}
      />
    </div>
  );
};

export default Items;
