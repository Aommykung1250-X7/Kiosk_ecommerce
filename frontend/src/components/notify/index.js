/**
 * ระบบแจ้งเตือนกลางของ DITC Kiosk
 *
 *   import { notify, confirmDialog } from "../components/notify";
 *
 *   notify.success("บันทึกข้อมูลเรียบร้อยแล้ว");
 *   notify.error(err.message);
 *
 *   if (!(await confirmDialog({ title: "ลบสินค้า?", message: "..." }))) return;
 *
 * ต้องมี <NotificationProvider> ครอบแอปไว้หนึ่งครั้งใน App.jsx
 */
export { default as NotificationProvider } from "./NotificationProvider";
export { notify, confirmDialog } from "./notifyStore";
