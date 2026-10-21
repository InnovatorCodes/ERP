"use client";

import React, { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { X } from 'lucide-react';
import { addCustomerAction } from '@/actions/add-customer'; // Import the server action

interface AddCustomerModalProps {
    /** Called once when the modal should close; `added` is true after a successful save. */
    onClose: (added: boolean) => void;
}

// A separate component for the submit button to use the `useFormStatus` hook.
// This hook provides the pending state of the form submission.
function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
            disabled={pending}
        >
            {pending ? 'Saving...' : 'Save Customer'}
        </button>
    );
}

const customerTypes = ['b2b', 'b2c', 'architecture', 'interior design'];

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ onClose }) => {
    const [state, formAction] = useActionState(addCustomerAction, { message: '' });

    // The parent unmounts this modal on close, so this runs at most once per save.
    useEffect(() => {
        if (state.message === 'success') {
            onClose(true);
        }
    }, [state, onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
                    <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form action={formAction}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <input name="name" type="text" placeholder="Full Name" className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                        <input name="company" type="text" placeholder="Company (Optional)" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                        <input name="email" type="email" placeholder="Email Address" className="w-full px-4 py-3 border border-gray-300 rounded-lg" required />
                        <input name="phone" type="tel" placeholder="Phone Number (Optional)" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />

                        <div className="md:col-span-2">
                            <select name="customerType" className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white" defaultValue="" required>
                                <option value="" disabled>Select Customer Type</option>
                                {customerTypes.map(type => {
                                    let label=type.length==3?type.toUpperCase(): type.charAt(0).toUpperCase() + type.slice(1)
                                    if(type=="interior design") label="Interior Design"
                                    return (<option key={type} value={type} className="capitalize">{label}</option>)
                                })}
                            </select>
                        </div>

                        <textarea name="address" placeholder="Address / Location" className="w-full px-4 py-3 border border-gray-300 rounded-lg md:col-span-2" required />
                    </div>

                    {/* Display an error message if the submission fails */}
                    {state?.message && state.message !== 'success' && (
                        <p className="text-red-500 text-sm mb-4">{state.message}</p>
                    )}

                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => onClose(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCustomerModal;
