import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import PopupArrivalForm from "../components/PopupArrivalForm";
import { IoMdAdd } from "react-icons/io";
import { getAllArrivals, deleteArrival, searchArrivals } from "../services/api";
import { AuthContext } from "../context/AuthContext";

const NewArrivals = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);

  // Fetch all arrivals
  const fetchArrivals = async () => {
    try {
      const data = await getAllArrivals();
      
      // Filter for only today's arrivals and not sold out
      const today = new Date().toLocaleDateString();
      const todaysArrivals = data.filter(arr => {
        const arrivalDate = new Date(arr.createdAt).toLocaleDateString();
        const isRemaining = (arr.quantity - (arr.totalPurchased || 0)) > 0;
        return arrivalDate === today && isRemaining;
      });
      
      setArrivals(todaysArrivals);
    } catch (err) {
      console.error("Error fetching arrivals:", err);
      alert("Failed to fetch arrivals");
    }
  };

  useEffect(() => {
    fetchArrivals();
  }, []);

  const openPopup = (data = null) => {
    setEditData(data);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setEditData(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this arrival?")) return;

    try {
      await deleteArrival(id);
      alert("Deleted successfully");
      fetchArrivals();
    } catch (err) {
      console.error("Error deleting arrival:", err);
      alert("Failed to delete arrival");
    }
  };

  // Called after add/update form submits successfully
  const handleArrivalAdded = () => fetchArrivals();

  // ✅ Search by supplier name/id only
  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    try {
      if (!term) {
        fetchArrivals();
        return;
      }

      const data = await searchArrivals(term);
      
      // Filter search results for only today's arrivals and not sold out
      const today = new Date().toLocaleDateString();
      const todaysArrivals = data.filter(arr => {
        const arrivalDate = new Date(arr.createdAt).toLocaleDateString();
        const isRemaining = (arr.quantity - (arr.totalPurchased || 0)) > 0;
        return arrivalDate === today && isRemaining;
      });
      
      setArrivals(todaysArrivals);
    } catch (err) {
      console.error("Error searching arrivals:", err);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full h-[90vh] flex items-center justify-center">
        <div className="w-[90%] h-[70vh]">
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 overflow-x-auto mt-6">
            <div className="flex items-center justify-between mb-8 w-full gap-6">
              <div className="relative w-full max-w-md">
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all shadow-sm text-sm"
                  type="text"
                  placeholder="Search by Supplier Name or ID"
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <span className="absolute left-3 top-3 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
              </div>
              <div
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer text-sm"
                onClick={() => openPopup()}
              >
                Make New Arrival
                <IoMdAdd className="text-lg" />
              </div>
            </div>

            <h2 className="text-lg text-slate-800 font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
              Today's Arrivals
            </h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold">Sup.Id</th>
                  <th className="py-3 px-4 font-semibold">Sup.Name</th>
                  <th className="py-3 px-4 font-semibold">Vehicle No.</th>
                  <th className="py-3 px-4 font-semibold">Item</th>
                  <th className="py-3 px-4 font-semibold">No Of Items</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {arrivals.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No arrivals found.
                    </td>
                  </tr>
                ) : (
                  arrivals.map((arrival) => (
                    <tr key={arrival._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">{arrival.supplierId?.supplierId || "-"}</td>
                      <td className="py-3 px-4">{arrival.supplierId?.name || "-"}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{arrival.vehicleNumber}</td>
                      <td className="py-3 px-4">{arrival.fruitName}</td>
                      <td className="py-3 px-4 font-medium text-emerald-600">{arrival.quantity}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(arrival.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <button className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-600 hover:text-white transition-colors" title="Edit" onClick={() => openPopup(arrival)}>
                            <FaEdit />
                          </button>
                          <button className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-600 hover:text-white transition-colors" title="Delete" onClick={() => handleDelete(arrival._id)}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PopupArrivalForm isOpen={isPopupOpen} onClose={closePopup} editData={editData} onArrivalAdded={handleArrivalAdded} />
    </div>
  );
};

export default NewArrivals;
