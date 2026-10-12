"use client";

import { useState } from "react";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import InfirmaryHeader from "./InfirmaryHeader";
import MyAppointmentsTab from "./MyAppointmentsTab";
import NotificationsTab from "./NotificationsTab";
import OverviewTab from "./OverviewTab";
import RequestScheduleTab from "./RequestScheduleTab";
import { MOCK_APPOINTMENTS, mockNotifications } from "./data";

function ComingSoonTab({ title }) {
  return (
    <section className="w-full rounded-md border border-[#956887] bg-[#f4d4e7] p-8 text-center text-[#48305d] shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2">Coming soon</p>
    </section>
  );
}

function StudentInfirmaryContent() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [notifications, setNotifications] = useState(mockNotifications);
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);

  function addNotification(notification) {
    const notificationData =
      typeof notification === "string" ? { message: notification } : notification;
    const notificationDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    setNotifications((currentNotifications) => [
      {
        id: notificationData.id ?? `notification-${Date.now()}-${Math.random()}`,
        message: notificationData.message,
        date: notificationData.date ?? notificationDate,
        read: notificationData.read ?? false,
        type: notificationData.type ?? "appointment",
      },
      ...currentNotifications,
    ]);
  }

  function addAppointment(appointment) {
    setAppointments((currentAppointments) => [appointment, ...currentAppointments]);
  }

  function cancelAppointment(appointmentId) {
    const appointment = appointments.find((item) => item.id === appointmentId);
    if (!appointment || !["Pending", "Approved"].includes(appointment.status)) return;

    setAppointments((currentAppointments) =>
      currentAppointments.map((item) =>
        item.id === appointmentId ? { ...item, status: "Cancelled" } : item,
      ),
    );
    addNotification(
      `You cancelled your ${appointment.service} on ${appointment.date} at ${appointment.timeStart}.`,
    );
  }

  function changeAppointmentStatus(appointmentId, status) {
    const appointment = appointments.find((item) => item.id === appointmentId);
    if (!appointment || appointment.status !== "Pending") return;

    const remarks =
      status === "Rejected"
        ? appointment.remarks ||
          "Please contact the clinic for more information."
        : appointment.remarks;
    setAppointments((currentAppointments) =>
      currentAppointments.map((item) =>
        item.id === appointmentId ? { ...item, status, remarks } : item,
      ),
    );

    const message =
      status === "Approved"
        ? `Your ${appointment.service} on ${appointment.date} at ${appointment.timeStart} has been approved.`
        : `Your ${appointment.service} on ${appointment.date} at ${appointment.timeStart} was rejected. Reason: ${remarks}`;
    addNotification(message);
  }

  function markNotificationRead(notificationId) {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );
  }

  function deleteNotification(notificationId) {
    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationId),
    );
  }

  function clearAllNotifications() {
    setNotifications([]);
  }

  const notificationProps = {
    notifications,
    onDelete: deleteNotification,
    onMarkRead: markNotificationRead,
    onClearAll: clearAllNotifications,
  };

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-[#ffe0ef] p-4 font-serif sm:p-5">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3">
        <InfirmaryHeader activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="w-full max-w-5xl mx-auto mt-8 px-4 min-h-[400px]">
          {activeTab === "Overview" ? (
            <OverviewTab
              appointments={appointments}
              notifications={notifications}
              onNavigate={setActiveTab}
            />
          ) : activeTab === "Notifications" ? (
            <NotificationsTab {...notificationProps} />
          ) : activeTab === "My Appointments" ? (
            <MyAppointmentsTab
              appointments={appointments}
              onCancelAppointment={cancelAppointment}
              onChangeAppointmentStatus={changeAppointmentStatus}
              onTabChange={setActiveTab}
              onAddAppointment={addAppointment}
              onAddNotification={addNotification}
            />
          ) : activeTab === "Request Schedule" ? (
            <RequestScheduleTab
              appointments={appointments}
              addAppointment={addAppointment}
              addNotification={addNotification}
              onNavigate={setActiveTab}
            />
          ) : (
            <ComingSoonTab
              title={activeTab}
              appointments={appointments}
              onAddAppointment={addAppointment}
              onAddNotification={addNotification}
              {...notificationProps}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export default function StudentInfirmary() {
  return (
    <UserProfileProvider>
      <StudentInfirmaryContent />
    </UserProfileProvider>
  );
}
