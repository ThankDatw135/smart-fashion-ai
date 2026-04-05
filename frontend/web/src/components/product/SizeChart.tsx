"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Ruler } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SizeChart() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline">
          <Ruler className="h-4 w-4" />
          Hướng dẫn chọn size
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-4 text-center">Bảng Kích Cỡ</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="cm" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="cm">CM</TabsTrigger>
              <TabsTrigger value="inch">INCH</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="cm">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm text-center">
                <thead className="bg-muted/50 font-medium">
                  <tr>
                    <th className="py-3 px-4 border-b">Size</th>
                    <th className="py-3 px-4 border-b">Ngực (cm)</th>
                    <th className="py-3 px-4 border-b">Eo (cm)</th>
                    <th className="py-3 px-4 border-b">Mông (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">S</td>
                    <td className="py-3 px-4 text-muted-foreground">82 - 86</td>
                    <td className="py-3 px-4 text-muted-foreground">64 - 68</td>
                    <td className="py-3 px-4 text-muted-foreground">88 - 92</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">M</td>
                    <td className="py-3 px-4 text-muted-foreground">86 - 90</td>
                    <td className="py-3 px-4 text-muted-foreground">68 - 72</td>
                    <td className="py-3 px-4 text-muted-foreground">92 - 96</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">L</td>
                    <td className="py-3 px-4 text-muted-foreground">90 - 94</td>
                    <td className="py-3 px-4 text-muted-foreground">72 - 76</td>
                    <td className="py-3 px-4 text-muted-foreground">96 - 100</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">XL</td>
                    <td className="py-3 px-4 text-muted-foreground">94 - 98</td>
                    <td className="py-3 px-4 text-muted-foreground">76 - 80</td>
                    <td className="py-3 px-4 text-muted-foreground">100 - 104</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="inch">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm text-center">
                <thead className="bg-muted/50 font-medium">
                  <tr>
                    <th className="py-3 px-4 border-b">Size</th>
                    <th className="py-3 px-4 border-b">Ngực (in)</th>
                    <th className="py-3 px-4 border-b">Eo (in)</th>
                    <th className="py-3 px-4 border-b">Mông (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">S</td>
                    <td className="py-3 px-4 text-muted-foreground">32 - 34</td>
                    <td className="py-3 px-4 text-muted-foreground">25 - 27</td>
                    <td className="py-3 px-4 text-muted-foreground">35 - 36</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">M</td>
                    <td className="py-3 px-4 text-muted-foreground">34 - 35</td>
                    <td className="py-3 px-4 text-muted-foreground">27 - 28</td>
                    <td className="py-3 px-4 text-muted-foreground">36 - 38</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">L</td>
                    <td className="py-3 px-4 text-muted-foreground">35 - 37</td>
                    <td className="py-3 px-4 text-muted-foreground">28 - 30</td>
                    <td className="py-3 px-4 text-muted-foreground">38 - 39</td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">XL</td>
                    <td className="py-3 px-4 text-muted-foreground">37 - 39</td>
                    <td className="py-3 px-4 text-muted-foreground">30 - 31</td>
                    <td className="py-3 px-4 text-muted-foreground">39 - 41</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 p-4 bg-primary/5 rounded-lg text-sm text-muted-foreground">
          <p className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground">Mẹo nhỏ:</span> 
            Số đo có thể chênh lệch 1-2cm do quá trình đo lường thủ công.
          </p>
          <p>Nếu bạn phân vân giữa 2 size, chúng tôi khuyên bạn nên chọn size lớn hơn để thoải mái hơn.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
