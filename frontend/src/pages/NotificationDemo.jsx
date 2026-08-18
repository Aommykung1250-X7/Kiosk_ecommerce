import { useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { notify, confirmDialog } from "../components/notify";

/**
 * หน้าสาธิตระบบแจ้งเตือน (/dev/notifications)
 * ใช้ตรวจรับหน้าตาและพฤติกรรมของ toast กับกล่องยืนยันครบทุกชนิด
 */

const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

function Section({ title, description, children }) {
  return (
    <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-surface-dark text-white px-5 py-4">
        <h2 className="text-base font-extrabold tracking-tight">{title}</h2>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function DemoButton({ onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 text-sm font-extrabold rounded-2xl active:scale-[0.98] transition-all cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink/40 ${className}`}
    >
      {children}
    </button>
  );
}

export default function NotificationDemo() {
  const [position, setPosition] = useState("top-right");
  const [lastResult, setLastResult] = useState(null);

  const changePosition = (next) => {
    setPosition(next);
    notify.configure({ position: next });
    notify.info(`ย้ายตำแหน่งการแจ้งเตือนไปที่ ${next}`);
  };

  const runConfirm = async (options, label) => {
    const accepted = await confirmDialog(options);
    setLastResult(`${label} → ${accepted ? "ยืนยัน (true)" : "ยกเลิก (false)"}`);
    if (accepted) {
      notify.success(`ดำเนินการ "${label}" เรียบร้อยแล้ว`);
    } else {
      notify.info(`ยกเลิก "${label}" แล้ว`);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg font-['Prompt'] text-ink">
      {/* แถบหัวหน้าจอ ใช้ทดสอบว่า toast ไม่บังแถบนำทาง */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <h1 className="text-xl font-black tracking-tight text-surface-dark">
          ระบบแจ้งเตือน DITC Kiosk
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-0.5">
          หน้าสาธิต toast และกล่องยืนยัน — แถบนำทางนี้ใช้ทดสอบว่าการแจ้งเตือนไม่บังส่วนหัว
        </p>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-5">
        <Section
          title="1. Toast ทั้ง 4 ชนิด"
          description="ปิดอัตโนมัติใน 4 วินาที มีแถบเวลา หยุดเดินเมื่อเอาเมาส์ไปวาง"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <DemoButton
              onClick={() => notify.success("บันทึกข้อมูลสินค้าเรียบร้อยแล้ว")}
              className="bg-success text-white hover:brightness-110"
            >
              <CheckCircleIcon className="w-5 h-5 inline mr-1.5 -mt-0.5" />
              สำเร็จ
            </DemoButton>
            <DemoButton
              onClick={() => notify.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่")}
              className="bg-danger text-white hover:brightness-110"
            >
              <XCircleIcon className="w-5 h-5 inline mr-1.5 -mt-0.5" />
              ผิดพลาด
            </DemoButton>
            <DemoButton
              onClick={() => notify.warning("สินค้านี้จำกัดการซื้อไม่เกิน 5 ชิ้นต่อรายการ")}
              className="bg-warning text-white hover:brightness-110"
            >
              <ExclamationTriangleIcon className="w-5 h-5 inline mr-1.5 -mt-0.5" />
              คำเตือน
            </DemoButton>
            <DemoButton
              onClick={() => notify.info("มีออเดอร์ใหม่เข้ามาในคิว")}
              className="bg-info text-white hover:brightness-110"
            >
              <InformationCircleIcon className="w-5 h-5 inline mr-1.5 -mt-0.5" />
              ข้อมูล
            </DemoButton>
          </div>
        </Section>

        <Section
          title="2. ตัวเลือกเพิ่มเติมของ toast"
          description="กำหนดหัวข้อเอง ปรับเวลา ค้างไว้ถาวร และซ้อนหลายอัน"
        >
          <div className="flex flex-wrap gap-3">
            <DemoButton
              onClick={() =>
                notify.success("ส่งอีเมลแจ้งเลขพัสดุให้ลูกค้าแล้ว", {
                  title: "ยืนยันการจัดส่งสำเร็จ",
                })
              }
              className="bg-surface-dark text-white hover:bg-black"
            >
              กำหนดหัวข้อเอง
            </DemoButton>
            <DemoButton
              onClick={() => notify.info("ข้อความนี้จะอยู่ 10 วินาที", { duration: 10000 })}
              className="bg-surface-dark text-white hover:bg-black"
            >
              อยู่นาน 10 วินาที
            </DemoButton>
            <DemoButton
              onClick={() =>
                notify.warning("ข้อความนี้ต้องกดปิดเอง", { duration: 0 })
              }
              className="bg-surface-dark text-white hover:bg-black"
            >
              ค้างไว้จนกดปิด
            </DemoButton>
            <DemoButton
              onClick={() => {
                notify.success("รายการที่ 1");
                notify.info("รายการที่ 2");
                notify.warning("รายการที่ 3");
                notify.error("รายการที่ 4");
                notify.info("รายการที่ 5 จะดันตัวแรกออก");
              }}
              className="bg-brand text-surface-dark hover:bg-brand-hover"
            >
              ซ้อนกัน 5 อัน
            </DemoButton>
            <DemoButton
              onClick={() => notify.dismissAll()}
              className="bg-white border border-gray-300 text-ink hover:bg-gray-100"
            >
              ปิดทั้งหมด
            </DemoButton>
          </div>
        </Section>

        <Section
          title="3. ตำแหน่งการแสดงผล"
          description="เลือกมุมที่ต้องการ ระบบจะจำค่าไว้ใช้กับ toast ถัดไปทั้งหมด"
        >
          <div className="grid grid-cols-3 gap-3">
            {POSITIONS.map((pos) => (
              <DemoButton
                key={pos}
                onClick={() => changePosition(pos)}
                className={
                  position === pos
                    ? "bg-brand text-surface-dark hover:bg-brand-hover"
                    : "bg-white border border-gray-300 text-ink hover:bg-gray-100"
                }
              >
                {pos}
              </DemoButton>
            ))}
          </div>
        </Section>

        <Section
          title="4. กล่องยืนยัน (แทน confirm)"
          description="คืนค่าเป็น Promise<boolean> — ปิดด้วย ESC ได้ และวนโฟกัสอยู่ในกล่อง"
        >
          <div className="flex flex-wrap gap-3">
            <DemoButton
              onClick={() =>
                runConfirm(
                  {
                    title: "ลบสินค้าชิ้นนี้?",
                    message:
                      "คุณต้องการลบสินค้าชิ้นนี้จริงหรือไม่? ข้อมูลและรูปภาพทั้งหมดจะถูกลบออกจากระบบ",
                    confirmText: "ลบสินค้า",
                    cancelText: "ยกเลิก",
                    variant: "danger",
                  },
                  "ลบสินค้า"
                )
              }
              className="bg-danger text-white hover:brightness-110"
            >
              danger (คลิกฉากหลังปิดไม่ได้)
            </DemoButton>
            <DemoButton
              onClick={() =>
                runConfirm(
                  {
                    title: "รีเซ็ตยอดการเข้าชม?",
                    message: "ยอดการเข้าชมสินค้าทุกรายการจะถูกตั้งค่ากลับเป็น 0",
                    confirmText: "รีเซ็ตเลย",
                    variant: "warning",
                  },
                  "รีเซ็ตยอดเข้าชม"
                )
              }
              className="bg-warning text-white hover:brightness-110"
            >
              warning
            </DemoButton>
            <DemoButton
              onClick={() =>
                runConfirm(
                  {
                    title: "ยืนยันการจ่ายสินค้า?",
                    message: "ยืนยันการจัดจ่ายสินค้าพร้อมส่งหน้าร้าน สำหรับออเดอร์ ORD-1042 หรือไม่?",
                    confirmText: "ยืนยันการจ่าย",
                    variant: "primary",
                  },
                  "จ่ายสินค้า"
                )
              }
              className="bg-brand text-surface-dark hover:bg-brand-hover"
            >
              primary
            </DemoButton>
            <DemoButton
              onClick={() =>
                runConfirm(
                  {
                    title: "ออกจากหน้านี้?",
                    message: "ข้อมูลที่ยังไม่ได้บันทึกจะหายไป",
                    confirmText: "ออกจากหน้า",
                    variant: "info",
                  },
                  "ออกจากหน้า"
                )
              }
              className="bg-info text-white hover:brightness-110"
            >
              info
            </DemoButton>
          </div>

          {lastResult && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">
                ผลลัพธ์ล่าสุด
              </span>
              <code className="text-sm font-bold text-surface-dark">{lastResult}</code>
            </div>
          )}
        </Section>

        <Section
          title="5. ตัวอย่างการใช้งานจริง"
          description="จำลองการเรียก API ที่ต้องยืนยันก่อน แล้วแจ้งผลด้วย toast"
        >
          <DemoButton
            onClick={async () => {
              const ok = await confirmDialog({
                title: "ลบหมวดหมู่ “เครื่องดื่ม”?",
                message: "หมวดหมู่นี้จะถูกลบออกจากระบบ สินค้าที่อยู่ในหมวดนี้จะไม่ถูกลบ",
                confirmText: "ลบหมวดหมู่",
                variant: "danger",
              });
              if (!ok) return;

              const pendingId = notify.info("กำลังลบหมวดหมู่...", { duration: 0 });
              // จำลองการรอผลจากเซิร์ฟเวอร์
              await new Promise((resolve) => setTimeout(resolve, 1200));
              notify.dismiss(pendingId);
              notify.success('ลบหมวดหมู่ "เครื่องดื่ม" เรียบร้อยแล้ว');
            }}
            className="bg-surface-dark text-white hover:bg-black w-full sm:w-auto"
          >
            ยืนยัน → เรียก API → แจ้งผล
          </DemoButton>
        </Section>

        <p className="text-xs text-gray-400 text-center pt-2 pb-8">
          DITC CAMT Kiosk e-Commerce — หน้าสาธิตระบบแจ้งเตือน
        </p>
      </main>
    </div>
  );
}
