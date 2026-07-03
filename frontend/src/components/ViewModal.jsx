import React from "react";

const ViewModal = ({ isOpen, onClose, title, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-40 backdrop-blur-sm z-50">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-md w-full shadow-lg transform transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-600">{title} Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        <hr className="mb-4" />

        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => {
            // Ignore technical fields
            if (key === "_id" || key === "__v" || key === "createdAt" || key === "updatedAt") return null;

            return (
              <div key={key} className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}:
                </span>
                <span className="text-gray-600 text-right break-words max-w-full md:w-[60%]">
                  {value?.toString() || "N/A"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewModal;
