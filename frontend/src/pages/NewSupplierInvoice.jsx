import React, { useState, useEffect } from 'react'
import Select from "react-select"
import { getAllSuppliers, getItems, saveSupplierInvoice } from '../services/api'
import { toast } from "react-toastify";
import { AuthContext } from '../context/AuthContext';

const NewSupplierInvoice = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);
    const { user } = React.useContext(AuthContext);

    const [formData, setFormData] = useState({
        supplierId: null,
        vehicleNumber: '',
        itemId: null,
        noOfItems: '',
        description: '',
        amountReceived: '',
        // expenses
        commission: '',
        karaya: '',
        labour: '',
        market: '',
        manshiaana: '',
        fund: '',
        katoti: '',
        wapsiKharcha: ''
    });

    useEffect(() => {
        const fetchDropdowns = async () => {
            const sups = await getAllSuppliers();
            const itms = await getItems();
            if (sups) setSuppliers(sups.map(s => ({ value: s._id, label: s.name })));
            if (itms) setItems(itms.map(i => ({ value: i._id, label: i.name })));
        };
        fetchDropdowns();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Calculations
    const getNum = (val) => Number(val) || 0;
    
    const totalExpense = 
        getNum(formData.commission) + getNum(formData.karaya) + getNum(formData.labour) +
        getNum(formData.market) + getNum(formData.manshiaana) + getNum(formData.fund) +
        getNum(formData.katoti) + getNum(formData.wapsiKharcha);

    const amountReceived = getNum(formData.amountReceived);
    const grossAmount = amountReceived - totalExpense;

    const clearForm = () => {
        setFormData({
            supplierId: null,
            vehicleNumber: '',
            itemId: null,
            noOfItems: '',
            description: '',
            amountReceived: '',
            commission: '',
            karaya: '',
            labour: '',
            market: '',
            manshiaana: '',
            fund: '',
            katoti: '',
            wapsiKharcha: ''
        });
    };

    const generatePrintReceipt = () => {
        const selectedSupplierName = suppliers.find(s => s.value === formData.supplierId)?.label || "Unknown Supplier";
        const selectedItemName = items.find(i => i.value === formData.itemId)?.label || "Unknown Item";
        const dateStr = new Date().toLocaleDateString();

        const printContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; color: black;">
                <div style="text-align: center; background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                    <h1 style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: 1px;">Zameendara Fruit Mandi</h1>
                    <h3 style="margin: 10px 0 0 0; color: #fff3e0; font-weight: 500;">Supplier Final Settlement</h3>
                </div>
                
                <table style="width: 100%; margin-bottom: 30px;">
                    <tr>
                        <td><strong>Supplier:</strong> ${selectedSupplierName}</td>
                        <td style="text-align: right;"><strong>Date:</strong> ${dateStr}</td>
                    </tr>
                    <tr>
                        <td><strong>Vehicle:</strong> ${formData.vehicleNumber}</td>
                        <td style="text-align: right;"></td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr style="border-bottom: 2px solid black;">
                        <th style="text-align: left; padding: 10px 0;">Item Details</th>
                        <th style="text-align: right; padding: 10px 0;">Quantity</th>
                    </tr>
                    <tr style="border-bottom: 1px solid #ccc;">
                        <td style="padding: 10px 0;">${selectedItemName}</td>
                        <td style="text-align: right; padding: 10px 0;">${formData.noOfItems}</td>
                    </tr>
                </table>

                <div style="width: 60%; margin-left: auto;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 15px;">
                        <span>Total Sale Amount:</span>
                        <span>Rs. ${amountReceived}</span>
                    </div>
                    
                    <p style="font-weight: bold; margin: 0 0 10px 0;">Deducted Expenses:</p>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0;"><span>Commission:</span> <span>${formData.commission || 0}</span></div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0;"><span>Karaya:</span> <span>${formData.karaya || 0}</span></div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0;"><span>Labour:</span> <span>${formData.labour || 0}</span></div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0;"><span>Market:</span> <span>${formData.market || 0}</span></div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0;"><span>Manshiaana:</span> <span>${formData.manshiaana || 0}</span></div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0;"><span>Fund:</span> <span>${formData.fund || 0}</span></div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0;"><span>Katoti:</span> <span>${formData.katoti || 0}</span></div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0;"><span>Wapsi Kharcha:</span> <span>${formData.wapsiKharcha || 0}</span></div>
                    
                    <div style="display: flex; justify-content: space-between; font-weight: bold; color: #d32f2f; border-bottom: 2px solid black; padding: 10px 0; margin: 10px 0;">
                        <span>Total Expenses:</span>
                        <span>Rs. ${totalExpense}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 24px; padding-top: 10px;">
                        <span>Net Payable:</span>
                        <span>Rs. ${grossAmount}</span>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; color: #666;">
                    <p style="margin-bottom: 5px;"><strong>Generated By:</strong> ${user?.username || "System"}</p>
                    <p>Thank you for doing business with Zameendara Fruit Mandi!</p>
                </div>
            </div>
        `;

        const WinPrint = window.open("", "", "width=900,height=700");
        WinPrint.document.write(`<html><head><title>Supplier Invoice</title></head><body style="margin:0;">${printContent}</body></html>`);
        WinPrint.document.close();
        WinPrint.focus();
        setTimeout(() => {
            WinPrint.print();
            WinPrint.close();
        }, 250);
    };

    const handleSave = async (print = false) => {
        if (!formData.supplierId || !formData.vehicleNumber || !formData.itemId || !formData.amountReceived) {
            toast.error("Please fill all required fields (Supplier, Vehicle, Item, Amount Received)");
            return;
        }

        try {
            const payload = { ...formData, totalExpense, grossAmount, generatedBy: user?.username || "System" };
            await saveSupplierInvoice(payload);
            toast.success("Supplier Invoice saved successfully!");
            
            if (print) {
                generatePrintReceipt();
            }
            clearForm();
        } catch (error) {
            console.error("Failed to save supplier invoice:", error);
            toast.error("Failed to save invoice.");
        }
    };

    const selectedSupplierName = suppliers.find(s => s.value === formData.supplierId)?.label || "Unknown Supplier";
    const selectedItemName = items.find(i => i.value === formData.itemId)?.label || "Unknown Item";

    return (
        <div>
            {/* Screen UI - Hidden when printing */}
            <div className='w-full p-6 print:hidden'>
                <div className='w-full flex items-center justify-center gap-10'>
                <div className='w-full md:w-1/2 rounded-2xl bg-white p-8 border-t-4 border-blue-700'>
                    <form>
                        <h1 className='mb-4'>Details</h1>
                        <hr className='mb-8' />
                        <div className='flex flex-col'>
                            <Select
                                className='mt-2'
                                options={suppliers}
                                placeholder="Search or select a name"
                                onChange={(opt) => setFormData(prev => ({ ...prev, supplierId: opt.value }))}
                                isSearchable
                                classNamePrefix="react-select"
                            />
                            <div className='mt-4'>
                                <label className="block mb-2 font-medium">Select Vehicle num:</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} placeholder='Enter Num' />
                            </div>
                            <Select
                                className='mt-4'
                                options={items}
                                placeholder="Search or select Item"
                                onChange={(opt) => setFormData(prev => ({ ...prev, itemId: opt.value }))}
                                isSearchable
                                classNamePrefix="react-select"
                            />
                            <div className='mt-4'>
                                <label className="block mb-2 font-medium">No of Items:</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="number" name="noOfItems" value={formData.noOfItems} onChange={handleChange} placeholder='Enter Num' />
                            </div>
                            <div className='mt-4'>
                                <label className="block mb-2 font-medium">Description:</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="text" name="description" value={formData.description} onChange={handleChange} placeholder='Enter Desc' />
                            </div>
                        </div>
                    </form>
                </div>
                <div className='w-full md:w-1/2 rounded-2xl bg-white p-8 border-t-4 border-red-400'>
                    <form>
                        <h1 className='mb-4'>Expence Detail</h1>
                        <hr className='mb-4' />
                        <div className='flex items-center mb-4 justify-center gap-4'>
                            <div className="w-full">
                                <label className="block mb-2 font-medium">Commission:</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="number" name="commission" value={formData.commission} onChange={handleChange} placeholder='Enter Commission' />
                            </div>
                            <div className="w-full">
                                <label className="block mb-2 font-medium">Karaya :</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="number" name="karaya" value={formData.karaya} onChange={handleChange} placeholder='Enter Karaya' />
                            </div>
                        </div>
                        <div className='flex items-center mb-4  justify-center gap-4'>
                            <div className="w-full">
                                <label className="block mb-2 font-medium">Labour:</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="number" name="labour" value={formData.labour} onChange={handleChange} placeholder='Enter Amount' />
                            </div>
                            <div className="w-full">
                                <label className="block mb-2 font-medium">Market:</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="number" name="market" value={formData.market} onChange={handleChange} placeholder='Enter Amount' />
                            </div>
                        </div>
                        <div className='flex items-center mb-4  justify-center gap-4'>
                            <div className="w-full">
                                <label className="block mb-2 font-medium">Manshiaana:</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="number" name="manshiaana" value={formData.manshiaana} onChange={handleChange} placeholder='Enter Amount' />
                            </div>
                            <div className="w-full">
                                <label className="block mb-2 font-medium">Fund:</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="number" name="fund" value={formData.fund} onChange={handleChange} placeholder='Enter Amount' />
                            </div>
                        </div>
                        <div className='flex items-center mb-4  justify-center gap-4'>
                            <div className="w-full">
                                <label className="block mb-2 font-medium">Katoti :</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="number" name="katoti" value={formData.katoti} onChange={handleChange} placeholder='Enter Amount' />
                            </div>
                            <div className="w-full">
                                <label className="block mb-2 font-medium">Wapsi Kharcha:</label>
                                <input className='w-full border border-gray-400 focus:outline-none p-1' type="number" name="wapsiKharcha" value={formData.wapsiKharcha} onChange={handleChange} placeholder='Enter Amount' />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div className='w-full mt-8 rounded-2xl bg-white p-8 border-t-4 border-green-700'>
                <form action="">
                    <h1 className='mb-4'>Summary</h1>
                    <hr className='mb-4' />
                    <div className='flex items-center mb-4 justify-center gap-4'>
                        <div className="w-full">
                            <label className="block mb-2 font-medium">Amount Received:</label>
                            <input className='w-full border text-green-700 font-bold border-gray-400 focus:outline-none p-2 bg-green-50' type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} placeholder='Enter Amount Received' />
                        </div>
                        <div className="w-full">
                            <label className="block mb-2 font-medium">Total Expense :</label>
                            <input className='w-full border text-red-500 border-gray-400 focus:outline-none p-2 bg-red-50' type="number" value={totalExpense} readOnly />
                        </div>
                    </div>

                    <div className='w-full flex flex-col items-center justify-between'>
                        <label className="block mb-2 text-blue-600 font-medium">Gross Amount (Amount - Expenses):</label>
                        <button type="button" className='w-full md:w-[70%] text-[24px] font-bold border border-gray-400 text-blue-600 bg-blue-50 focus:outline-none p-2'>{grossAmount}</button>
                    </div>
                    <div className='flex items-center gap-6 mt-5 justify-center'>
                        <button type="button" onClick={() => handleSave(true)} className='px-10 rounded-lg text-white py-2 bg-green-400'>Save/Print</button>
                        <button type="button" onClick={() => handleSave(false)} className='px-10 rounded-lg text-white py-2 bg-amber-400'>Save</button>
                        <button type="button" onClick={clearForm} className='px-10 rounded-lg text-white py-2 bg-red-400'>Cancel</button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    )
}

export default NewSupplierInvoice
