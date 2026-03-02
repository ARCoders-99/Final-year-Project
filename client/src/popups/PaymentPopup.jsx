import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { X, Loader2, Lock } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

import { motion } from "framer-motion";
import { popupVariants, backdropVariants } from "../utils/animations";

const CheckoutForm = ({ clientSecret, bookId, onClose, onSuccess, recordPaidBorrowThunk }) => {
    const stripe = useStripe();
    const elements = useElements();
    const dispatch = useDispatch();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
            },
        });

        if (error) {
            toast.error(error.message);
            setIsProcessing(false);
        } else if (paymentIntent.status === "succeeded") {
            try {
                // Use the passed thunk to support different book types
                await dispatch(recordPaidBorrowThunk(bookId, paymentIntent.id));
                toast.success("Payment successful!");
                onSuccess();
                onClose();
            } catch (err) {
                toast.error("Payment verified but failed to record borrow.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Card Details
                </label>
                <div className="bg-white p-3 rounded-lg border border-gray-300">
                    <CardElement
                        options={{
                            style: {
                                base: {
                                    fontSize: "16px",
                                    fontFamily: "Montserrat, sans-serif",
                                    color: "#424770",
                                    "::placeholder": { color: "#aab7c4" },
                                },
                                invalid: { color: "#9e2146" },
                            },
                        }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 justify-center font-medium">
                <Lock size={12} />
                Secured by Stripe
            </div>

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:bg-gray-400 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="animate-spin" size={20} /> Processing...
                    </>
                ) : (
                    "Confirm Payment"
                )}
            </button>
        </form>
    );
};

const PaymentPopup = ({ isOpen, onClose, clientSecret, bookId, bookTitle, price, onSuccess, recordPaidBorrowThunk }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={backdropVariants}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={popupVariants}
                className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden no-scrollbar"
            >
                <div className="bg-black p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-2xl font-bold mb-2">Secure Payment</h2>
                    <p className="text-gray-400 text-sm font-medium">
                        Please enter your card details to borrow <span className="text-white font-bold">"{bookTitle}"</span>.
                    </p>

                    <div className="mt-6 flex items-baseline gap-1">
                        <span className="text-sm font-bold text-gray-400">Total:</span>
                        <span className="text-3xl font-bold text-white">${price?.toFixed(2)}</span>
                    </div>
                </div>

                <div className="p-8">
                    {clientSecret ? (
                        <Elements stripe={stripePromise}>
                            <CheckoutForm
                                clientSecret={clientSecret}
                                bookId={bookId}
                                onClose={onClose}
                                onSuccess={onSuccess}
                                recordPaidBorrowThunk={recordPaidBorrowThunk}
                            />
                        </Elements>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="animate-spin text-black" size={40} />
                            <p className="text-gray-500 font-medium animate-pulse">Initializing secure checkout...</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentPopup;
