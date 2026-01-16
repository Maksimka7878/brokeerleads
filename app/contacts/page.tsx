"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import api from "@/lib/api";
import { Upload } from "lucide-react";

export default function ContactsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await api.get("/leads");
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/import", formData);
      alert("Импорт завершен успешно!");
      fetchLeads();
    } catch (err: any) {
      console.error(err);
      // Simplify error message for user
      const message = err.response?.data?.detail || "Ошибка импорта";
      const userMessage = message.includes("InvalidTextRepresentation") 
        ? "Ошибка в данных файла: проверьте, что в колонках правильные типы данных (числа, текст)."
        : `Ошибка: ${message}`;
      alert(userMessage);
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">База контактов</h2>
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx"
              onChange={handleImport}
            />
            <label
              htmlFor="file-upload"
              className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg flex items-center hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Импорт Excel
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Имя / Username</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Телефон</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Этап</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата создания</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{lead.full_name || "Не указано"}</div>
                    <div className="text-sm text-blue-500">@{lead.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{lead.phone || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      lead.stage === "Заключение сделки" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {lead.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-500">
              База контактов пуста. Импортируйте данные из Excel.
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
