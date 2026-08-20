import pool from './src/data/db.js';

async function seed() {
  try {
    console.log("Seeding real mock products...");

    // 1. Ensure categories exist
    const categories = [
      { id: 'drinks', name: 'เครื่องดื่ม' },
      { id: 'snacks', name: 'ขนมและของว่าง' },
      { id: 'stationery', name: 'เครื่องเขียน' },
      { id: 'merchandise', name: 'สินค้าที่ระลึก DITC' }
    ];

    for (const cat of categories) {
      await pool.query(
        'INSERT INTO categories (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name',
        [cat.id, cat.name]
      );
    }

    // 2. Clear old product associations and products
    await pool.query('DELETE FROM product_images');
    await pool.query('DELETE FROM products');
    await pool.query('ALTER SEQUENCE products_id_seq RESTART WITH 1');

    // 3. Define new products matching uploaded images
    const products = [
      {
        name: 'น้ำดื่มบริสุทธิ์ Aqua Pure 600 มล.',
        description: 'น้ำดื่มบริสุทธิ์ผ่านการกรองระบบ Reverse Osmosis และฆ่าเชื้อด้วย UV สะอาด สดชื่น เหมาะสำหรับดื่มดับกระหายระหว่างวัน',
        price: 10,
        stock: 25,
        category_id: 'drinks',
        status: 'In Stock',
        promotion: false,
        pickup_location: 'ตู้จำหน่ายอัตโนมัติ อาคาร CAMT ชั้น 1',
        preorder_release_date: null,
        purchase_limit: null,
        images: [
          'prod_1_water_1_1786977331435.png',
          'prod_1_water_2_1786977351828.png',
          'prod_1_water_3_1786977372762.png',
          'prod_1_water_4_1786977399436.png',
          'prod_1_water_5_1786977420876.png'
        ]
      },
      {
        name: 'ชาเขียวโออิชิ รสต้นตำรับ 500 มล.',
        description: 'ชาเขียวพร้อมดื่มสูตรต้นตำรับแท้จากญี่ปุ่น ผลิตจากยอดใบชาเขียวสดแท้ รสชาติกลมกล่อม หอมสดชื่น ดื่มได้ทุกเวลา',
        price: 20,
        stock: 18,
        category_id: 'drinks',
        status: 'In Stock',
        promotion: true,
        pickup_location: 'ตู้จำหน่ายอัตโนมัติ อาคาร CAMT ชั้น 1',
        preorder_release_date: null,
        purchase_limit: null,
        images: [
          'prod_2_greentea_1_1786977651186.png',
          'prod_2_greentea_2_1786977869886.png',
          'prod_2_greentea_3_1786978162933.png',
          'prod_2_greentea_4_1786978492798.png',
          'prod_2_greentea_5_1786978516808.png'
        ]
      },
      {
        name: 'เลย์มันฝรั่งแท้ รสออริจินัล 50 กรัม',
        description: 'มันฝรั่งทอดกรอบเลย์รสคลาสสิกออริจินัล ผลิตจากมันฝรั่งแท้คุณภาพดี ปรุงรสด้วยเกลือทะเลชั้นเลิศ กรอบ อร่อย เพลินทุกคำ',
        price: 25,
        stock: 30,
        category_id: 'snacks',
        status: 'In Stock',
        promotion: false,
        pickup_location: 'ตู้จำหน่ายอัตโนมัติ อาคาร CAMT ชั้น 1',
        preorder_release_date: null,
        purchase_limit: null,
        images: [
          'prod_3_lays_1_1786978543687.png',
          'prod_3_lays_2_1786978575416.png',
          'prod_3_lays_3_1786978605532.png',
          '69f84b40fcc77b64ecc1d34e718515e5.jpeg'
        ]
      },
      {
        name: 'คิทแคท มินิ ช็อกโกแลตเวเฟอร์',
        description: 'เวเฟอร์กรุบกรอบเคลือบช็อกโกแลตนมเข้มข้น รสชาติหวานมันลงตัว สไตล์ KitKat Mini เหมาะสำหรับแบ่งปันหรือทานเล่นยามว่าง',
        price: 35,
        stock: 15,
        category_id: 'snacks',
        status: 'In Stock',
        promotion: true,
        pickup_location: 'ตู้จำหน่ายอัตโนมัติ อาคาร CAMT ชั้น 1',
        preorder_release_date: null,
        purchase_limit: null,
        images: [
          'b417c5e1583058f8e464875f868d8c46.jpeg',
          '8499081c246a043533f6220a0800c655.jpeg'
        ]
      },
      {
        name: 'ปากกาเจล Pilot G2 0.5 mm (หมึกน้ำเงิน)',
        description: 'ปากกาหมึกเจลยอดนิยมระดับโลก หัวเขียน 0.5 มม. เส้นคมชัด หมึกแห้งไว ไม่เลอะมือ ด้ามจับยางนุ่มกระชับมือ เขียนลื่นต่อเนื่อง',
        price: 45,
        stock: 20,
        category_id: 'stationery',
        status: 'In Stock',
        promotion: false,
        pickup_location: 'จุดบริการ Shop อาคาร CAMT ชั้น 2',
        preorder_release_date: null,
        purchase_limit: null,
        images: [
          'b30f69df188fb60c766f4bf49b0f8349.jpeg',
          '47a8642cc957b774e4689b150006a397.jpeg'
        ]
      },
      {
        name: 'สมุดโน้ต DITC Minimal A5 (ปกแข็งพรีเมียม)',
        description: 'สมุดบันทึก Minimal ดีไซน์หรูหรา ขนาด A5 ปกแข็งเคลือบด้านสีเขียวมินต์ ปั๊มฟอยล์เงิน DITC MINIMAL กระดาษถนอมสายตาลายตาราง (Grid) 100 แกรม',
        price: 120,
        stock: 12,
        category_id: 'stationery',
        status: 'In Stock',
        promotion: false,
        pickup_location: 'จุดบริการ Shop อาคาร CAMT ชั้น 2',
        preorder_release_date: null,
        purchase_limit: null,
        images: [
          '233b4ab20916e7976674813c94fdc2aa.jpeg',
          '5d59a6dee84c5b9676cc826730e02598.jpeg'
        ]
      },
      {
        name: 'แก้วน้ำสแตนเลสเก็บความเย็น DITC Tumbler (500ml)',
        description: 'แก้วเก็บอุณหภูมิสแตนเลสสตีล Double-wall ผิวด้านเรียบหรู เลเซอร์โลโก้ DITC เก็บความเย็นได้นาน 18-24 ชั่วโมง พร้อมฝาปิดและหลอดสแตนเลส',
        price: 290,
        stock: 8,
        category_id: 'merchandise',
        status: 'Pre-Order',
        promotion: false,
        pickup_location: 'จุดบริการ Shop อาคาร CAMT ชั้น 2',
        preorder_release_date: '2026-08-30',
        purchase_limit: 2,
        images: [
          '26fb87a40582970e037413dc166cc88f.jpeg'
        ]
      },
      {
        name: 'เสื้อยืด CAMT Graphic Tee 2026 (Streetwear)',
        description: 'เสื้อยืดสตรีทแวร์ คอลเลกชันพิเศษ 2026 CAMT ผ้าคอตตอน 100% ทรง Oversize สกรีนลายกราฟิกพรีเมียม ระบายอากาศดีเยี่ยม ใส่สบายทุกกิจกรรม',
        price: 350,
        stock: 10,
        category_id: 'merchandise',
        status: 'Pre-Order',
        promotion: false,
        pickup_location: 'จุดบริการ Shop อาคาร CAMT ชั้น 2',
        preorder_release_date: '2026-09-05',
        purchase_limit: 3,
        images: [
          '6b9b29ab22b999c0c777b292d528369c.jpeg'
        ]
      },
      {
        name: 'พวงกุญแจมาสคอต DITC Shop (อะคริลิคใส)',
        description: 'พวงกุญแจอะคริลิคสองด้านลายมาสคอตน้องหมี DITC หิ้วกล่องพัสดุสุดน่ารัก ห่วงโลหะแข็งแรง ทนทาน เหมาะสำหรับห้อยกระเป๋าหรือกุญแจ',
        price: 59,
        stock: 25,
        category_id: 'merchandise',
        status: 'In Stock',
        promotion: true,
        pickup_location: 'จุดบริการ Shop อาคาร CAMT ชั้น 2',
        preorder_release_date: null,
        purchase_limit: null,
        images: [
          'cae7c4a1a9a7b4c8aa64eb68d0c746d0.jpeg'
        ]
      },
      {
        name: 'กระเป๋าผ้าดิบ DITC Canvas Tote Bag (Mascot)',
        description: 'กระเป๋าผ้าแคนวาสรักษ์โลก ทรง Tote Bag จุของได้เยอะ ลายสกรีน Mascot DITC SHOP ขนาดใหญ่ รับน้ำหนักได้ดี เหมาะสำหรับใส่หนังสือ เอกสาร หรือแล็ปท็อป',
        price: 189,
        stock: 15,
        category_id: 'merchandise',
        status: 'In Stock',
        promotion: false,
        pickup_location: 'จุดบริการ Shop อาคาร CAMT ชั้น 2',
        preorder_release_date: null,
        purchase_limit: null,
        images: [
          '52c594c5e8a2f15ad4947bb0c244802c.jpeg'
        ]
      },
      {
        name: 'กระเป๋าเป้สะพายหลัง DITC Backpack (Mascot Edition)',
        description: 'กระเป๋าเป้สะพายหลังฟังก์ชันครบครัน ช่องใส่โน้ตบุ๊กบุนวมหนานุ่ม พร้อมช่องเก็บของแยกสัดส่วน ปักลาย DITC SHOP MASCOT คุณภาพสูง พรีออเดอร์พิเศษ',
        price: 590,
        stock: 5,
        category_id: 'merchandise',
        status: 'Pre-Order',
        promotion: false,
        pickup_location: 'จุดบริการ Shop อาคาร CAMT ชั้น 2',
        preorder_release_date: '2026-09-15',
        purchase_limit: 1,
        images: [
          'eebfdbb6d9ff992f6b5de1af83f11e6d.jpeg'
        ]
      }
    ];

    for (const p of products) {
      const res = await pool.query(
        `INSERT INTO products (name, description, price, stock, category_id, image, promotion, pickup_location, status, preorder_release_date, purchase_limit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [p.name, p.description, p.price, p.stock, p.category_id, p.images[0], p.promotion, p.pickup_location, p.status, p.preorder_release_date, p.purchase_limit]
      );

      const productId = res.rows[0].id;
      for (let i = 0; i < p.images.length; i++) {
        await pool.query(
          `INSERT INTO product_images (product_id, image_url, display_order, is_primary)
           VALUES ($1, $2, $3, $4)`,
          [productId, p.images[i], i, i === 0]
        );
      }
    }

    // Set top featured products
    await pool.query(
      "INSERT INTO system_settings (key, value) VALUES ('screensaver_featured_products', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [JSON.stringify([1, 2, 3, 7])]
    );

    console.log('✅ Successfully seeded all mock products with real uploaded images!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
}

seed();
