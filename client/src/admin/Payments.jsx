import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPayments } from "../store/slices/borrowSlice";
import { DollarSign, CreditCard, Calendar, User, Book as BookIcon, Loader2, BookOpen } from "lucide-react";
import Header from "../layout/Header";

const Payments = () => {
    const dispatch = useDispatch();
    const {
        physicalPayments,
        digitalPayments,
        physicalEarnings,
        digitalEarnings,
        totalEarnings,
        loading
    } = useSelector((state) => state.borrow);

    const [activeTab, setActiveTab] = useState("physical");

    useEffect(() => {
        dispatch(fetchAllPayments());
    }, [dispatch]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderPaymentTable = (payments, type) => {
        if (!payments || payments.length === 0) {
            return (
                <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium italic">No {type} payments recorded yet.</p>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Book</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payments.map((payment) => (
                                <tr key={payment._id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-black group-hover:text-white transition-colors">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{payment.user.name}</p>
                                                <p className="text-xs text-gray-400">{payment.user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700 font-normal">
                                            <BookIcon size={16} className="text-gray-400" />
                                            {payment.book?.title || "Unknown Book"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-semibold text-gray-800">${payment.amountPaid.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full uppercase tracking-widest border border-green-200">
                                            {payment.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar size={14} />
                                            {formatDate(payment.paymentDate || payment.createdAt)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <main className="relative flex-1 p-6 pt-28 bg-gray-50/50 min-h-screen">
            <Header />

            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Payment Hub</h2>
                <p className="text-gray-500 font-normal">Monitor and manage all borrowing revenue streams.</p>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
                    <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-0.5">Total Revenue</p>
                        <h4 className="text-3xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
                    <div className="bg-blue-100 p-4 rounded-2xl text-blue-600">
                        <BookIcon size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-0.5">Physical Intake</p>
                        <h4 className="text-3xl font-bold text-gray-900">${physicalEarnings.toFixed(2)}</h4>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all">
                    <div className="bg-violet-100 p-4 rounded-2xl text-violet-600">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-0.5">Digital Intake</p>
                        <h4 className="text-3xl font-bold text-gray-900">${digitalEarnings.toFixed(2)}</h4>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-gray-200/50 rounded-2xl w-fit mb-8 border border-gray-200">
                <button
                    onClick={() => setActiveTab("physical")}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === "physical"
                        ? "bg-white text-black shadow-sm ring-1 ring-gray-100"
                        : "text-gray-500 hover:text-gray-800"
                        }`}
                >
                    <BookIcon size={16} />
                    Physical Books
                </button>
                <button
                    onClick={() => setActiveTab("digital")}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === "digital"
                        ? "bg-white text-black shadow-sm ring-1 ring-gray-100"
                        : "text-gray-500 hover:text-gray-800"
                        }`}
                >
                    <BookOpen size={16} />
                    Digital Books
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="p-32 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-gray-100">
                        <Loader2 className="animate-spin text-black" size={48} />
                        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">Fetching Records...</p>
                    </div>
                ) : (
                    activeTab === "physical"
                        ? renderPaymentTable(physicalPayments, "physical")
                        : renderPaymentTable(digitalPayments, "digital")
                )}
            </div>
        </main>
    );
};

export default Payments;
