// frontend/components/admin/InvoiceModal.jsx

import React from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import { PygenicArcLogo } from '../icons/Icons';

const InvoiceModal = ({ isOpen, onClose, bill }) => {
    const { trainers } = useData();
    const trainer = trainers.find(t => t.id === bill.trainer);

    const totalAmount = bill.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=800');
        if (!printWindow) {
            alert('Please allow popups to print the invoice.');
            return;
        }

        const invoiceHTML = `
            <html>
            <head>
                <title>Invoice ${bill.invoice_number}</title>
                <style>
                    body { 
                        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
                        color: #334155; /* slate-700 */
                        margin: 0;
                        padding: 2rem;
                    }
                    .header { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: flex-start; 
                        padding-bottom: 1rem;
                    }
                    .logo-container svg {
                        height: 3.5rem; /* Increased size for better visibility */
                        width: auto;
                    }
                    .logo-container p {
                        font-size: 0.875rem;
                        color: #64748b; /* slate-500 */
                        margin-top: 0.5rem;
                    }
                    .invoice-details { text-align: right; }
                    .invoice-details h2 { 
                        font-size: 2.25rem; 
                        font-weight: bold; 
                        text-transform: uppercase; 
                        color: #94a3b8; /* slate-400 */
                        margin: 0;
                    }
                    .invoice-details p { font-size: 0.875rem; margin: 0.25rem 0 0; }
                    .bill-to { margin-top: 2.5rem; }
                    .bill-to .label {
                        font-size: 0.875rem;
                        text-transform: uppercase;
                        font-weight: 600;
                        color: #64748b; /* slate-500 */
                    }
                    .bill-to .name { font-weight: bold; }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 2rem; 
                        font-size: 0.875rem;
                    }
                    thead { background-color: #f8fafc; /* slate-50 */ }
                    th, td { 
                        padding: 0.75rem 1rem; 
                        text-align: left; 
                        border-bottom: 1px solid #e2e8f0; /* slate-200 */
                    }
                    th { font-weight: 600; color: #0f172a; /* slate-900 */ }
                    td { color: #64748b; /* slate-500 */ }
                    .text-right { text-align: right; }
                    tfoot th, tfoot td { 
                        font-weight: 600; 
                        color: #0f172a; /* slate-900 */
                        border-bottom: none; 
                        padding-top: 1.25rem; 
                    }
                    .footer { 
                        margin-top: 3rem; 
                        border-top: 1px solid #e2e8f0; /* slate-200 */
                        padding-top: 1.5rem; 
                    }
                    .footer h3 { font-weight: 600; margin: 0 0 0.5rem; }
                    .footer p { font-size: 0.875rem; color: #64748b; margin: 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-container">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <path id="circlePath" d="M 40, 100 A 60,60 0 1 1 160,100" />
                              <path id="bottomCirclePath" d="M 50, 100 A 50,50 0 0 1 150,100" />
                            </defs>
                            <circle cx="100" cy="100" r="98" fill="#3b5998" />
                            <circle cx="100" cy="100" r="80" fill="none" stroke="white" stroke-width="2" stroke-dasharray="5 5" />
                            <circle cx="100" cy="100" r="75" fill="none" stroke="white" stroke-width="1" />
                            <text fill="white" font-size="28" font-weight="bold" letter-spacing="2">
                              <textPath href="#circlePath" startOffset="50%" textAnchor="middle">PYGENICARC</textPath>
                            </text>
                            <text fill="white" font-size="14" font-style="italic">
                                <textPath href="#bottomCirclePath" startOffset="50%" textAnchor="middle" dy="15">One step ahead of your Dreams..!</textPath>
                            </text>
                            <path d="M 100 60 C 120 80, 80 100, 100 120" stroke="#facc15" stroke-width="10" fill="none" stroke-linecap="round"/>
                            <path d="M 100 60 C 80 80, 120 100, 100 120" stroke="white" stroke-width="10" fill="none" stroke-linecap="round"/>
                            <line x1="95" y1="75" x2="105" y2="75" stroke="#fca5a5" stroke-width="4" stroke-linecap="round" />
                            <line x1="93" y1="90" x2="107" y2="90" stroke="#fca5a5" stroke-width="4" stroke-linecap="round" />
                            <line x1="95" y1="105" x2="105" y2="105" stroke="#fca5a5" stroke-width="4" stroke-linecap="round" />
                            <g fill="white">
                                <circle cx="82" cy="98" r="3" />
                                <path d="M 80 102 L 82 110 L 78 112" stroke="white" stroke-width="2" fill="none" />
                                <path d="M 84 102 L 82 110 L 86 112" stroke="white" stroke-width="2" fill="none" />
                            </g>
                            <path d="M 115 100 L 120 95 L 125 100 L 130 90 L 135 95" stroke="#facc15" stroke-width="2" fill="none" />
                            <path d="M 115 105 L 120 100 L 125 105 L 130 95 L 135 100" stroke="#fca5a5" stroke-width="2" fill="none" />
                          </svg>
                        <p>Parc Platform Inc.</p>
                    </div>
                    <div class="invoice-details">
                        <h2>Invoice</h2>
                        <p>${bill.invoice_number}</p>
                        <p>Date: ${new Date(bill.date).toLocaleDateString()}</p>
                    </div>
                </div>

                <div class="bill-to">
                    <p class="label">Bill To</p>
                    <p class="name">${trainer.full_name}</p>
                    <p>${trainer.email}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Expense Type</th>
                            <th style="width: 50%;">Description</th>
                            <th class="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bill.expenses.map(expense => `
                            <tr>
                                <td>${expense.type}</td>
                                <td>${expense.description}</td>
                                <td class="text-right">₹${parseFloat(expense.amount).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="2" class="text-right">Total</th>
                            <td class="text-right">₹${totalAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="footer">
                    <h3>Thank you for your services!</h3>
                    <p>Payment is due within 30 days. Please contact us for any questions.</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    if (!trainer) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Invoice ${bill.invoice_number}`} size="lg">
            <div>
                <div id="invoice-printable-area" className="bg-white text-slate-900 p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <PygenicArcLogo className="h-14 w-auto" />
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