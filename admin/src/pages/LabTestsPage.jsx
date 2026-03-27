import { Edit, Plus, TestTube2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import Input from "../components/Input";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import { LAB_TESTS } from "../data/mockData";

export default function LabTestsPage() {
  const [tests, setTests] = useState(LAB_TESTS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", tone: "info" });

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = setTimeout(
      () => setToast({ message: "", tone: "info" }),
      2400,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const handleAdd = (event) => {
    event.preventDefault();

    const numericPrice = parseInt(price, 10);

    const newTest = {
      id: `l${Date.now()}`,
      name,
      category,
      price: numericPrice,
      originalPrice: numericPrice + 200,
      discount: numericPrice > 0 ? "15%" : "0%",
      turnaround: "24 hrs",
      popular: false,
    };

    setTests((prev) => [newTest, ...prev]);
    setIsAddOpen(false);
    setName("");
    setPrice("");
    setCategory("");
    setToast({ message: "Lab test added successfully.", tone: "success" });
  };

  const handleDelete = (id) => {
    setTests((prev) => prev.filter((test) => test.id !== id));
    setToast({ message: "Lab test removed from catalog.", tone: "danger" });
  };

  const categories = useMemo(
    () => [...new Set(tests.map((test) => test.category))].slice(0, 4),
    [tests],
  );

  const columns = [
    {
      header: "Test Name",
      accessor: "name",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.name}</p>
          <p className="text-xs text-slate-500">{row.category}</p>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      render: (row) => <Badge>{row.category}</Badge>,
    },
    {
      header: "Price",
      accessor: "price",
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">₹{row.price}</span>
          <span className="ml-2 text-xs text-slate-400 line-through">
            ₹{row.originalPrice}
          </span>
        </div>
      ),
    },
    {
      header: "Discount",
      accessor: "discount",
      render: (row) => (
        <span className="font-semibold text-emerald-600">
          {row.discount} Off
        </span>
      ),
    },
    { header: "Turnaround", accessor: "turnaround" },
    {
      header: "Popular",
      accessor: "popular",
      render: (row) =>
        row.popular ? (
          <Badge variant="primary">Popular</Badge>
        ) : (
          <span className="px-1 text-slate-400">-</span>
        ),
    },
    {
      header: "Actions",
      accessor: "id",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Edit test"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit size={16} />
          </button>
          <button
            type="button"
            title="Delete test"
            onClick={() => handleDelete(row.id)}
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
        title="Lab Tests Catalog"
        description={`Manage ${tests.length} diagnostic tests available for platform booking.`}
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            Add New Test
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <article
            key={category}
            className="panel-card flex items-center gap-3 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <TestTube2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{category}</p>
              <p className="text-xs text-slate-500">Category segment</p>
            </div>
          </article>
        ))}
      </div>

      <DataTable
        title="Diagnostics Inventory"
        description="Monitor pricing, discounting, and turnaround windows."
        columns={columns}
        data={tests}
        searchable={true}
        itemsPerPage={10}
        toolbar={
          <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 ring-1 ring-teal-200">
            Catalog synced
          </span>
        }
      />

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Lab Test"
        className="max-w-xl"
      >
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs font-semibold text-slate-500">
            New test records become available in patient booking flow
            immediately after save.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Test Name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Vitamin D3"
              className="sm:col-span-2"
            />
            <Input
              label="Category"
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. Vitamins"
            />
            <Input
              label="Price (₹)"
              required
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0"
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
            <Button type="submit" className="flex-1">
              Add Test
            </Button>
          </div>
        </form>
      </Modal>

      <Toast
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast({ message: "", tone: "info" })}
      />
    </div>
  );
}
