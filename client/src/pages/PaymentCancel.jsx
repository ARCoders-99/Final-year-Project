import { Link } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import Header from "../layout/Header";

const PaymentCancel = () => {
    return (
        <main className="relative flex-1 p-6 pt-28 min-h-screen bg-gray-50 flex flex-col items-center">
            <Header />

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center mt-10 animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center gap-6">
                    <div className="bg-red-100 p-4 rounded-full">
                        <XCircle size={64} className="text-red-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">Payment Cancelled</h2>
                    <p className="text-gray-600">
                        The payment process was cancelled. No charges were made, and the book was not borrowed.
                    </p>
                    <div className="flex flex-col w-full gap-3 mt-4">
                        <Link
                            to="/books"
                            className="w-full bg-black text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <ArrowLeft size={18} /> Back to Library
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default PaymentCancel;
