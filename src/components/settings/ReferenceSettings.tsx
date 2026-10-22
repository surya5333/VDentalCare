"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2 } from "lucide-react";

export function ReferenceSettings() {
  const [data, setData] = useState<{ id: string; name: string; isActive: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/references?includeInactive=true");
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
    fetch("/api/references?includeInactive=true")
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
    if (!newName.trim()) return;
    try {
      await fetch("/api/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await fetch(`/api/references/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      setEditingId(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this reference?")) return;
    try {
      await fetch(`/api/references/${id}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await fetch(`/api/references/${id}`, {
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
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New Reference Name"
          className="px-4 py-2 border rounded-lg flex-1 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          required
        />
        <button type="submit" className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90">
          Add Reference
        </button>
      </form>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-gray-500">No references found.</td>
              </tr>
            )}
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-2 py-1 border rounded w-full"
                    />
                  ) : (
                    <span className={item.isActive ? "" : "text-gray-400 line-through"}>{item.name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
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
                      <button onClick={() => { setEditingId(item.id); setEditName(item.name); }} className="text-blue-600 hover:text-blue-800">
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
