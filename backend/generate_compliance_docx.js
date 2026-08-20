// backend/generate_compliance_docx.js
import fs from "fs";
import path from "path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  PageBreak
} from "docx";

const PRIMARY_COLOR = "E65100"; // Deep DITC Orange
const ACCENT_COLOR = "FB8C00";  // Amber Orange
const DARK_TEXT = "263238";     // Dark slate gray
const MUTED_TEXT = "607D8B";    // Muted blue-gray
const FONT_FAMILY = "TH Sarabun New";

function createCoverSection() {
  return [
    new Paragraph({ spacing: { before: 800 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "เอกสารรายงานการดำเนินงานตอบรับข้อกำหนดขอบเขตงาน",
          font: FONT_FAMILY,
          size: 40,
          bold: true,
          color: PRIMARY_COLOR,
        }),
      ],
      spacing: { after: 150 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "SCOPE OF WORK COMPLIANCE & DELIVERY REPORT",
          font: FONT_FAMILY,
          size: 26,
          bold: true,
          color: MUTED_TEXT,
          characterSpacing: 40,
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "โครงการ: ระบบจัดจำหน่ายสินค้าผ่านตู้คีออสอัจฉริยะ (DITC Shop Kiosk e-Commerce System)",
          font: FONT_FAMILY,
          size: 32,
          bold: true,
          color: DARK_TEXT,
        }),
      ],
      spacing: { after: 600 },
    }),

    // Card Box
    new Table({
      width: { size: 90, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "FFF3E0", type: ShadingType.CLEAR },
              margins: { top: 250, bottom: 250, left: 350, right: 350 },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY_COLOR },
                bottom: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY_COLOR },
                left: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY_COLOR },
                right: { style: BorderStyle.SINGLE, size: 12, color: PRIMARY_COLOR },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "สรุปสถานะการส่งมอบงานตามขอบเขตงาน (TOR): ครบถ้วนสมบูรณ์ 100%",
                      font: FONT_FAMILY,
                      size: 28,
                      bold: true,
                      color: PRIMARY_COLOR,
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "ครอบคลุม 6 หมวดงานหลัก: การวิเคราะห์และออกแบบ • การพัฒนาระบบซื้อขาย • ระบบเชื่อมโยงดิจิทัล • ระบบบริหารจัดการข้อมูล • ระบบรายงานและสถิติ • การติดตั้งและทดสอบระบบ",
                      font: FONT_FAMILY,
                      size: 24,
                      color: DARK_TEXT,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ spacing: { before: 1800 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "หน่วยงานผู้จัดทำและพัฒนา", font: FONT_FAMILY, size: 24, color: MUTED_TEXT }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "ศูนย์นวัตกรรมและการจัดการเทคโนโลยีดิจิทัล (DITC)",
          font: FONT_FAMILY,
          size: 30,
          bold: true,
          color: DARK_TEXT,
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CAMT CMU)",
          font: FONT_FAMILY,
          size: 26,
          color: PRIMARY_COLOR,
          bold: true,
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "วันที่ส่งมอบเอกสาร: สิงหาคม 2569",
          font: FONT_FAMILY,
          size: 22,
          italic: true,
          color: MUTED_TEXT,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function createHeading1(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
      new TextRun({ text: title, font: FONT_FAMILY, size: 34, bold: true, color: PRIMARY_COLOR }),
    ],
    spacing: { before: 300, after: 150 },
  });
}

function createHeading2(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({ text: title, font: FONT_FAMILY, size: 28, bold: true, color: ACCENT_COLOR }),
    ],
    spacing: { before: 200, after: 100 },
  });
}

function createCallout(title, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "FFF8E1", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 20, color: PRIMARY_COLOR },
              top: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: title, font: FONT_FAMILY, size: 26, bold: true, color: PRIMARY_COLOR }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: text, font: FONT_FAMILY, size: 24, color: DARK_TEXT }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createItemBlock(itemCode, itemTitle, workDesc, deliverableDesc) {
  return [
    createHeading2(`${itemCode} ${itemTitle}`),
    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({ text: "การดำเนินงาน: ", font: FONT_FAMILY, size: 26, bold: true, color: DARK_TEXT }),
        new TextRun({ text: workDesc, font: FONT_FAMILY, size: 26, color: DARK_TEXT }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({ text: "ผลลัพธ์ที่ส่งมอบ: ", font: FONT_FAMILY, size: 26, bold: true, color: PRIMARY_COLOR }),
        new TextRun({ text: deliverableDesc, font: FONT_FAMILY, size: 26, color: DARK_TEXT }),
      ],
      spacing: { after: 180 },
    }),
  ];
}

function createSummaryTable() {
  const headers = ["ขอบเขตงานตามข้อกำหนด (Scope of Work)", "ผลการดำเนินงานและการพัฒนา (Delivery Summary)", "สถานะ"];
  const rowsData = [
    [
      "1. การวิเคราะห์และออกแบบระบบ",
      "ศึกษา Flow งานจริง ออกแบบสถาปัตยกรรม DB 12 ตาราง และ UI สำหรับ Touchscreen Kiosk",
      "ครบถ้วน 100%"
    ],
    [
      "2. การพัฒนาระบบซื้อขายสินค้าและบริการ",
      "แคตตาล็อกสินค้า ค้นหา กรองหมวดหมู่ ภาพ Carousel สั่งซื้อ และชำระเงิน Dynamic QR Code",
      "ครบถ้วน 100%"
    ],
    [
      "3. ระบบเชื่อมโยงช่องทางดิจิทัล",
      "สร้าง Dynamic PromptPay QR Code, QR ช่องทางติดต่อ และ Magic Link สู่ Mobile Web",
      "ครบถ้วน 100%"
    ],
    [
      "4. ระบบบริหารจัดการข้อมูล",
      "ระบบหลังบ้านสำหรับ Admin/Staff แยกสิทธิ์ RBAC จัดการสินค้า สต็อก ค่าส่ง และโฆษณา",
      "ครบถ้วน 100%"
    ],
    [
      "5. ระบบรายงานและสถิติการใช้งาน",
      "Dashboard แสดงยอดขาย สถิติการปลุกตู้ Kiosk และส่งออกรายงาน Excel/CSV/PDF",
      "ครบถ้วน 100%"
    ],
    [
      "6. การติดตั้งและทดสอบระบบ",
      "ทดสอบผ่าน 45 Test Cases มีคู่มือ Deployment และพร้อมรัน Chrome Kiosk Mode",
      "ครบถ้วน 100%"
    ],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h, i) => new TableCell({
          width: { size: i === 0 ? 35 : i === 1 ? 50 : 15, type: WidthType.PERCENTAGE },
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 150, right: 150 },
          children: [
            new Paragraph({
              alignment: i === 2 ? AlignmentType.CENTER : AlignmentType.LEFT,
              children: [new TextRun({ text: h, font: FONT_FAMILY, size: 26, bold: true, color: "FFFFFF" })],
            }),
          ],
        })),
      }),
      ...rowsData.map((row, idx) => new TableRow({
        children: row.map((cell, i) => new TableCell({
          shading: { fill: idx % 2 === 0 ? "FFFFFF" : "FFF8E1", type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          borders: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "E0E0E0" },
            top: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          children: [
            new Paragraph({
              alignment: i === 2 ? AlignmentType.CENTER : AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: cell,
                  font: FONT_FAMILY,
                  size: 24,
                  bold: i === 0 || i === 2,
                  color: i === 2 ? PRIMARY_COLOR : DARK_TEXT,
                }),
              ],
            }),
          ],
        })),
      })),
    ],
  });
}

function buildDocumentContent() {
  const content = [];

  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "ตารางสรุปภาพรวมการตอบรับขอบเขตงาน (Executive Compliance Summary)",
        font: FONT_FAMILY,
        size: 32,
        bold: true,
        color: PRIMARY_COLOR,
      }),
    ],
    spacing: { before: 200, after: 150 },
  }));
  content.push(createSummaryTable());
  content.push(new Paragraph({ spacing: { before: 200 } }));

  // Section 1
  content.push(createHeading1("1. การวิเคราะห์และออกแบบระบบ (System Analysis & Design)"));
  content.push(...createItemBlock(
    "1.1",
    "ศึกษา วิเคราะห์ และรวบรวมความต้องการของหน่วยงาน",
    "ดำเนินการศึกษา วิเคราะห์ Workflow การสั่งซื้อสินค้าที่ระลึก สินค้าพร้อมส่ง (In Stock) และสินค้าสั่งจองล่วงหน้า (Pre-Order) ของหน่วยงาน และจัดทำเป็นเอกสารข้อกำหนดความต้องการ (Requirements Specification)",
    "ได้โครงสร้างความต้องการระบบฉบับสมบูรณ์ พร้อมแนวทางการชำระเงินผ่าน Payment Gateway (PromptPay Dynamic QR Code) ที่ตรวจจับการโอนเงินอัตโนมัติผ่าน Webhook โดยลูกค้าไม่ต้องอัปโหลดสลิป, ระบบ E-Receipt ทางอีเมล และระบบแยกจัดส่ง (Split Shipping)"
  ));
  content.push(...createItemBlock(
    "1.2",
    "ออกแบบโครงสร้างระบบ กระบวนการทำงาน และฐานข้อมูลให้เหมาะสมกับการใช้งาน",
    "ออกแบบสถาปัตยกรรมแบบ RESTful Client-Server Architecture ใช้ Node.js / Express ร่วมกับฐานข้อมูลเชิงสัมพันธ์ PostgreSQL 16 ที่มีความเสถียรและรองรับ Transaction สูง",
    "โครงสร้างฐานข้อมูล 12 ตารางหลัก พร้อมการทำดัชนี (Indexes) อย่างสมบูรณ์ ได้แก่ users, categories, products, product_images, customer_profiles, customer_addresses, orders, order_items, order_shipments, screensavers, kiosk_stats และ system_settings"
  ));
  content.push(...createItemBlock(
    "1.3",
    "ออกแบบส่วนติดต่อผู้ใช้งาน (UI) ให้มีความสวยงาม ใช้งานง่าย และเหมาะสมกับจอ Kiosk",
    "ออกแบบ UI ตามหลัก Touchscreen-First Interaction ด้วย React 19 และ TailwindCSS 4 โดยมีปุ่มขนาดใหญ่ แตะสัมผัสง่าย (Touch Target Size > 48px), จัดวางองค์ประกอบอย่างลงตัว คุมโทนสีเอกลักษณ์ของ DITC CAMT CMU",
    "หน้าจอ Kiosk Storefront ที่สวยงาม ทันสมัย รองรับระบบพักหน้าจอ (Screensaver) สลับภาพและวิดีโอแบบไร้เสียง (Muted) พร้อมนาฬิกาภาษาไทยแบบเรียลไทม์ และระบบแตะปลุกตู้ (Wake Up) ทันที"
  ));
  content.push(...createItemBlock(
    "1.4",
    "จัดทำแบบร่างหน้าจอการใช้งานและนำเสนอให้หน่วยงานพิจารณาก่อนดำเนินการ",
    "จัดทำ Wireframe, UI Mockup หน้าแรก, หน้า Cart Drawer, หน้าจอชำระเงิน QR Code, หน้าระบบกรอกที่อยู่บนมือถือ (Mobile Delivery) และหน้าแอดมินหลังบ้าน",
    "ชุดแบบร่างหน้าจอและแผนภาพกระบวนการทำงาน (Process Flow Diagram) ที่ผ่านการตรวจสอบและเห็นชอบจากหน่วยงานก่อนเริ่มการเขียนโปรแกรม"
  ));

  // Section 2
  content.push(createHeading1("2. การพัฒนาระบบซื้อขายสินค้าและบริการ (E-Commerce Storefront)"));
  content.push(...createItemBlock(
    "2.1",
    "พัฒนาระบบแสดงข้อมูลสินค้า บริการ ผลงาน หรือข้อมูลอื่นตามที่หน่วยงานกำหนด",
    "พัฒนาระบบแคตตาล็อกสินค้าหน้าร้านที่สามารถแสดงสินค้าที่ระลึก เสื้อผ้า ของใช้ และผลงานต่าง ๆ ของหน่วยงานได้อย่างเป็นหมวดหมู่และสวยงาม",
    "หน้าจอแสดงรายการสินค้า (Product Catalog) ที่ดึงข้อมูลจากฐานข้อมูลแบบเรียลไทม์ แสดงรูปภาพ ราคา สต็อกคงเหลือ และป้ายสถานะอย่างชัดเจน"
  ));
  content.push(...createItemBlock(
    "2.2",
    "ระบบต้องสามารถแสดงรายละเอียดข้อมูล ประกอบด้วย ชื่อ รายละเอียด รูปภาพ ราคา ข้อมูลการติดต่อ",
    "พัฒนาหน้าต่างรายละเอียดสินค้า (Product Detail Modal) ที่แสดงชื่อ รายละเอียด คำอธิบาย จุดรับสินค้าหน้าร้าน รูปภาพสินค้าแบบ Carousel สไลด์ได้สูงสุด 5 ภาพ ป้ายโปรโมชั่น ป้ายสัญลักษณ์ Pre-Order และวันที่คาดว่าจะส่งมอบ",
    "หน้าต่าง Product Detail แบบป๊อปอัปที่แสดงข้อมูลสินค้าอย่างครบถ้วน พร้อมระบบตรวจสอบและแจ้งเตือนจำกัดสิทธิ์การสั่งซื้อต่อคน (Purchase Limit)"
  ));
  content.push(...createItemBlock(
    "2.3",
    "ระบบต้องรองรับการจัดหมวดหมู่สินค้าและบริการ เพื่ออำนวยความสะดวกในการค้นหา",
    "พัฒนาระบบแถบเลือกหมวดหมู่ (Category Sidebar) ด้านข้างของหน้าจอ ให้ผู้ใช้งานแตะสลับดูสินค้าแต่ละกลุ่มได้ทันที เช่น เสื้อผ้า, ของที่ระลึก, อุปกรณ์",
    "ระบบคัดกรองสินค้าตามหมวดหมู่แบบ Interactive ตอบสนองทันทีโดยไม่ต้องโหลดหน้าเว็บใหม่"
  ));
  content.push(...createItemBlock(
    "2.4",
    "ระบบต้องสามารถค้นหาข้อมูลจากชื่อสินค้า หมวดหมู่ หรือคำค้นที่กำหนดได้",
    "พัฒนาช่อง Search Bar ค้นหาแบบ Real-time ตามชื่อสินค้า พร้อมปุ่มคำค้นหายอดนิยม (Popular Search Tags) ที่แอดมินสามารถกำหนดได้จากหลังบ้าน",
    "ระบบค้นหาสินค้าอัจฉริยะที่ช่วยให้ผู้ใช้งานหน้าตู้ Kiosk ค้นหาสินค้าที่ต้องการได้อย่างสะดวกรวดเร็วโดยไม่ต้องพิมพ์ข้อความยาว"
  ));
  content.push(...createItemBlock(
    "2.5",
    "ระบบต้องรองรับการแสดงผลบนจอ Kiosk ได้อย่างถูกต้องและสมบูรณ์",
    "ทดสอบและปรับแต่งการแสดงผลบนหน้าจอสัมผัสขนาด Full HD (1920x1080) ทั้งแนวตั้งและแนวนอน รองรับการล็อกหน้าจอเบราว์เซอร์ในโหมด Kiosk",
    "หน้าจอ Kiosk Application ที่ทำงานแบบไร้รอยต่อ ป้องกันการซูมผิดสัดส่วน (Disable Pinch) และป้องกันการกดคลิกขวาหรือเปิดเมนูภายนอก"
  ));

  // Section 3
  content.push(createHeading1("3. ระบบเชื่อมโยงช่องทางดิจิทัล (Digital Integration)"));
  content.push(...createItemBlock(
    "3.1",
    "ระบบต้องสามารถเชื่อมโยงไปยังเว็บไซต์หรือแพลตฟอร์มภายนอกตามที่หน่วยงานกำหนด",
    "พัฒนาระบบ Mobile Delivery Web Portal ที่ลูกค้าสามารถเปิดใช้งานผ่านเว็บเบราว์เซอร์บนโทรศัพท์มือถือ เพื่อกรอกที่อยู่จัดส่งพัสดุและติดตามสถานะสินค้าได้โดยตรง",
    "หน้าเว็บ Mobile Delivery ที่เชื่อมโยงกับคำสั่งซื้อในระบบผ่าน URL Token ที่ส่งไปในอีเมลใบเสร็จอย่างปลอดภัย"
  ));
  content.push(...createItemBlock(
    "3.2",
    "ระบบต้องสามารถสร้างและแสดง QR Code สำหรับเชื่อมโยงไปยังข้อมูลหรือสั่งซื้อได้",
    "พัฒนาระบบสร้าง Dynamic PromptPay QR Code ที่ฝังยอดเงินและ Order ID ตามบิลสั่งซื้อจริง เพื่อให้ลูกค้าสแกนจ่ายเงินผ่าน Mobile Banking ได้ทันที",
    "ระบบสร้าง QR Code อัตโนมัติร่วมกับ Omise Payment Gateway และระบบแสดง QR Code สำหรับติดต่อสอบถามร้านค้าบนหน้าจอ Support Modal"
  ));
  content.push(...createItemBlock(
    "3.3",
    "ระบบต้องสามารถเชื่อมโยงไปยังช่องทางการติดต่อหรือสื่อสังคมออนไลน์ของหน่วยงานได้",
    "พัฒนาหน้าต่าง 'ติดต่อสอบถาม / ฝ่ายสนับสนุน' (Support Modal) บนหน้าตู้ Kiosk",
    "แสดงข้อมูลเบอร์โทรศัพท์ อีเมล แผนที่ตั้ง และลิงก์/QR Code ไปยัง Official Line และ Social Media ของ CAMT / DITC อย่างครบถ้วน"
  ));

  // Section 4
  content.push(createHeading1("4. ระบบบริหารจัดการข้อมูล (Admin & Staff Backoffice)"));
  content.push(...createItemBlock(
    "4.1",
    "พัฒนาระบบสำหรับผู้ดูแลระบบ (Administrator) เพื่อใช้ในการบริหารจัดการข้อมูล",
    "พัฒนาระบบเว็บแอปพลิเคชันหลังบ้าน (Backoffice) ผ่าน URL `/login` สำหรับเจ้าหน้าที่และผู้ดูแลระบบ",
    "ระบบหลังบ้านที่ครอบคลุมการจัดการคิวคำสั่งซื้อ (Order Queue), การจัดการสินค้า, การจัดการสื่อโฆษณา, การตั้งค่าระบบ และการออกรายงาน"
  ));
  content.push(...createItemBlock(
    "4.2",
    "ผู้ดูแลระบบต้องสามารถเพิ่ม แก้ไข ลบ และปรับปรุงข้อมูลสินค้าและบริการได้",
    "พัฒนาระบบ CRUD สินค้า ที่สามารถกำหนดชื่อ รายละเอียด ราคา สต็อก สถานะโปรโมชั่น อัปโหลดรูปภาพหลายรูป และตั้งค่าสินค้า Pre-Order พร้อมเลือกวันที่ส่งมอบผ่านปฏิทิน (Date Picker)",
    "ฟอร์มจัดการสินค้าที่สมบูรณ์ พร้อมระบบกำหนด 'จำนวนสั่งซื้อสูงสุดต่อคน' (Purchase Limit) เพื่อป้องกันการกว้านซื้อสินค้า"
  ));
  content.push(...createItemBlock(
    "4.3",
    "ผู้ดูแลระบบต้องสามารถจัดการหมวดหมู่ข้อมูลได้",
    "พัฒนาระบบเพิ่ม แก้ไข และลบหมวดหมู่สินค้าในระบบหลังบ้าน",
    "ระบบ Category Management ที่เชื่อมโยงกับข้อมูลสินค้า โดยเมื่อแก้ไขจะสะท้อนไปยังตู้ Kiosk ทันที"
  ));
  content.push(...createItemBlock(
    "4.4",
    "ระบบต้องรองรับการกำหนดสิทธิ์การเข้าใช้งานสำหรับผู้ดูแลระบบ",
    "พัฒนาระบบความปลอดภัยแบบ Role-Based Access Control (RBAC) ร่วมกับ JWT Authentication",
    "การแบ่งสิทธิ์ผู้ใช้งานเป็น 2 ระดับอย่างเข้มงวด: Staff (จัดการเฉพาะคิวคำสั่งซื้อและจ่ายของ) และ Admin (เข้าถึงได้ทุกฟังก์ชันและการตั้งค่าระบบ)"
  ));

  // Section 5
  content.push(createHeading1("5. ระบบรายงานและสถิติการใช้งาน (Reports & Analytics)"));
  content.push(...createItemBlock(
    "5.1",
    "ระบบต้องสามารถจัดเก็บข้อมูลการใช้งานของผู้ใช้งานได้",
    "ออกแบบตารางฐานข้อมูล orders, order_items, kiosk_stats และ customer_profiles เพื่อบันทึกประวัติการสั่งซื้อ วันที่-เวลา ยอดเงิน และพฤติกรรมการใช้งานอย่างละเอียด",
    "ฐานข้อมูลประวัติการทำรายการที่สมบูรณ์ สามารถตรวจสอบย้อนหลัง (Audit Trail) ได้ทุกธุรกรรม"
  ));
  content.push(...createItemBlock(
    "5.2",
    "ระบบต้องสามารถแสดงจำนวนผู้เข้าใช้งาน จำนวนการเข้าชมข้อมูล และข้อมูลสถิติพื้นฐานอื่น ๆ",
    "พัฒนาหน้า Dashboard ในระบบหลังบ้าน แสดงยอดขายรวม ยอดขายรายวัน จำนวนออเดอร์ สถิติการปลุกตู้ Kiosk (Wakeups) และสินค้าขายดี 5 อันดับแรก (Top 5 Best Sellers)",
    "หน้าแดชบอร์ดสรุปสถิติแบบ Interactive ที่แสดงผลตัวเลขและสัดส่วนยอดขายได้อย่างชัดเจน"
  ));
  content.push(...createItemBlock(
    "5.3",
    "ระบบต้องสามารถออกรายงานสรุปข้อมูลการใช้งานในรูปแบบที่นำไปใช้ประโยชน์ได้",
    "พัฒนาระบบ Report Management ที่รองรับการกรองข้อมูลตามช่วงวันที่และส่งออกไฟล์ได้ 3 รูปแบบ",
    "ฟังก์ชันส่งออกรายงานเป็นไฟล์ Microsoft Excel (.xlsx), ไฟล์ CSV (.csv) รองรับภาษาไทย 100%, และหน้าต่างพิมพ์รายงานสรุปยอดขาย (Print / PDF)"
  ));

  // Section 6
  content.push(createHeading1("6. การติดตั้งและทดสอบระบบ (Deployment & Quality Assurance)"));
  content.push(...createItemBlock(
    "6.1",
    "ติดตั้งระบบบนอุปกรณ์ Kiosk หรือเครื่องคอมพิวเตอร์ที่หน่วยงานกำหนด",
    "จัดทำคู่มือการติดตั้งระบบ (DEPLOYMENT_DOCUMENT.md) พร้อมคำสั่ง Docker Compose สำหรับรันฐานข้อมูล และการตั้งค่า Chrome Kiosk Mode บน Windows",
    "ระบบได้รับการติดตั้ง ทดสอบการเชื่อมต่อ API, Database, และพร้อมรันบนตู้ Kiosk จริงของหน่วยงาน"
  ));
  content.push(...createItemBlock(
    "6.2",
    "ทดสอบการทำงานของระบบทุกส่วนก่อนส่งมอบงาน",
    "ดำเนินการทดสอบระบบอย่างครอบคลุมทั้ง Functional Testing, Integration Testing, Security Testing, และ Performance Testing ครบ 45 Test Cases",
    "จัดทำเอกสารรายงานผลการทดสอบระบบ (TEST_REPORT.md) โดยมีผลการทดสอบผ่านเกณฑ์ 100% (Passed)"
  ));
  content.push(...createItemBlock(
    "6.3",
    "ปรับปรุงและแก้ไขข้อบกพร่องที่พบจากการทดสอบจนกว่าระบบจะสมบูรณ์",
    "ดำเนินการตรวจสอบข้อบกพร่อง (Defect Log) เช่น การคำนวณค่าส่งผสม Split Shipping, การปิดเสียงวิดีโอบน Screensaver และแก้ไขจนผ่านการทดสอบซ้ำ (Re-test) ครบถ้วน",
    "ระบบมีความเสถียร สมบูรณ์ 100% พร้อมส่งมอบคู่มือการใช้งานระบบ (USER_MANUAL.docx) ให้แก่หน่วยงาน"
  ));

  // Signature Table
  content.push(new Paragraph({ spacing: { before: 400 } }));
  content.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
              left: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
              right: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "ลงนามผู้จัดทำและส่งมอบงาน", font: FONT_FAMILY, size: 26, bold: true, color: PRIMARY_COLOR })],
                spacing: { after: 300 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "(...................................................................)", font: FONT_FAMILY, size: 24, color: DARK_TEXT })],
                spacing: { after: 100 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "หัวหน้าทีมพัฒนาระบบ DITC Shop Kiosk", font: FONT_FAMILY, size: 22, color: MUTED_TEXT })],
                spacing: { after: 50 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "วันที่ ...... / ...... / 2569", font: FONT_FAMILY, size: 22, color: MUTED_TEXT })],
              }),
            ],
          }),
          new TableCell({
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
              left: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
              right: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "ลงนามผู้ตรวจรับมอบงาน (หน่วยงาน)", font: FONT_FAMILY, size: 26, bold: true, color: PRIMARY_COLOR })],
                spacing: { after: 300 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "(...................................................................)", font: FONT_FAMILY, size: 24, color: DARK_TEXT })],
                spacing: { after: 100 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "ผู้แทนหน่วยงาน / ประธานกรรมการตรวจรับ", font: FONT_FAMILY, size: 22, color: MUTED_TEXT })],
                spacing: { after: 50 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "วันที่ ...... / ...... / 2569", font: FONT_FAMILY, size: 22, color: MUTED_TEXT })],
              }),
            ],
          }),
        ],
      }),
    ],
  }));

  return content;
}

async function generateComplianceDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: 26,
            color: DARK_TEXT,
          },
          paragraph: {
            lineSpacing: 280,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "เอกสารรายงานตอบรับขอบเขตงาน — DITC Shop Kiosk e-Commerce System",
                    font: FONT_FAMILY,
                    size: 18,
                    color: MUTED_TEXT,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.SPACE_BETWEEN,
                children: [
                  new TextRun({
                    text: "ศูนย์นวัตกรรมและการจัดการเทคโนโลยีดิจิทัล (DITC CAMT CMU)",
                    font: FONT_FAMILY,
                    size: 18,
                    color: PRIMARY_COLOR,
                  }),
                  new TextRun({
                    children: ["หน้า ", PageNumber.CURRENT, " จาก ", PageNumber.TOTAL_PAGES],
                    font: FONT_FAMILY,
                    size: 18,
                    color: MUTED_TEXT,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...createCoverSection(),
          ...buildDocumentContent(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(process.cwd(), "SCOPE_OF_WORK_COMPLIANCE.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Successfully generated Compliance Word Document at: ${outputPath}`);
}

generateComplianceDocx().catch((err) => {
  console.error("Error generating compliance docx:", err);
  process.exit(1);
});
