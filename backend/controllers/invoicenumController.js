import moment from "moment";
import InvoiceNumber from "../models/InvoiceNumber.js";

export const getInvoiceNumber = async (req, res) => {
  try {
    const { type, id } = req.query; 
    if (!type || !id) {
      return res.status(400).json({ message: "Type and ID are required" });
    }
    if (!["customer", "supplier"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const today = moment().format("YYYYMMDD"); // Always save in YYYYMMDD

    // ✅ Updated Prefix
    const prefix = type === "customer" ? "ZFCC" : "ZFCS";

    const existingForThisRef = await InvoiceNumber.findOne({
      type,
      referenceId: id,
      date: today,
    });

    if (existingForThisRef) {
      return res.json({
        invoiceNumber: existingForThisRef.invoiceNumber,
        date: moment(existingForThisRef.date, "YYYYMMDD").format("YYYY-MM-DD"),
      });
    }

    const lastToday = await InvoiceNumber
      .findOne({ type, date: today })
      .sort({ serial: -1 })
      .select("serial");

    const nextSerial = (lastToday?.serial || 0) + 1;
    const sequence = String(nextSerial).padStart(4, "0");
    const newInvoiceNumber = `${prefix}-${today}-${sequence}`;

    const doc = new InvoiceNumber({
      type,
      referenceId: id,
      invoiceNumber: newInvoiceNumber,
      serial: nextSerial,
      date: today,
    });

    await doc.save();

    return res.json({ 
      invoiceNumber: newInvoiceNumber,
      date: moment(today, "YYYYMMDD").format("YYYY-MM-DD"),
    });
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return res.status(500).json({ message: "Error generating invoice number" });
  }
};
