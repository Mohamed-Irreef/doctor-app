import { Edit, PackageOpen, Pill, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import Input from "../components/Input";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import {
    createAdminMedicine,
    deleteAdminMedicine,
    getAdminMedicines,
} from "../services/api";

const PREVIEW_IMAGES = [
  "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=250&q=80",
  "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=250&q=80",
];

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", tone: "info" });

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const load = async () => {
      const response = await getAdminMedicines();
      if (response.data) setMedicines(response.data);
    };
    load();
  }, []);

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(
      () => setToast({ message: "", tone: "info" }),
      2400,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const handleAdd = async (event) => {
    event.preventDefault();

    const stockValue = parseInt(stock, 10);

    const response = await createAdminMedicine({
      name,
      category,
      price: parseInt(price, 10),
      stock: stockValue,
      description: "",
      prescriptionRequired: false,
      active: true,
    });

    if (response.data) {
      setMedicines((prev) => [response.data, ...prev]);
    }
    setIsAddOpen(false);
    setName("");
    setPrice("");
    setStock("");
    setCategory("");
    setToast({ message: "Medicine added to inventory.", tone: "success" });
  };

  const handleDelete = async (id) => {
    await deleteAdminMedicine(id);
    setMedicines((prev) => prev.filter((medicine) => medicine._id !== id));
    setToast({ message: "Medicine removed from inventory.", tone: "danger" });
  };

  const lowStockItems = useMemo(
    () => medicines.filter((medicine) => medicine.stock < 50),
    [medicines],
  );

  const columns = [
    {
      header: "Medicine Name",
      accessor: "name",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.name}</p>
          <p className="text-xs text-slate-500">{row.category}</p>
        </div>
      ),
    },
    { header: "Category", accessor: "category" },
    {
      header: "Price",
      accessor: "price",
      render: (row) => <span className="font-semibold">₹{row.price}</span>,
    },
    {
      header: "Stock",
      accessor: "stock",
      render: (row) => (
        <span
          className={`font-mono ${row.stock < 50 ? "font-bold text-rose-600" : "text-slate-600"}`}
        >
          {row.stock} units
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "inStock",
      render: (row) => (
        <Badge variant={row.inStock ? "success" : "danger"}>
          {row.inStock ? "In Stock" : "Out of Stock"}
        </Badge>
      ),
    },
    {
      header: "Rx Req.",
      accessor: "prescriptionRequired",
      render: (row) =>
        row.prescriptionRequired ? (
          <Badge variant="warning">Yes</Badge>
        ) : (
          <span className="px-2 text-slate-400">No</span>
        ),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Edit medicine"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit size={16} />
          </button>
          <button
            type="button"
            title="Delete medicine"
            onClick={() => handleDelete(row._id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Inventory"
        description={`Manage ${medicines.length} medicines and healthcare products.`}
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            Add Medicine
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PREVIEW_IMAGES.map((image, index) => (
          <article key={image} className="panel-card overflow-hidden">
            <img
              src={image}
              alt="Product preview"
              className="h-28 w-full object-cover"
            />
            <div className="space-y-1 p-4">
              <p className="text-sm font-bold text-slate-900">
                Featured Product Slot {index + 1}
              </p>
              <p className="text-xs text-slate-500">
                Use for banner-level pharmacy promotions.
              </p>
            </div>
          </article>
        ))}
      </div>

      <DataTable
        title="Inventory Ledger"
        description="Track stock levels, pricing, and prescription constraints."
        columns={columns}
        data={medicines}
        searchable={true}
        itemsPerPage={10}
        activeFilters={
          lowStockItems.length > 0 ? [`Low stock: ${lowStockItems.length}`] : []
        }
        toolbar={
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
            <PackageOpen size={14} />
            {lowStockItems.length} low stock items
          </div>
        }
      />

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Medicine"
        className="max-w-xl"
      >
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs font-semibold text-slate-500">
            Added products appear in pharmacy listings and are available for
            order placement.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Medicine Name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Paracetamol 500mg"
              className="sm:col-span-2"
            />
            <Input
              label="Category"
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. Pain Relief"
            />
            <Input
              label="Price (₹)"
              required
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0"
            />
            <Input
              label="Initial Stock"
              required
              type="number"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              placeholder="0"
              className="sm:col-span-2"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="secondary" className="flex-1">
              Save Medicine
            </Button>
          </div>
        </form>
      </Modal>

      <Toast
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast({ message: "", tone: "info" })}
      />

      <div className="panel-card flex items-center gap-3 px-4 py-3 text-sm text-slate-600">
        <Pill size={16} className="text-brand-teal" />
        Inventory sync status: healthy
      </div>
    </div>
  );
}
