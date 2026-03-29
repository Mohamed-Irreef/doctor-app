import {
    Bell,
    Calendar,
    CheckCircle2,
    CreditCard,
    Send,
    Star,
    Trash2,
    User,
} from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Input from "../components/Input";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import {
    createAdminNotification,
    getAdminNotifications,
} from "../services/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [target, setTarget] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const response = await getAdminNotifications();
      if (response.data) setNotifications(response.data);
    };
    load();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "doctor":
        return <User size={20} className="text-blue-600" />;
      case "payment":
        return <CreditCard size={20} className="text-red-500" />;
      case "appointment":
        return <Calendar size={20} className="text-amber-500" />;
      case "review":
        return <Star size={20} className="text-purple-500" />;
      default:
        return <Bell size={20} className="text-slate-500" />;
    }
  };

  const getBg = (type) => {
    switch (type) {
      case "doctor":
        return "bg-blue-100";
      case "payment":
        return "bg-red-100";
      case "appointment":
        return "bg-amber-100";
      case "review":
        return "bg-purple-100";
      default:
        return "bg-slate-100";
    }
  };

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const response = await createAdminNotification({
      title,
      message,
      type: "appointment",
      audienceType: target,
    });
    if (response.data) {
      setNotifications((prev) => [response.data, ...prev]);
    }
    setTitle("");
    setMessage("");
    setTarget("all");
    setIsComposeOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Notifications Center"
        description="System alerts and push notification management."
        action={
          <Button onClick={() => setIsComposeOpen(true)} className="gap-2">
            <Send size={18} /> Compose Push Alert
          </Button>
        }
      />

      <div className="bg-white border border-slate-200 rounded-[16px] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 tracking-tight uppercase text-xs">
            Recent System Alerts
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            className="text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </Button>
        </div>
        <div className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n._id || n.id}
              className={`p-6 flex gap-4 transition-colors hover:bg-slate-50 ${!n.read ? "bg-blue-50/30" : ""}`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getBg(n.type)}`}
              >
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4
                    className={`text-base font-semibold ${!n.read ? "text-slate-900" : "text-slate-700"}`}
                  >
                    {n.title}
                  </h4>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {n.time}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-2">{n.message}</p>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="default"
                    className="text-[10px] uppercase tracking-wider"
                  >
                    {n.type}
                  </Badge>
                  {!n.read && (
                    <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />{" "}
                      Unread
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {!n.read && (
                  <button
                    onClick={() =>
                      setNotifications(
                        notifications.map((x) =>
                          (x._id || x.id) === (n._id || n.id)
                            ? { ...x, read: true }
                            : x,
                        ),
                      )
                    }
                    className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Mark Read"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                )}
                <button
                  onClick={() =>
                    setNotifications(
                      notifications.filter(
                        (x) => (x._id || x.id) !== (n._id || n.id),
                      ),
                    )
                  }
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="New Push Notification"
        className="max-w-lg"
      >
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Target Audience
            </label>
            <select
              className="w-full border border-slate-200 bg-white rounded-[10px] px-3 py-2.5 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all outline-none"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            >
              <option value="all">All Users (Patients & Doctors)</option>
              <option value="patient">Patients Only</option>
              <option value="doctor">Doctors Only</option>
            </select>
          </div>
          <Input
            label="Push Title"
            required
            placeholder="e.g. 50% Off Lab Tests!"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Message Body
            </label>
            <textarea
              required
              rows={4}
              className="w-full border border-slate-200 bg-white rounded-[10px] px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all outline-none resize-none"
              placeholder="Enter the notification content here..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>
          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setIsComposeOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Send size={18} /> Send Push Alert
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
