// backend/src/controllers/checkoutController.js
import multer from "multer";
import path from "path";
import fs from "fs";
import orderService from "../services/orderService.js";

// Multer storage setup to dynamically route slip uploads into uploads/slips/YYYY/MM/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");

    // Dynamic path uploads/slips/YYYY/MM/ relative to process cwd
    const dir = path.join(process.cwd(), "uploads", "slips", String(yyyy), String(mm));

    // Create folder recursively if it doesn't exist
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const orderId = req.body.orderId || "unknown";
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    
    cb(null, `${orderId}-${uniqueSuffix}${ext}`);
  }
});

// Create multer upload instance
export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

class CheckoutController {
  /**
   * Handle checkout submission from mobile (POST /api/checkout/submit)
   */
  async submitCheckout(req, res) {
    try {
      const { 
        orderId, 
        name, 
        phone, 
        email, 
        addressStreet, 
        subdistrict, 
        district, 
        province, 
        zipcode 
      } = req.body;

      if (!orderId) {
        return res.status(400).json({ error: "Order ID is required." });
      }

      const order = orderService.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Payment slip image is required." });
      }

      // Calculate relative URL path for slip image
      const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, "/");
      const slipUrl = `/${relativePath}`;

      // Update order and trigger SSE signal to Kiosk
      const updatedOrder = orderService.updateOrderPayment(orderId, {
        customerName: name || "Customer",
        customerPhone: phone || "",
        customerEmail: email || "",
        customerAddress: {
          street: addressStreet || "",
          subdistrict: subdistrict || "",
          district: district || "",
          province: province || "",
          zipcode: zipcode || ""
        },
        slipUrl: slipUrl
      });

      return res.json({
        message: "Payment submitted successfully.",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error in CheckoutController.submitCheckout:", error);
      return res.status(500).json({ error: "Internal server error occurred." });
    }
  }
}

export default new CheckoutController();
