// backend/generate_word_manual.js
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
  NumberFormat,
  TableLayoutType,
  PageBreak
} from "docx";

const PRIMARY_COLOR = "E65100"; // Deep DITC Orange
const ACCENT_COLOR = "FB8C00";  // Amber Orange
const DARK_TEXT = "263238";     // Dark slate gray
const MUTED_TEXT = "607D8B";    // Muted blue-gray
const BG_LIGHT = "FFF8E1";      // Warm light orange tint
const BG_TABLE_HEADER = "FFE082";// Table header accent
const FONT_FAMILY = "TH Sarabun New";

function createCoverPage() {
  return [
    new Paragraph({ spacing: { before: 1200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "USER MANUAL",
          font: FONT_FAMILY,
          size: 40,
          bold: true,
          color: PRIMARY_COLOR,
          characterSpacing: 60,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "คู่มือการใช้งานระบบ",
          font: FONT_FAMILY,
          size: 52,
          bold: true,
          color: DARK_TEXT,
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "ระบบจัดจำหน่ายสินค้าผ่านตู้คีออสอัจฉริยะ (DITC Shop Kiosk e-Commerce)",
          font: FONT_FAMILY,
          size: 32,
          color: PRIMARY_COLOR,
          bold: true,
        }),
      ],
      spacing: { after: 800 },
    }),

    // Visual Box / Badge
    new Table({
      width: { size: 80, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "FFF3E0", type: ShadingType.CLEAR },
              margins: { top: 300, bottom: 300, left: 400, right: 400 },
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
                      text: "🛒 ครอบคลุมการใช้งานแบบครบวงจร",
                      font: FONT_FAMILY,
                      size: 28,
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
                      text: "• ลูกค้าหน้าร้าน (Kiosk Storefront) • ระบบกรอกที่อยู่จัดส่งบนมือถือ (Mobile Delivery)\n• เจ้าหน้าที่จัดการคิวคำสั่งซื้อ (Staff Backoffice) • ผู้ดูแลระบบและจัดการสินค้า (Admin Portal)",
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

    new Paragraph({ spacing: { before: 2400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "จัดทำโดย",
          font: FONT_FAMILY,
          size: 24,
          color: MUTED_TEXT,
        }),
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
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CAMT CMU)",
          font: FONT_FAMILY,
          size: 26,
          color: PRIMARY_COLOR,
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "ฉบับปรับปรุงล่าสุด: สิงหาคม 2569 | Version 1.0.0",
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

function createPrefacePage() {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "คำนำ",
          font: FONT_FAMILY,
          size: 40,
          bold: true,
          color: PRIMARY_COLOR,
        }),
      ],
      spacing: { before: 400, after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "คู่มือการใช้งานระบบฉบับนี้จัดทำขึ้นเพื่อเป็นแนวทางปฏิบัติและสร้างมาตรฐานในการใช้งาน ",
          font: FONT_FAMILY,
          size: 28,
        }),
        new TextRun({
          text: "ระบบจัดจำหน่ายสินค้าผ่านตู้คีออสอัจฉริยะ (DITC Shop Kiosk e-Commerce System)",
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: PRIMARY_COLOR,
        }),
        new TextRun({
          text: " ซึ่งพัฒนาขึ้นเพื่ออำนวยความสะดวกในการสั่งซื้อสินค้าที่ระลึก สินค้าพร้อมส่ง (In Stock) และสินค้าสั่งจองล่วงหน้า (Pre-Order) ของวิทยาลัยศิลปะ สื่อ และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CAMT / DITC CMU)",
          font: FONT_FAMILY,
          size: 28,
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "เนื้อหาภายในคู่มือแบ่งออกเป็น 4 ส่วนหลัก ได้แก่:",
          font: FONT_FAMILY,
          size: 28,
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({
          text: "ระบบหน้าตู้ Kiosk สำหรับลูกค้า: ",
          font: FONT_FAMILY,
          size: 26,
          bold: true,
        }),
        new TextRun({
          text: "ขั้นตอนการเลือกชมสินค้า การเลือกรูปแบบการรับสินค้า (รับที่นี่ หรือจัดส่งพัสดุ) การแยกจัดส่งสินค้า (Split Shipping) และการชำระเงินผ่าน Dynamic PromptPay QR Code",
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
      spacing: { after: 150 },
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({
          text: "ระบบเว็บมือถือสำหรับกรอกที่อยู่จัดส่ง (Mobile Delivery Portal): ",
          font: FONT_FAMILY,
          size: 26,
          bold: true,
        }),
        new TextRun({
          text: "การดึงประวัติที่อยู่เดิมด้วยอีเมล (สูงสุด 3 ที่อยู่) และการกรอก/แก้ไขที่อยู่จัดส่งพัสดุ",
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
      spacing: { after: 150 },
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({
          text: "ระบบจัดการคิวสำหรับพนักงาน (Staff): ",
          font: FONT_FAMILY,
          size: 26,
          bold: true,
        }),
        new TextRun({
          text: "การตรวจสอบคิวคำสั่งซื้อ การจ่ายสินค้าหน้าร้านบางส่วน (Partial Fulfillment) และการจัดส่งพัสดุพร้อมบันทึกเลข Tracking 2 รอบ",
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
      spacing: { after: 150 },
    }),
    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({
          text: "ระบบบริหารจัดการสำหรับผู้ดูแลระบบ (Admin): ",
          font: FONT_FAMILY,
          size: 26,
          bold: true,
        }),
        new TextRun({
          text: "การจัดการสินค้า หมวดหมู่ ปฏิทิน Pre-order การจำกัดสิทธิ์การซื้อ สื่อโฆษณาหน้าจอพัก และรายงานยอดขาย",
          font: FONT_FAMILY,
          size: 26,
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "คณะผู้จัดทำหวังเป็นอย่างยิ่งว่าคู่มือฉบับนี้จะเป็นประโยชน์ต่อผู้ปฏิบัติงาน พนักงาน และผู้ดูแลระบบในการขับเคลื่อนการดำเนินงานของโครงการให้บรรลุเป้าหมายอย่างมีประสิทธิภาพและยั่งยืน",
          font: FONT_FAMILY,
          size: 28,
        }),
      ],
      spacing: { after: 800 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: "คณะผู้จัดทำและพัฒนาระบบ\nศูนย์นวัตกรรมและการจัดการเทคโนโลยีดิจิทัล (DITC CMU)",
          font: FONT_FAMILY,
          size: 26,
          italic: true,
          color: DARK_TEXT,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function createTocPage() {
  const tocItems = [
    { title: "คำนำ (Preface)", page: "2" },
    { title: "ตอนที่ 1: บทนำและภาพรวมระบบ (Introduction & Overview)", page: "4" },
    { title: "  1. วัตถุประสงค์ของคู่มือ", page: "4" },
    { title: "  2. ภาพรวมสถาปัตยกรรมระบบ", page: "4" },
    { title: "  3. กลุ่มผู้ใช้งานระบบ", page: "5" },
    { title: "ตอนที่ 2: การใช้งานตู้ Kiosk สำหรับลูกค้าหน้าร้าน (Kiosk Storefront)", page: "6" },
    { title: "  1. หน้าจอพักโฆษณาและการปลุกหน้าจอ (Screensaver & Wake Up)", page: "6" },
    { title: "  2. การเลือกดูสินค้า ค้นหา และกรองหมวดหมู่", page: "7" },
    { title: "  3. การดูรายละเอียดสินค้า และภาพสไลด์ Carousel", page: "8" },
    { title: "  4. การจัดการตะกร้าสินค้า และการเลือกรูปแบบรับสินค้า", page: "9" },
    { title: "  5. ตัวเลือกการจัดส่งสำหรับออเดอร์ผสม (Split Shipping Option)", page: "10" },
    { title: "  6. การชำระเงินด้วย Dynamic PromptPay QR Code", page: "11" },
    { title: "  7. การกรอกข้อมูลติดต่อและการรับใบเสร็จอิเล็กทรอนิกส์ (E-Receipt)", page: "12" },
    { title: "ตอนที่ 3: การใช้งานหน้าเว็บกรอกที่อยู่จัดส่งบนมือถือ (Mobile Delivery Portal)", page: "13" },
    { title: "  1. การเข้าสู่หน้ากรอกที่อยู่ผ่านอีเมลใบเสร็จ", page: "13" },
    { title: "  2. ระบบจดจำประวัติที่อยู่จัดส่งด้วยอีเมล (Email-Based Address History)", page: "13" },
    { title: "  3. การเลือก/เพิ่ม/แก้ไขที่อยู่จัดส่ง", page: "14" },
    { title: "  4. การตรวจสอบกำหนดส่งมอบและสถานะพัสดุ", page: "14" },
    { title: "ตอนที่ 4: การใช้งานระบบหลังบ้านสำหรับพนักงานและผู้ดูแลระบบ (Admin & Staff)", page: "15" },
    { title: "  1. การเข้าสู่ระบบ (Login) และการจัดการสิทธิ์การใช้งาน", page: "15" },
    { title: "  2. แดชบอร์ดและสถิติภาพรวม (Dashboard Overview)", page: "16" },
    { title: "  3. การจัดการคิวคำสั่งซื้อและการจ่ายสินค้า (Order Queue)", page: "17" },
    { title: "     3.1 แท็บ 'รับสินค้าที่นี่' และระบบ Partial Fulfillment", page: "17" },
    { title: "     3.2 แท็บ 'จัดส่งสินค้า' และการบันทึกเลขพัสดุ 2 รอบ (Split Tracking)", page: "18" },
    { title: "     3.3 แท็บ 'ประวัติคำสั่งซื้อ' (Order History)", page: "19" },
    { title: "  4. การบริหารจัดการสินค้าและหมวดหมู่ (Product Management)", page: "20" },
    { title: "     4.1 การเพิ่ม/แก้ไขข้อมูลสินค้า และรูปภาพ Carousel", page: "20" },
    { title: "     4.2 การตั้งค่าสินค้า Pre-Order และเลือกวันที่พร้อมส่ง (Date Picker)", page: "21" },
    { title: "     4.3 การกำหนดสิทธิ์สั่งซื้อสูงสุดต่อคน (Purchase Limit)", page: "22" },
    { title: "  5. การตั้งค่าระบบและค่าจัดส่ง (Shipping Fee Settings)", page: "23" },
    { title: "  6. การจัดการสื่อโฆษณาและหน้าจอพัก (Screensaver Management)", page: "24" },
    { title: "  7. การออกรายงานยอดขายและส่งออกข้อมูล (Reports & Export)", page: "25" },
    { title: "ตอนที่ 5: ความปลอดภัยและการดูแลรักษาระบบ (Security & System Care)", page: "26" },
    { title: "  1. การรักษาความปลอดภัยบัญชีและการออกจากระบบ", page: "26" },
    { title: "  2. การเปิดใช้งานโหมด Kiosk บนอุปกรณ์จริง (Chrome Kiosk Mode)", page: "26" },
    { title: "  3. การสำรองข้อมูลและการดูแลฐานข้อมูล (Database Backup)", page: "27" },
    { title: "  4. ช่องทางการติดต่อและฝ่ายสนับสนุน (Contact & Support)", page: "27" },
  ];

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 150, right: 150 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "หัวข้อเนื้อหา (Topic / Chapter)", font: FONT_FAMILY, size: 26, bold: true, color: "FFFFFF" }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 150, right: 150 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "หน้า (Page)", font: FONT_FAMILY, size: 26, bold: true, color: "FFFFFF" }),
              ],
            }),
          ],
        }),
      ],
    }),
    ...tocItems.map((item, idx) => {
      const isHeader = item.title.startsWith("ตอนที่") || item.title.startsWith("คำนำ");
      return new TableRow({
        children: [
          new TableCell({
            shading: { fill: isHeader ? "FFF3E0" : (idx % 2 === 0 ? "FAFAFA" : "FFFFFF"), type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 150, right: 150 },
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "EEEEEE" },
              top: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.title,
                    font: FONT_FAMILY,
                    size: isHeader ? 26 : 24,
                    bold: isHeader,
                    color: isHeader ? PRIMARY_COLOR : DARK_TEXT,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            shading: { fill: isHeader ? "FFF3E0" : (idx % 2 === 0 ? "FAFAFA" : "FFFFFF"), type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 150, right: 150 },
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "EEEEEE" },
              top: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: item.page,
                    font: FONT_FAMILY,
                    size: isHeader ? 26 : 24,
                    bold: isHeader,
                    color: isHeader ? PRIMARY_COLOR : MUTED_TEXT,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }),
  ];

  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "สารบัญ",
          font: FONT_FAMILY,
          size: 40,
          bold: true,
          color: PRIMARY_COLOR,
        }),
      ],
      spacing: { before: 300, after: 200 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function createHeading(title, level = HeadingLevel.HEADING_1) {
  const size = level === HeadingLevel.HEADING_1 ? 36 : level === HeadingLevel.HEADING_2 ? 30 : 26;
  const color = level === HeadingLevel.HEADING_1 ? PRIMARY_COLOR : level === HeadingLevel.HEADING_2 ? ACCENT_COLOR : DARK_TEXT;
  return new Paragraph({
    heading: level,
    children: [
      new TextRun({
        text: title,
        font: FONT_FAMILY,
        size: size,
        bold: true,
        color: color,
      }),
    ],
    spacing: { before: 300, after: 150 },
  });
}

function createCallout(title, text, type = "info") {
  const borderCol = type === "warning" ? "FFA000" : PRIMARY_COLOR;
  const bgCol = type === "warning" ? "FFF8E1" : "FFF3E0";
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: bgCol, type: ShadingType.CLEAR },
            margins: { top: 150, bottom: 150, left: 200, right: 200 },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 24, color: borderCol },
              top: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: title, font: FONT_FAMILY, size: 26, bold: true, color: borderCol }),
                ],
                spacing: { after: 80 },
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

function createBullet(title, desc) {
  return new Paragraph({
    bullet: { level: 0 },
    children: [
      new TextRun({ text: title + (desc ? ": " : ""), font: FONT_FAMILY, size: 26, bold: true, color: DARK_TEXT }),
      new TextRun({ text: desc, font: FONT_FAMILY, size: 26, color: DARK_TEXT }),
    ],
    spacing: { after: 100 },
  });
}

function createNumberedStep(stepNum, title, desc) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${stepNum}. `, font: FONT_FAMILY, size: 26, bold: true, color: PRIMARY_COLOR }),
      new TextRun({ text: title + (desc ? ": " : ""), font: FONT_FAMILY, size: 26, bold: true, color: DARK_TEXT }),
      new TextRun({ text: desc, font: FONT_FAMILY, size: 26, color: DARK_TEXT }),
    ],
    spacing: { after: 120 },
  });
}

function buildBody() {
  const content = [];

  // ==========================================
  // ตอนที่ 1: บทนำและภาพรวมระบบ
  // ==========================================
  content.push(createHeading("ตอนที่ 1: บทนำและภาพรวมระบบ (Introduction & System Overview)", HeadingLevel.HEADING_1));
  
  content.push(createHeading("1. วัตถุประสงค์ของคู่มือ", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "คู่มือฉบับนี้จัดทำขึ้นเพื่ออธิบายฟังก์ชันการทำงาน โครงสร้างข้อมูล และขั้นตอนการใช้งานระบบ Kiosk e-Commerce ให้แก่ผู้ใช้งานแต่ละกลุ่มอย่างละเอียด เพื่อให้สามารถปฏิบัติงานได้อย่างถูกต้อง รวดเร็ว ปลอดภัย และเกิดประโยชน์สูงสุดแก่องค์กร",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 200 },
  }));

  content.push(createHeading("2. ภาพรวมสถาปัตยกรรมระบบ", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "ระบบ DITC Shop Kiosk e-Commerce พัฒนาขึ้นด้วยสถาปัตยกรรมที่ทันสมัย รองรับการทำงานแบบเรียลไทม์ โดยแบ่งองค์ประกอบการทำงานออกเป็น 4 ส่วนหลักที่เชื่อมโยงกันอย่างสมบูรณ์:",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 150 },
  }));

  content.push(createBullet("ตู้คีออสหน้าร้าน (Kiosk Terminal)", "หน้าจอสัมผัสสำหรับลูกค้าเลือกดูสินค้า สั่งซื้อ สแกนชำระเงินผ่าน Dynamic PromptPay QR Code และแสดงสื่อโฆษณาพักหน้าจอ"));
  content.push(createBullet("ระบบบริการหลังบ้าน (Backend API & PostgreSQL)", "ขับเคลื่อนด้วย Node.js / Express ร่วมกับฐานข้อมูล PostgreSQL 16 ทำหน้าที่ประมวลผลออเดอร์ บันทึกธุรกรรม ตัดสต็อก และเชื่อมต่อ Payment Gateway"));
  content.push(createBullet("ระบบกรอกที่อยู่บนมือถือ (Mobile Delivery Portal)", "เว็บเพจ Responsive สำหรับลูกค้าที่เลือกจัดส่งพัสดุ โดยเข้าผ่าน Magic Link ในอีเมลใบเสร็จ มีระบบจดจำประวัติที่อยู่เดิมด้วยอีเมล (สูงสุด 3 ที่อยู่)"));
  content.push(createBullet("ระบบจัดการสำหรับเจ้าหน้าที่ (Staff & Admin Backoffice)", "ระบบจัดการคิวคำสั่งซื้อแบบแยก 3 แท็บ รองรับ Partial Fulfillment สินค้า In Stock / Pre-Order พร้อมระบบจัดการสินค้า สื่อโฆษณา และรายงานยอดขาย"));

  content.push(new Paragraph({ spacing: { before: 150 } }));
  content.push(createCallout("💡 จุดเด่นด้านสถาปัตยกรรม (Key Architectural Advantages)", "ระบบใช้ Dynamic PromptPay QR Code ที่ระบุยอดเงินและ Order ID โดยตรง เมื่อลูกค้าโอนเงินสำเร็จ Gateway จะยิง Webhook แจ้งสถานะชำระเงินกลับมาทันที ทำให้ตู้คีออสเปลี่ยนหน้าจอสำเร็จอัตโนมัติในเวลาเฉลี่ย < 1.5 วินาที โดยที่ลูกค้าไม่ต้องอัปโหลดรูปภาพสลิปใด ๆ ทั้งสิ้น ป้องกันปัญหาการโกงและสลิปปลอมได้ 100%"));

  content.push(createHeading("3. กลุ่มผู้ใช้งานระบบ (Target Users)", HeadingLevel.HEADING_2));
  const userTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: "กลุ่มผู้ใช้งาน (User Role)", font: FONT_FAMILY, size: 26, bold: true, color: "FFFFFF" })] })],
          }),
          new TableCell({
            shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: "หน้าที่และความรับผิดชอบหลัก (Core Responsibilities)", font: FONT_FAMILY, size: 26, bold: true, color: "FFFFFF" })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: "1. ลูกค้าหน้าร้าน (Kiosk Customer)", font: FONT_FAMILY, size: 24, bold: true, color: DARK_TEXT })] })],
          }),
          new TableCell({
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: "เลือกดูสินค้า สั่งซื้อ เลือกวิธีรับของ ชำระเงินด้วย QR Code และกรอกเบอร์โทร/อีเมลเพื่อรับใบเสร็จ", font: FONT_FAMILY, size: 24, color: DARK_TEXT })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: "2. ลูกค้าจัดส่ง (Mobile Customer)", font: FONT_FAMILY, size: 24, bold: true, color: DARK_TEXT })] })],
          }),
          new TableCell({
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: "เปิดลิงก์จากอีเมลใบเสร็จบนมือถือ เลือกที่อยู่เดิมหรือกรอกที่อยู่ใหม่ และติดตามสถานะพัสดุ", font: FONT_FAMILY, size: 24, color: DARK_TEXT })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: "3. พนักงานหน้าร้าน (Staff)", font: FONT_FAMILY, size: 24, bold: true, color: DARK_TEXT })] })],
          }),
          new TableCell({
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: "ตรวจสอบคิวคำสั่งซื้อ จ่ายสินค้า In Stock ให้ลูกค้าหน้าร้าน และแพ็คพัสดุพร้อมกรอกเลข Tracking", font: FONT_FAMILY, size: 24, color: DARK_TEXT })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: "4. ผู้ดูแลระบบ (Admin)", font: FONT_FAMILY, size: 24, bold: true, color: DARK_TEXT })] })],
          }),
          new TableCell({
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [new Paragraph({ children: [new TextRun({ text: "บริหารจัดการสินค้า หมวดหมู่ สื่อโฆษณา กำหนดค่าจัดส่ง จัดการบัญชีพนักงาน และดูรายงานยอดขาย", font: FONT_FAMILY, size: 24, color: DARK_TEXT })] })],
          }),
        ],
      }),
    ],
  });
  content.push(userTable);
  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ==========================================
  // ตอนที่ 2: การใช้งานตู้ Kiosk สำหรับลูกค้าหน้าร้าน
  // ==========================================
  content.push(createHeading("ตอนที่ 2: การใช้งานตู้ Kiosk สำหรับลูกค้าหน้าร้าน (Kiosk Storefront Guide)", HeadingLevel.HEADING_1));

  content.push(createHeading("1. หน้าจอพักโฆษณาและการปลุกหน้าจอ (Screensaver & Wake Up)", HeadingLevel.HEADING_2));
  content.push(createBullet("การตัดเข้าสู่โหมดพักจอ", "เมื่อตู้คีออสไม่มีการสัมผัสใช้งานนานเกิน 2 นาที ระบบจะตัดเข้าสู่หน้าจอโฆษณาและสื่อประชาสัมพันธ์ (Screensaver) อัตโนมัติ"));
  content.push(createBullet("การแสดงผลสื่อ", "เล่นภาพนิ่งและวิดีโอประชาสัมพันธ์วนลูป โดยวิดีโอจะเล่นแบบปิดเสียง (Muted) เพื่อไม่รบกวนบรรยากาศ พร้อมแถบนาฬิกาและวันที่ภาษาไทยแบบ Real-time"));
  content.push(createBullet("การปลุกตู้ (Wake Up)", "ลูกค้าสามารถแตะสัมผัสที่ส่วนใดก็ได้บนหน้าจอ ระบบจะปิดโฆษณาและนำเข้าสู่หน้าเลือกซื้อสินค้าทันที"));

  content.push(createHeading("2. การเลือกดูสินค้า ค้นหา และกรองหมวดหมู่", HeadingLevel.HEADING_2));
  content.push(createNumberedStep(1, "เลือกหมวดหมู่สินค้า", "แตะแถบหมวดหมู่ด้านซ้าย เช่น เสื้อผ้า, ของที่ระลึก, ของใช้ เพื่อดูสินค้าเฉพาะกลุ่ม"));
  content.push(createNumberedStep(2, "ค้นหาสินค้า", "แตะที่ช่องค้นหาด้านบนเพื่อพิมพ์ชื่อสินค้า หรือแตะปุ่มคำค้นหายอดนิยม (Search Tags)"));
  content.push(createNumberedStep(3, "ตรวจสอบป้ายสินค้า", "สังเกตป้ายโปรโมชั่น (Promotion), ป้ายสต็อกคงเหลือ และป้ายสีส้มเด่นชัด 'Pre-Order' ที่ระบุวันพร้อมส่ง"));

  content.push(createHeading("3. การดูรายละเอียดสินค้า และภาพสไลด์ Carousel", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "เมื่อแตะที่การ์ดสินค้า หน้าต่างรายละเอียด (Product Detail Modal) จะเปิดขึ้นมา แสดงข้อมูลดังนี้:",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 100 },
  }));
  content.push(createBullet("ภาพสินค้า Carousel", "สามารถปัดซ้าย-ขวา เพื่อดูรูปภาพสินค้ามุมมองต่างๆ ได้สูงสุด 5 ภาพ"));
  content.push(createBullet("สถานที่รับของ / วันที่พร้อมส่ง", "ระบุจุดรับสินค้าหน้าร้าน หรือวันที่พร้อมเริ่มส่งมอบกรณีเป็นสินค้าสั่งจองล่วงหน้า"));
  content.push(createBullet("จำกัดสิทธิ์การสั่งซื้อ", "หากสินค้ามีการจำกัดสิทธิ์ (เช่น ไม่เกิน 2 ชิ้น/ท่าน) ระบบจะแจ้งเตือนและล็อกไม่ให้กดเพิ่มเกินกำหนด"));

  content.push(createHeading("4. การจัดการตะกร้าสินค้า และการเลือกรูปแบบรับสินค้า (Cart Drawer)", HeadingLevel.HEADING_2));
  content.push(createNumberedStep(1, "เปิดตะกร้าสินค้า", "แตะไอคอนตะกร้าที่มุมขวาบน จะปรากฏหน้าต่าง Cart Drawer แสดงรายการสินค้าทั้งหมด"));
  content.push(createNumberedStep(2, "ปรับจำนวนสินค้า", "กดปุ่ม [+] หรือ [-] เพื่อเพิ่ม/ลดจำนวน หรือกดไอคอนถังขยะเพื่อลบสินค้าออกจากตะกร้า"));
  content.push(createNumberedStep(3, "เลือกรูปแบบการรับสินค้า (Delivery Option)", "มีปุ่มตัวเลือก 2 รูปแบบ:"));
  content.push(new Paragraph({
    bullet: { level: 1 },
    children: [
      new TextRun({ text: "🏢 'รับสินค้าที่นี่' (Pick Up): ", font: FONT_FAMILY, size: 24, bold: true }),
      new TextRun({ text: "รับสินค้าที่จุดบริการของคณะตามที่ระบุในรายการ (ฟรีค่าจัดส่ง 0 บาท)", font: FONT_FAMILY, size: 24 }),
    ],
  }));
  content.push(new Paragraph({
    bullet: { level: 1 },
    children: [
      new TextRun({ text: "🚚 'จัดส่งสินค้า' (Delivery): ", font: FONT_FAMILY, size: 24, bold: true }),
      new TextRun({ text: "จัดส่งพัสดุไปยังที่อยู่ของลูกค้า (คิดค่าจัดส่งมาตรฐานตามที่ระบบกำหนด)", font: FONT_FAMILY, size: 24 }),
    ],
    spacing: { after: 150 },
  }));

  content.push(createHeading("5. ตัวเลือกการจัดส่งสำหรับออเดอร์ผสม (Split Shipping Option)", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "กรณีในตะกร้ามีทั้งสินค้าพร้อมส่ง (In Stock) และสินค้าพรีออเดอร์ (Pre-Order) และลูกค้าเลือก 'จัดส่งสินค้า' ระบบจะแสดงตัวเลือกการส่งเพิ่ม 2 แบบ:",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 100 },
  }));
  content.push(createBullet("📦 'จัดส่งพร้อมกันทั้งหมด' (Combined Shipping)", "รอจัดส่งเป็นกล่องเดียวเมื่อสินค้า Pre-Order ผลิตเสร็จ (คิดค่าจัดส่งอัตราปกติ 1 ครั้ง)"));
  content.push(createBullet("⚡ 'แยกจัดส่งสินค้า' (Split Shipping)", "จัดส่งสินค้า In Stock ให้ทันทีก่อนในรอบแรก และส่งสินค้า Pre-Order ตามไปในรอบที่สองเมื่อผลิตเสร็จ (ระบบบวกเพิ่มค่าจัดส่งรอบที่ 2 เข้าในยอดชำระสุทธิทันที)"));

  content.push(createHeading("6. การชำระเงินด้วย Dynamic PromptPay QR Code", HeadingLevel.HEADING_2));
  content.push(createNumberedStep(1, "กดยืนยันสั่งซื้อ", "ตรวจสอบยอดชำระสุทธิและกดยืนยัน ระบบจะสร้าง Dynamic QR Code พร้อมหมายเลขออเดอร์ CAMT-YYYYMMDD-XXXX"));
  content.push(createNumberedStep(2, "สแกนจ่ายเงิน", "ลูกค้าเปิดแอป Mobile Banking ของธนาคารใดก็ได้ สแกน QR Code และกดยืนยันการโอน"));
  content.push(createNumberedStep(3, "เปลี่ยนสถานะอัตโนมัติ", "เมื่อยอดเงินเข้า ระบบจะตรวจจับผ่าน Webhook และเปลี่ยนหน้าจอสำเร็จทันทีใน 1-2 วินาที โดยไม่ต้องอัปโหลดสลิป"));

  content.push(createHeading("7. การกรอกข้อมูลติดต่อและการรับใบเสร็จอิเล็กทรอนิกส์ (E-Receipt)", HeadingLevel.HEADING_2));
  content.push(createNumberedStep(1, "กรอกเบอร์โทรและอีเมล", "กรอกเบอร์โทรศัพท์ 10 หลัก และที่อยู่อีเมลสำหรับรับใบเสร็จ"));
  content.push(createNumberedStep(2, "กดรับใบเสร็จ", "ระบบจะส่ง E-Receipt รูปแบบทางการไปยังอีเมลทันที"));
  content.push(createNumberedStep(3, "ลิงก์กรอกที่อยู่", "กรณีเลือกจัดส่งสินค้า ในอีเมลจะมีปุ่ม 'กรอกรายละเอียดการจัดส่งสินค้า' สำหรับเปิดทำรายการต่อบนมือถือ"));

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ==========================================
  // ตอนที่ 3: การใช้งานหน้าเว็บกรอกที่อยู่จัดส่งบนมือถือ
  // ==========================================
  content.push(createHeading("ตอนที่ 3: การใช้งานหน้าเว็บกรอกที่อยู่จัดส่งบนมือถือ (Mobile Delivery Portal)", HeadingLevel.HEADING_1));

  content.push(createHeading("1. การเข้าสู่หน้ากรอกที่อยู่ผ่านอีเมลใบเสร็จ", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "เมื่อลูกค้าชำระเงินที่ตู้ Kiosk และเลือกรูปแบบ 'จัดส่งสินค้า' ระบบจะส่งอีเมลใบเสร็จรับเงินที่มีปุ่ม Magic Link ไปยังอีเมลของลูกค้า ลูกค้าสามารถเปิดอีเมลบนสมาร์ตโฟนแล้วแตะปุ่ม 'กรอกรายละเอียดการจัดส่งสินค้า' เพื่อเข้าสู่หน้าเว็บ Mobile Delivery ได้ทันที โดยไม่ต้องพิมพ์รหัสผ่าน",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 150 },
  }));

  content.push(createHeading("2. ระบบจดจำประวัติที่อยู่จัดส่งด้วยอีเมล (Email-Based Address History)", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "เพื่อความสะดวกรวดเร็วในการใช้งาน ระบบจะใช้อีเมลของลูกค้าในการค้นหาประวัติที่อยู่จัดส่งเดิมที่เคยบันทึกไว้ในระบบ (บันทึกได้สูงสุด 3 ที่อยู่):",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 100 },
  }));
  content.push(createBullet("กรณีลูกค้าเดิม", "หน้าจอจะแสดงการ์ดที่อยู่เดิมที่เคยบันทึกไว้ ลูกค้าสามารถแตะเลือกที่อยู่เดิมที่ต้องการได้ทันทีโดยไม่ต้องพิมพ์ซ้ำ"));
  content.push(createBullet("กรณีลูกค้าใหม่", "ระบบจะแสดงฟอร์มกรอกที่อยู่จัดส่งใหม่ให้กรอกข้อมูล"));

  content.push(createHeading("3. การเลือก/เพิ่ม/แก้ไขที่อยู่จัดส่ง", HeadingLevel.HEADING_2));
  content.push(createNumberedStep(1, "กรอกข้อมูลผู้รับ", "ระบุชื่อ-นามสกุล และเบอร์โทรศัพท์ติดต่อสำหรับจัดส่งพัสดุ"));
  content.push(createNumberedStep(2, "ระบุที่อยู่จัดส่ง", "กรอกบ้านเลขที่ อาคาร ถนน ซอย ตำบล/แขวง อำเภอ/เขต จังหวัด และรหัสไปรษณีย์"));
  content.push(createNumberedStep(3, "บันทึกข้อมูล", "กดยืนยัน ระบบจะบันทึกที่อยู่ลงในคำสั่งซื้อ และบันทึกลงในโปรไฟล์ของลูกค้าเพื่อใช้ในครั้งต่อไป"));

  content.push(createHeading("4. การตรวจสอบกำหนดส่งมอบและสถานะพัสดุ", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "ในหน้า Mobile Delivery ลูกค้าสามารถตรวจสอบความคืบหน้าของคำสั่งซื้อได้ตลอดเวลา โดยระบบจะแสดงวันคาดการณ์จัดส่ง (กรณีมีสินค้า Pre-Order) และเมื่อเจ้าหน้าที่จัดส่งสินค้าแล้ว จะแสดงชื่อบริษัทขนส่ง (Flash / J&T / Kerry / ไปรษณีย์ไทย) พร้อมหมายเลขพัสดุ (Tracking Number) ทั้งรอบที่ 1 และรอบที่ 2",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 200 },
  }));

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ==========================================
  // ตอนที่ 4: การใช้งานระบบหลังบ้านสำหรับพนักงานและผู้ดูแลระบบ
  // ==========================================
  content.push(createHeading("ตอนที่ 4: การใช้งานระบบหลังบ้านสำหรับพนักงานและผู้ดูแลระบบ (Admin & Staff)", HeadingLevel.HEADING_1));

  content.push(createHeading("1. การเข้าสู่ระบบ (Login) และการจัดการสิทธิ์การใช้งาน", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "เจ้าหน้าที่และแอดมินสามารถเข้าใช้งานระบบหลังบ้านผ่านทาง URL: /login โดยกรอก Username และ Password ที่ได้รับมอบหมาย ระบบจะควบคุมสิทธิ์ตามบทบาท (RBAC) ดังนี้:",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 100 },
  }));
  content.push(createBullet("สิทธิ์ Staff (พนักงานหน้าร้าน)", "เข้าถึงเมนูจัดการคิวคำสั่งซื้อ (Order Queue) เพื่อจ่ายของหน้าร้านและบันทึกเลขพัสดุ"));
  content.push(createBullet("สิทธิ์ Admin (ผู้ดูแลระบบ)", "เข้าถึงได้ทุกเมนู ได้แก่ Order Queue, Product Management, Screensaver Management, Report Management และ System Settings"));

  content.push(createHeading("2. แดชบอร์ดและสถิติภาพรวม (Dashboard Overview)", HeadingLevel.HEADING_2));
  content.push(createBullet("ยอดขายรวมและรายวัน", "แสดงกราฟและตัวเลขยอดขายสุทธิ จำนวนคำสั่งซื้อที่สำเร็จ และค่าเฉลี่ยต่อบิล"));
  content.push(createBullet("สินค้าขายดี (Best Sellers)", "สรุปอันดับสินค้าที่มีปริมาณการสั่งซื้อสูงสุด"));
  content.push(createBullet("สถิติตู้คีออส (Kiosk Analytics)", "สถิติจำนวนครั้งในการปลุกตู้ (Wakeups) และจำนวนการเข้าชมสินค้า"));

  content.push(createHeading("3. การจัดการคิวคำสั่งซื้อและการจ่ายสินค้า (Order Queue Management)", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "หน้าจอ Order Queue แบ่งการทำงานออกเป็น 3 แท็บหลักอย่างชัดเจนตามรูปแบบการรับสินค้า:",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 100 },
  }));

  content.push(createHeading("3.1 แท็บ 'รับสินค้าที่นี่' (Pick Up) และระบบ Partial Fulfillment", HeadingLevel.HEADING_3));
  content.push(createBullet("ออเดอร์ In Stock ล้วน", "พนักงานหยิบสินค้ามอบให้ลูกค้าและกดปุ่ม [ ยืนยันจ่ายสินค้า ] เพื่อจบงาน ออเดอร์จะย้ายไปแท็บประวัติ"));
  content.push(createBullet("ออเดอร์ผสม (In Stock + Pre-Order)", "พนักงานกดปุ่ม [ ยืนยันจ่ายสินค้า In Stock ] เพื่อส่งมอบของชิ้นแรกให้ลูกค้าทันที ออเดอร์จะเปลี่ยนสถานะเป็น 'จ่ายสินค้าแล้วบางส่วน' ส่วนปุ่ม Pre-Order จะถูกล็อกไว้จนกว่าจะถึงกำหนดวันรับ เมื่อถึงกำหนดจะปลดล็อกให้จ่ายของชิ้นที่สองได้"));

  content.push(createHeading("3.2 แท็บ 'จัดส่งสินค้า' (Delivery) และการบันทึกเลขพัสดุ 2 รอบ (Split Tracking)", HeadingLevel.HEADING_3));
  content.push(createBullet("กรณีจัดส่งพร้อมกัน (Combined)", "รอสินค้า Pre-Order ผลิตเสร็จ แพ็คของรวมกล่องเดียว เลือกขนส่ง กรอกเลข Tracking แล้วกดยืนยัน"));
  content.push(createBullet("กรณีแยกจัดส่ง (Split Shipping)", "รอบที่ 1: แพ็คส่งสินค้า In Stock ทันที เลือกขนส่ง กรอก Tracking 1 -> ออเดอร์เปลี่ยนเป็น 'จัดส่งรอบแรกแล้ว' / รอบที่ 2: เมื่อ Pre-Order ผลิตเสร็จ แพ็คส่งและกรอก Tracking 2 -> ออเดอร์สมบูรณ์"));

  content.push(createHeading("3.3 แท็บ 'ประวัติคำสั่งซื้อ' (Order History)", HeadingLevel.HEADING_3));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "แสดงรายการคำสั่งซื้อที่เสร็จสิ้นทั้งหมด สามารถกรองดูย้อนหลังตามวันที่ (วันนี้, เมื่อวาน, เลือกจากปฏิทิน) และค้นหาตามเลขออเดอร์หรือเบอร์โทรศัพท์ได้",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 150 },
  }));

  content.push(createHeading("4. การบริหารจัดการสินค้าและหมวดหมู่ (Product & Category Management)", HeadingLevel.HEADING_2));
  content.push(createNumberedStep(1, "เพิ่ม/แก้ไขสินค้า", "กรอกชื่อสินค้า รายละเอียด ราคา สต็อก หมวดหมู่ และสถานที่รับของหน้าร้าน"));
  content.push(createNumberedStep(2, "อัปโหลดภาพ Carousel", "อัปโหลดรูปภาพสินค้าได้สูงสุด 5 ภาพ พร้อมกำหนดภาพหน้าปก"));
  content.push(createNumberedStep(3, "ตั้งค่า Pre-Order และ Date Picker", "เปิดสวิตช์ Pre-Order และเลือกวันที่พร้อมจัดส่ง/รับของจากปฏิทิน เพื่อนำไปแสดงในตู้ Kiosk"));
  content.push(createNumberedStep(4, "กำหนด Purchase Limit", "ระบุจำนวนสั่งซื้อสูงสุดต่อคน เพื่อควบคุมโควตาสินค้า Limited Edition"));

  content.push(createHeading("5. การตั้งค่าระบบและค่าจัดส่ง (Shipping Fee Settings)", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "ผู้ดูแลระบบสามารถปรับเปลี่ยนอัตราค่าจัดส่งได้เองผ่านระบบหลังบ้าน โดยค่าที่แก้ไขจะมีผลต่อการคำนวณราคาหน้าตู้ Kiosk ทันที:",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 100 },
  }));
  content.push(createBullet("Base Shipping Fee (ค่าจัดส่งปกติเริ่มต้น)", "อัตราค่าส่งสำหรับสินค้าทั่วไปหรือการส่งกล่องเดียว (เช่น 50 บาท)"));
  content.push(createBullet("Additional Split Shipping Fee (ค่าส่งเพิ่มเติมกรณีแยกส่ง)", "อัตราค่าส่งที่บวกเพิ่มในรอบที่สองเมื่อลูกค้าเลือกแยกส่ง (เช่น 40 บาท)"));

  content.push(createHeading("6. การจัดการสื่อโฆษณาและหน้าจอพัก (Screensaver Management)", HeadingLevel.HEADING_2));
  content.push(createBullet("อัปโหลดสื่อประชาสัมพันธ์", "รองรับไฟล์ภาพ JPEG, PNG, WebP และไฟล์วิดีโอ MP4"));
  content.push(createBullet("ตั้งค่าการแสดงผล", "สวิตช์เปิด/ปิดสื่อแต่ละชิ้น, กำหนดเวลาแสดงผลต่อภาพ (วินาที) และปุ่มเลื่อนจัดลำดับก่อนหลัง"));
  content.push(createBullet("หน้าจอจำลอง (Live Preview)", "มีหน้าต่าง Preview ให้ตรวจสอบความถูกต้องของภาพและวิดีโอก่อนเปิดแสดงบนตู้จริง"));

  content.push(createHeading("7. การออกรายงานยอดขายและส่งออกข้อมูล (Reports & Data Export)", HeadingLevel.HEADING_2));
  content.push(createBullet("Export to Excel (.xlsx)", "ดาวน์โหลดไฟล์ Excel สรุปยอดขาย รายการสินค้า และรายละเอียดการชำระเงินอย่างเป็นระเบียบ"));
  content.push(createBullet("Export to CSV (.csv)", "ไฟล์ข้อมูลมาตรฐาน UTF-8 รองรับภาษาไทย 100% สำหรับนำไปวิเคราะห์ต่อในระบบอื่น"));
  content.push(createBullet("Print / PDF Report", "หน้าต่างพิมพ์รายงานสรุปยอดขายพร้อมฟอร์แมตจัดหน้ากระดาษสวยงาม"));

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ==========================================
  // ตอนที่ 5: ความปลอดภัยและการดูแลรักษาระบบ
  // ==========================================
  content.push(createHeading("ตอนที่ 5: ความปลอดภัยและการดูแลรักษาระบบ (Security & System Care)", HeadingLevel.HEADING_1));

  content.push(createHeading("1. การรักษาความปลอดภัยบัญชีและการออกจากระบบ", HeadingLevel.HEADING_2));
  content.push(createBullet("การรักษาความลับรหัสผ่าน", "ห้ามเปิดเผยรหัสผ่านแก่บุคคลภายนอก และควรเปลี่ยนรหัสผ่านเป็นประจำทุก 3-6 เดือน"));
  content.push(createBullet("การออกจากระบบ (Sign Out)", "ควรกดปุ่มออกจากระบบทุกครั้งเมื่อเลิกใช้งาน โดยเฉพาะเมื่อล็อกอินบนอุปกรณ์ส่วนกลาง"));

  content.push(createHeading("2. การเปิดใช้งานโหมด Kiosk บนอุปกรณ์จริง (Chrome Kiosk Mode)", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "เพื่อป้องกันไม่ให้ผู้ใช้งานหน้าร้านปิดเบราว์เซอร์หรือเข้าถึงระบบปฏิบัติการของตู้คีออส ให้เปิดใช้งาน Google Chrome ในโหมด Kiosk ด้วยคำสั่ง:",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 100 },
  }));
  content.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "263238", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'chrome.exe --kiosk --disable-pinch --overscroll-history-navigation=0 --disable-context-menu http://localhost:5173',
                    font: "Consolas",
                    size: 20,
                    color: "80D8FF",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  }));

  content.push(createHeading("3. การสำรองข้อมูลและการดูแลฐานข้อมูล (Database Backup)", HeadingLevel.HEADING_2));
  content.push(new Paragraph({
    children: [
      new TextRun({
        text: "แนะนำให้ทำการสำรองข้อมูลฐานข้อมูล PostgreSQL เป็นประจำทุกวัน ผ่านคำสั่ง Docker CLI:",
        font: FONT_FAMILY,
        size: 26,
      }),
    ],
    spacing: { after: 100 },
  }));
  content.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "263238", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'docker exec -t kiosk-postgres pg_dump -U ditc_kiosk kiosk_db > backup_$(date +%Y%m%d).sql',
                    font: "Consolas",
                    size: 20,
                    color: "80D8FF",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  }));

  content.push(createHeading("4. ช่องทางการติดต่อและฝ่ายสนับสนุน (Contact & Support)", HeadingLevel.HEADING_2));
  content.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "FFF3E0", type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 250, right: 250 },
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
                    text: "ศูนย์นวัตกรรมและการจัดการเทคโนโลยีดิจิทัล (DITC)",
                    font: FONT_FAMILY,
                    size: 30,
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
                    text: "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CAMT CMU)",
                    font: FONT_FAMILY,
                    size: 26,
                    color: DARK_TEXT,
                  }),
                ],
                spacing: { after: 150 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "📍 239 ถนนห้วยแก้ว ตำบลสุเทพ อำเภอเมือง จังหวัดเชียงใหม่ 50200\n📧 E-mail: admin@ditc.camt.info | 🌐 Website: https://ditc.camt.cmu.ac.th\n📞 เบอร์โทรศัพท์: 053-920299 ต่อฝ่ายพัฒนานวัตกรรมดิจิทัล",
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
  }));

  return content;
}

async function generateManualDocx() {
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
              top: 1440,    // 1 inch
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
                    text: "DITC Shop Kiosk e-Commerce System — User Manual",
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
          ...createCoverPage(),
          ...createPrefacePage(),
          ...createTocPage(),
          ...buildBody(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(process.cwd(), "USER_MANUAL.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Successfully generated Word Document at: ${outputPath}`);
}

generateManualDocx().catch((err) => {
  console.error("Error generating docx:", err);
  process.exit(1);
});
