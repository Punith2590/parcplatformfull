// frontend/components/admin/InvoiceModal.jsx

import React from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import { PygenicArcLogo } from '../icons/Icons';

const InvoiceModal = ({ isOpen, onClose, bill }) => {
    const { trainers } = useData();
    // --- THIS IS THE FIX ---
    // The bill object has 'trainer' (the ID), not 'trainerId'
    const trainer = trainers.find(t => t.id === bill.trainer);

    const totalAmount = bill.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    const handlePrint = () => {
        const printableContent = document.getElementById('invoice-printable-area');
        if (printableContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow?.document.write('<html><head><title>Print Invoice</title>');
            printWindow?.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow?.document.write('<style>body { -webkit-print-color-adjust: exact; } .dark { display: none; } </style>');
            printWindow?.document.write('</head><body>');
            printWindow?.document.write(printableContent.innerHTML);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            printWindow?.focus();
            setTimeout(() => {
                printWindow?.print();
                printWindow?.close();
            }, 250);
        }
    };

    if (!trainer) {
        // This can happen briefly while data is loading.
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Invoice ${bill.invoice_number}`} size="lg">
            <div>
                <div id="invoice-printable-area" className="bg-white text-slate-900 p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <PygenicArcLogo className="h-10 w-auto text-violet-500" />
                            <p className="text-sm text-slate-500 mt-2">Parc Platform Inc.</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold uppercase text-slate-400">Invoice</h2>
                            <p className="text-sm mt-1">{bill.invoice_number}</p>
                            <p className="text-sm text-slate-500">Date: {new Date(bill.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="mt-10">
                        <p className="text-sm uppercase font-semibold text-slate-500">Bill To</p>
                        <p className="font-bold">{trainer.full_name}</p>
                        <p className="text-sm">{trainer.email}</p>
                    </div>

                    <div className="mt-8 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Expense Type</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 w-2/4">Description</th>
                                            <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-slate-900 sm:pr-0">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {bill.expenses.map((expense, index) => (
                                            <tr key={index}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-500 sm:pl-0">{expense.type}</td>
                                                <td className="px-3 py-4 text-sm text-slate-500">{expense.description}</td>
                                                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm text-slate-500 sm:pr-0">₹{parseFloat(expense.amount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th scope="row" colSpan={2} className="hidden pt-5 pl-4 pr-3 text-right text-sm font-semibold text-slate-900 sm:table-cell sm:pl-0">Total</th>
                                            <th scope="row" className="pt-5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:hidden">Total</th>
                                            <td className="pt-5 pl-3 pr-4 text-right text-sm font-semibold text-slate-900 sm:pr-0">₹{totalAmount.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-12 border-t border-slate-200 pt-6">
                        <h3 className="font-semibold">Thank you for your services!</h3>
                        <p className="text-sm text-slate-500">Payment is due within 30 days. Please contact us for any questions.</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Close</button>
                    <button type="button" onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">Print</button>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceModal;