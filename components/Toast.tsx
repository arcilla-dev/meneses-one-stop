"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useEffect } from "react";

type ToastProps = {
  message: string;
  type: "error" | "success";
  onClose: () => void;
};

export default function Toast({
  message,
  type,
  onClose,
}: ToastProps) {

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="fixed right-6 top-6 z-[9999]">
      <div
        className={`flex min-w-[300px] max-w-[450px] items-center gap-3 rounded-xl px-5 py-4 text-white shadow-lg ${
          type === "error" ? "bg-[#BE1E2D]" : "bg-[#6DA22C]"
        }`}
      >
        {type === "error" ? (
          <CircleAlert size={24} />
        ) : (
          <CircleCheck size={24} />
        )}

        <p className="flex-1">
          {message}
        </p>

        <button
          onClick={onClose}
          aria-label="Close notification"
          className="cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
