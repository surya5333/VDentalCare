"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2 } from "lucide-react";

interface SettingsCrownType {
  id: string;
  name: string;
  patientPrice: number;
  labPrice: number;
  isActive: boolean;
}

export function CrownTypeSettings() {
  const [data, setData] = useState<SettingsCrownType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SettingsCrownType>>({});
  
  const [newData, setNewData] = useState({
    name: "",
    patientPrice: "",
    labPrice: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crown-types?includeInactive=true");
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/crown-types?includeInactive=true")
      .then((res) => res.json())
      .then((d) => {
        if (!ignore) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => console.error(e));

    return () => {
      ignore = true;
    };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData.name.trim() || !newData.patientPrice || !newData.labPrice) return;
    try {
      await fetch("/api/crown-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newData.name.trim(),
          patientPrice: parseInt(newData.patientPrice, 10),
          labPrice: parseInt(newData.labPrice, 10)
        }),
      });
      setNewData({ name: "", patientPrice: "", labPrice: "" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editData.name?.trim()) return;
    try {
      await fetch(`/api/crown-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name.trim(),
          patientPrice: editData.patientPrice,
          labPrice: editData.labPrice
        }),
      });
      setEditingId(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this crown type?")) return;
    try {
      await fetch(`/api/crown-types/${id}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await fetch(`/api/crown-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading...</div>;

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-4 mb-6 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input
            type="text"
            value={newData.name}
            onChange={(e) => setNewData({ ...newData, name: e.target.value })}
            placeholder="Crown Type Name"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            required
          />
        </div>
        <div className="w-32">
          <label className="block text-sm text-gray-600 mb-1">Patient Price (₹)</label>
          <input
            type="number"
            value={newData.patientPrice}
            onChange={(e) => setNewData({ ...newData, patientPrice: e.target.value })}
            required
            min="0"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          />
        </div>
        <div className="w-32">
          <label className="block text-sm text-gray-600 mb-1">Lab Price (₹)</label>
          <input
            type="number"
            value={newData.labPrice}
            onChange={(e) => setNewData({ ...newData, labPrice: e.target.value })}
            required
            min="0"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          />
        </div>
        <button type="submit" className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 h-[42px]">
          Add
        </button>
      </form>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium text-right">Patient Price (₹)</th>
              <th className="px-4 py-3 font-medium text-right">Lab Price (₹)</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500">No crown types found.</td>
              </tr>
            )}
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editData.name || ""}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="px-2 py-1 border rounded w-full"
                    />
                  ) : (
                    <span className={item.isActive ? "" : "text-gray-400 line-through"}>{item.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editData.patientPrice ?? ""}
                      onChange={(e) => setEditData({ ...editData, patientPrice: e.target.value ? parseInt(e.target.value, 10) : 0 })}
                      className="px-2 py-1 border rounded w-20 text-right"
                    />
                  ) : (
                    `₹${item.patientPrice.toLocaleString('en-IN')}`
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editData.labPrice ?? ""}
                      onChange={(e) => setEditData({ ...editData, labPrice: e.target.value ? parseInt(e.target.value, 10) : 0 })}
                      className="px-2 py-1 border rounded w-20 text-right"
                    />
                  ) : (
                    `₹${item.labPrice.toLocaleString('en-IN')}`
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === item.id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleUpdate(item.id)} className="text-green-600 hover:underline">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline">Cancel</button>
                    </div>
                  ) : item.isActive ? (
                    <div className="flex justify-end gap-3">
                      <button onClick={() => { setEditingId(item.id); setEditData(item); }} className="text-blue-600 hover:text-blue-800">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800" title="Deactivate">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleActivate(item.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium">
                        Activate
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
