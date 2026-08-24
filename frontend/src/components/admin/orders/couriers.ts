export interface Courier {
  id: string;
  name: string;
  url: string;
}

/** ผู้ให้บริการขนส่งที่ร้านใช้จริง พร้อมลิงก์ไปหน้ากรอกข้อมูลของแต่ละเจ้า */
export const COURIERS: Courier[] = [
  {
    id: "thailandpost",
    name: "ไปรษณีย์ไทย (Prompt Post / EMS)",
    url: "https://promptpost.thailandpost.com/",
  },
  { id: "flash", name: "Flash Express", url: "https://www.flashexpress.co.th/booking/" },
  { id: "kerry", name: "Kerry Express / KEX", url: "https://th.express.kerryexpress.com/" },
  { id: "jnt", name: "J&T Express", url: "https://www.jtexpress.co.th/" },
];

export function findCourier(id: string): Courier {
  return COURIERS.find((courier) => courier.id === id) ?? COURIERS[0];
}
