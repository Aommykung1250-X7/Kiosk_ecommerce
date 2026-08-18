import { useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import ToastViewport from "./ToastViewport";
import ConfirmDialog from "./ConfirmDialog";
import {
  subscribe,
  getToasts,
  getDialog,
  getConfig,
  dismissToast,
  closeDialog,
} from "./notifyStore";

/**
 * NotificationProvider
 * ---------------------------------------------------------------------------
 * วางไว้ครั้งเดียวที่ราก (App.jsx) ทำหน้าที่เชื่อม store เข้ากับ React
 * แล้ว render toast กับกล่องยืนยันผ่าน portal ไปที่ document.body
 * เพื่อไม่ให้ถูก overflow:hidden หรือ stacking context ของหน้าใดหน้าหนึ่งบัง
 *
 * ไม่มี context ให้ใช้ เพราะ API เป็นแบบเรียกตรง (notify.success / confirmDialog)
 * ทำให้เรียกได้จากทุกที่ รวมถึงใน .catch() ของ promise
 */
export default function NotificationProvider({ children }) {
  const toasts = useSyncExternalStore(subscribe, getToasts, getToasts);
  const dialog = useSyncExternalStore(subscribe, getDialog, getDialog);
  const config = useSyncExternalStore(subscribe, getConfig, getConfig);

  const handleDismiss = useCallback((id) => dismissToast(id), []);
  const handleResolve = useCallback((result) => closeDialog(result), []);

  // ระหว่าง SSR หรือก่อน DOM พร้อม จะยังไม่มี document ให้ยึด
  const canPortal = typeof document !== "undefined";

  return (
    <>
      {children}

      {canPortal &&
        createPortal(
          <ToastViewport toasts={toasts} config={config} onDismiss={handleDismiss} />,
          document.body
        )}

      {canPortal &&
        dialog &&
        createPortal(
          <ConfirmDialog key={dialog.id} dialog={dialog} onResolve={handleResolve} />,
          document.body
        )}
    </>
  );
}
