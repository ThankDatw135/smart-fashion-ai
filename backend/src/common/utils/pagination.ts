/**
 * Helper phân trang cursor-based — encode/decode cursor
 * Dùng base64 để client không cần biết internal ID
 */
export function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

/**
 * Tạo response phân trang chuẩn từ kết quả query
 */
export function buildPaginationResponse<T extends { id: string }>(
  items: T[],
  limit: number,
) {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && data.length > 0
    ? encodeCursor(data[data.length - 1].id)
    : null;

  return {
    data,
    meta: {
      hasMore,
      nextCursor,
    },
  };
}
