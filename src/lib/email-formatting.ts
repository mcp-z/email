export function buildContentForItems(items: Array<Record<string, unknown>>) {
  return items.map((entry) => ({
    type: 'text' as const,
    text: JSON.stringify(entry),
    subject: String(entry.subject ?? ''),
    from: String(entry.from ?? ''),
  }));
}
