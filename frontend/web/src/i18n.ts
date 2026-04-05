import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "vi"; // Mặc định tiếng Việt, sẽ mở rộng locale detection sau

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
