export function escapeCsvCell(value) {
  let text = value == null ? "" : String(value);
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  // Neutralize spreadsheet formulas, including leading whitespace and fullwidth prefixes.
  if (typeof value === "string" && (/^\s*[=+\-@＝＋－＠]/u.test(text) || /^[\t\r\n]/.test(text))) text = `\t${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  const csvContent = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
