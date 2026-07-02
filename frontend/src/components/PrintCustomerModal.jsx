import React, { useRef } from 'react';

const PrintCustomerModal = ({ isOpen, onClose, customer }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Slip</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                height: 100vh;
              }
              .slip-container {
                width: 50%;
                height: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 1px dashed #000;
                page-break-after: avoid;
              }
              .slip-content {
                text-align: center;
                font-family: Arial, sans-serif;
              }
            }
          </style>
        </head>
        <body>
          <div class="slip-container">
            <div class="slip-content">
              ${printContents}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!isOpen || !customer) return null;

  return (
    <>
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slideUp {
            animation: slideUp 0.4s ease-out forwards;
          }
        `}
      </style>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-4 w-[85%] max-w-sm shadow-lg animate-slideUp">
          <div ref={printRef}>
            <h2 className="text-lg font-bold mb-2 text-center">Customer Details</h2>
            <p className="text-sm"><strong>ID:</strong> {customer.customerId}</p>
            <p className="text-sm"><strong>Name:</strong> {customer.name}</p>
            <p className="text-sm"><strong>Phone:</strong> {customer.phone}</p>
            <p className="text-sm"><strong>Balance:</strong> {customer.balance}</p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-300 text-sm rounded hover:bg-gray-400"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintCustomerModal;
