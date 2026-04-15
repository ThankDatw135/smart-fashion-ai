"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ContentManagerPage() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  const [textVal, setTextVal] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/content");
      const json = await res.json();
      if (json.data) {
        setContent(json.data);
      }
    } catch (e) {
      toast.error("Failed to load content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (content && content[activeTab]) {
      setTextVal(JSON.stringify(content[activeTab], null, 2));
    }
  }, [content, activeTab]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const parsedData = JSON.parse(textVal);
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: activeTab, data: parsedData })
      });
      if (res.ok) {
        toast.success("Đã cập nhật nội dung thành công!");
        setContent((prev: any) => ({ ...prev, [activeTab]: parsedData }));
      } else {
        toast.error("Lỗi cập nhật.");
      }
    } catch (e) {
      toast.error("Dữ liệu JSON không hợp lệ.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center">Đang tải cấu hình...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Nội Dung Tĩnh (CMS)</h1>
        <p className="text-muted-foreground mt-1">Quản lý và chỉnh sửa nội dung giới thiệu, liên hệ, chính sách.</p>
      </div>

      <div className="flex gap-2">
        {["about", "contact", "policies"].map(tab => (
          <Button 
            key={tab} 
            variant={activeTab === tab ? "default" : "outline"} 
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
        <label className="text-sm font-medium">Chỉnh sửa JSON Data nhanh:</label>
        <Textarea 
          value={textVal} 
          onChange={(e) => setTextVal(e.target.value)} 
          className="min-h-[400px] font-mono text-sm leading-relaxed" 
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
        </Button>
      </div>
    </div>
  );
}
