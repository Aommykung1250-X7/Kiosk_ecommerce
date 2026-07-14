// backend/src/controllers/checkoutController.js
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import orderService from "../services/orderService.js";
import emailService from "../services/emailService.js";

const uploadDir = path.join(process.cwd(), "uploads", "slips");

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only image files are allowed for slips."));
  }

  cb(null, true);
};

// Multer storage setup to dynamically route slip uploads into uploads/slips/YYYY/MM/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");

    const dir = path.join(uploadDir, String(yyyy), String(mm));
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = crypto.randomBytes(16).toString("hex");
    cb(null, `${safeName}${ext}`);
  }
});

// Create multer upload instance
export const upload = multer({
  storage,
  fileFilter,
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

      const order = await orderService.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Payment slip image is required." });
      }

      const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, "/");
      const slipUrl = `/api/uploads/${encodeURIComponent(path.basename(req.file.path))}`;

      // Update order and trigger SSE signal to Kiosk
      const updatedOrder = await orderService.updateOrderPayment(orderId, {
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

      // Send email receipt asynchronously (non-blocking)
      if (updatedOrder && email) {
        emailService.sendReceipt(updatedOrder, email).catch(err => {
          console.error("Error sending email receipt async:", err);
        });
      }

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
