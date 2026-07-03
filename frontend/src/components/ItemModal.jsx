import React, { useState, useEffect } from 'react';

const ItemModal = ({ visible, onClose, onSubmit, initialData = null }) => {
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setItemId(initialData.id || '');
        setItemName(initialData.name || '');
      } else {
        setItemId('');
        setItemName('');
      }
    }
  }, [visible, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ itemId, itemName });
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      {/* Inline animation keyframes */}
      <style>
        {`
          @keyframes slideUp {
            0% {
              transform: translateY(100%);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Transparent + Blur Overlay */}
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent backdrop-blur-sm">
        <div
          className="bg-white w-full max-w-md w-full rounded-lg p-6 shadow-lg"
          style={{
            animation: 'slideUp 0.3s ease-out forwards',
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{initialData ? "Edit Item" : "Add New Item"}</h2>
            <button onClick={onClose} className="text-red-500 text-2xl font-bold">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Item ID</label>
              <input
                type="text"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Item Name</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Save Item
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ItemModal;
