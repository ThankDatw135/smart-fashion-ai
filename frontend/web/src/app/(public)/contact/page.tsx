import { Metadata } from "next";
import ContactClient from "./ContactClient";
import { getStaticContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Liên hệ | Antigravity Store",
  description: "Trang liên hệ bộ phận hỗ trợ khách hàng",
};

export default function ContactPage() {
  const content = getStaticContent().contact || {};

  return <ContactClient content={content} />;
}
