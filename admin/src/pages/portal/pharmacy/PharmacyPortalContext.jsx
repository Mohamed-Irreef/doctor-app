/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useMemo, useState } from "react";
import {
    createPharmacyPartnerMedicine,
    deletePharmacyPartnerMedicine,
    getPharmacyPartnerDashboard,
    getPharmacyPartnerMedicines,
    getPharmacyPartnerOrders,
    updatePharmacyPartnerMedicine,
    updatePharmacyPartnerOrderStatus,
} from "../../../services/api";

const ORDER_FLOW = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
];

const EMPTY_FORM = {
  name: "",
  genericName: "",
  category: "",
  subcategory: "",
  brand: "",
  composition: "",
  description: "",
  image: "",
  pdfUrl: "",
  gallery: [],
  manufacturer: "",
  packSize: "",
  dosageForm: "",
  strength: "",
  gstPercent: 12,
  finalPrice: 0,
  discountPercent: 0,
  batchNumber: "",
  expiryDate: "",
  manufactureDate: "",
  storageConditions: "",
  indications: "",
  dosageInstructions: "",
  sideEffects: "",
  precautions: "",
  drugInteractions: "",
  contraindications: "",
  keywords: "",
  tags: "",
  slug: "",
  scheduleType: "otc",
  status: "draft",
  featured: false,
  minOrderQuantity: 1,
  maxOrderQuantity: 20,
  price: 0,
  mrp: 0,
  stock: 0,
  lowStockThreshold: 10,
  deliveryEtaHours: 24,
  prescriptionRequired: false,
  usageInstructions: "",
};

const toStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const PharmacyPortalContext = createContext(null);

export function PharmacyPortalProvider({ children }) {
  const [dashboard, setDashboard] = useState({});
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [medicinesError, setMedicinesError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    setDashboardError("");
    setMedicinesError("");
    setOrdersError("");
    setLoadingDashboard(true);
    setLoadingMedicines(true);
    setLoadingOrders(true);

    const [d, m, o] = await Promise.all([
      getPharmacyPartnerDashboard(),
      getPharmacyPartnerMedicines(),
      getPharmacyPartnerOrders(),
    ]);

    if (d.status === "success") {
      setDashboard(d.data || {});
    } else {
      setDashboardError(d.error || "Unable to load dashboard");
      setError((prev) => prev || d.error || "Unable to load dashboard");
    }

    if (m.status === "success") {
      setMedicines(m.data || []);
    } else {
      setMedicinesError(m.error || "Unable to load medicines");
      setError((prev) => prev || m.error || "Unable to load medicines");
    }

    if (o.status === "success") {
      setOrders(o.data || []);
    } else {
      setOrdersError(o.error || "Unable to load orders");
      setError((prev) => prev || o.error || "Unable to load orders");
    }

    setLoadingDashboard(false);
    setLoadingMedicines(false);
    setLoadingOrders(false);
    setLoading(false);
  };

  const lowStockItems = useMemo(
    () =>
      medicines.filter(
        (item) =>
          Number(item.stock || 0) <= Number(item.lowStockThreshold || 10),
      ),
    [medicines],
  );

  const pendingOrders = useMemo(
    () =>
      orders.filter(
        (item) =>
          !["delivered", "cancelled"].includes(
            String(item.status).toLowerCase(),
          ),
      ),
    [orders],
  );

  const selectMedicine = (item) => {
    setEditingId(item._id);
    setForm({
      ...EMPTY_FORM,
      ...item,
      price: Number(item.price || 0),
      mrp: Number(item.mrp || item.price || 0),
      stock: Number(item.stock || 0),
      lowStockThreshold: Number(item.lowStockThreshold || 10),
      deliveryEtaHours: Number(item.deliveryEtaHours || 24),
      discountPercent: Number(item.discountPercent || 0),
      minOrderQuantity: Number(item.minOrderQuantity || 1),
      maxOrderQuantity: Number(item.maxOrderQuantity || 20),
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      keywords: Array.isArray(item.keywords) ? item.keywords.join(", ") : "",
      sideEffects: Array.isArray(item.sideEffects)
        ? item.sideEffects.join("\n")
        : "",
      contraindications: Array.isArray(item.contraindications)
        ? item.contraindications.join("\n")
        : "",
      drugInteractions: Array.isArray(item.drugInteractions)
        ? item.drugInteractions.join("\n")
        : "",
      pdfUrl: item.pdfUrl || "",
    });
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const submitMedicine = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      name: form.name,
      genericName: form.genericName || undefined,
      category: form.category,
      subcategory: form.subcategory || undefined,
      brand: form.brand || undefined,
      composition: form.composition || undefined,
      dosageForm: form.dosageForm || undefined,
      strength: form.strength || undefined,
      manufacturer: form.manufacturer || undefined,
      packSize: form.packSize || undefined,
      batchNumber: form.batchNumber || undefined,
      expiryDate: form.expiryDate || undefined,
      manufactureDate: form.manufactureDate || undefined,
      storageInstructions: form.storageConditions || undefined,
      usageInstructions: form.usageInstructions || undefined,
      indications: form.indications || undefined,
      dosageInstructions: form.dosageInstructions || undefined,
      sideEffects: toStringArray(form.sideEffects),
      precautions: form.precautions || undefined,
      contraindications: toStringArray(form.contraindications),
      drugInteractions: toStringArray(form.drugInteractions),
      tags: toStringArray(form.tags),
      keywords: toStringArray(form.keywords),
      description: form.description || undefined,
      image: typeof form.image === "string" ? form.image : undefined,
      pdfUrl: typeof form.pdfUrl === "string" ? form.pdfUrl : undefined,
      mrp: Number(form.mrp || form.price),
      price: Number(form.price),
      discountPercent: Number(form.discountPercent || 0),
      gstPercent: Number(form.gstPercent || 0),
      finalPrice: Number(form.finalPrice || 0),
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold || 10),
      deliveryEtaHours: Number(form.deliveryEtaHours || 24),
      minOrderQuantity: Number(form.minOrderQuantity || 1),
      maxOrderQuantity: Number(form.maxOrderQuantity || 20),
      prescriptionRequired: Boolean(form.prescriptionRequired),
      slug: form.slug || undefined,
      scheduleType: form.scheduleType || undefined,
      featured: Boolean(form.featured),
    };

    const formData = new FormData();
    const appendField = (key, value) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
        return;
      }
      formData.append(key, value);
    };

    Object.entries(payload).forEach(([key, value]) => {
      appendField(key, value);
    });

    if (form.image instanceof File) {
      formData.append("medicineImageFile", form.image);
    } else if (form.image) {
      appendField("image", form.image);
    }

    if (form.pdfUrl instanceof File) {
      formData.append("medicinePdfFile", form.pdfUrl);
    } else if (form.pdfUrl) {
      appendField("pdfUrl", form.pdfUrl);
    }

    const response = editingId
      ? await updatePharmacyPartnerMedicine(editingId, formData)
      : await createPharmacyPartnerMedicine(formData);

    if (response.status === "error") {
      setError(response.error || "Unable to save medicine");
      return false;
    }

    resetForm();
    await load();
    return true;
  };

  const updateOrder = async (id, status) => {
    const response = await updatePharmacyPartnerOrderStatus(id, {
      status,
      note: `Status updated to ${status}`,
    });

    if (response.status === "error") {
      setError(response.error || "Unable to update order");
      return false;
    }

    await load();
    return true;
  };

  const removeMedicine = async (id) => {
    const response = await deletePharmacyPartnerMedicine(id);
    if (response.status === "error") {
      setError(response.error || "Unable to delete medicine");
      return false;
    }

    await load();
    return true;
  };

  const value = {
    dashboard,
    medicines,
    orders,
    form,
    setForm,
    editingId,
    error,
    loading,
    dashboardError,
    medicinesError,
    ordersError,
    loadingDashboard,
    loadingMedicines,
    loadingOrders,
    load,
    lowStockItems,
    pendingOrders,
    selectMedicine,
    resetForm,
    submitMedicine,
    removeMedicine,
    updateOrder,
    orderFlow: ORDER_FLOW,
  };

  return (
    <PharmacyPortalContext.Provider value={value}>
      {children}
    </PharmacyPortalContext.Provider>
  );
}

export function usePharmacyPortal() {
  const context = useContext(PharmacyPortalContext);
  if (!context) {
    throw new Error(
      "usePharmacyPortal must be used within PharmacyPortalProvider",
    );
  }
  return context;
}
