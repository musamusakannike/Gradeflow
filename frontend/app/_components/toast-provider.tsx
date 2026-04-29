"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3200,
        style: {
          background: "#18201c",
          color: "#fffaf0",
          border: "1px solid rgba(255,250,240,.18)",
          borderRadius: "14px",
          boxShadow: "0 18px 45px rgba(24,32,28,.22)",
        },
      }}
    />
  );
}
