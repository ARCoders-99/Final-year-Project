import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSettingPopup, toggleMessagingPopup } from "../store/slices/popUpSlice";
import { MessageCircle, Settings, User as UserIcon, Clock } from "lucide-react";

const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.messages);
  const { messagingOpen } = useSelector((state) => state.popup);

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
      setCurrentDate(now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    };
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="absolute top-0 bg-white w-full h-16 px-6 left-0 shadow-sm border-b border-gray-100 flex justify-between items-center z-10 transition-colors">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-black">{initials}</span>
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-black text-gray-900 leading-tight">
            {user?.name || "Welcome"}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {user?.role || "User"}
          </span>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">
        {/* Clock Pill */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
          <Clock size={14} className="text-gray-400" />
          <div className="flex flex-col items-end leading-none">
            <span className="text-xs font-black text-gray-800">{currentTime}</span>
            <span className="text-[10px] font-bold text-gray-400 mt-0.5">{currentDate}</span>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          {/* Chat Icon - opens ChatWidget */}
          <button
            onClick={() => dispatch(toggleMessagingPopup())}
            className={`p-2.5 rounded-xl transition-all relative ${unreadCount > 0 && !messagingOpen ? "text-black bg-gray-100" : "text-gray-500 hover:bg-gray-100 hover:text-black"
              }`}
            title="Messages"
          >
            <MessageCircle size={20} />
            {unreadCount > 0 && !messagingOpen && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => dispatch(toggleSettingPopup())}
            className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-black transition-all"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
