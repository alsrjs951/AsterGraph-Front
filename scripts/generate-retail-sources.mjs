import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

// Point ARTIFACT_MODULES to a node_modules directory containing @oai/artifact-tool.
const requireArtifact = createRequire(
  resolve(process.env.ARTIFACT_MODULES ?? "node_modules", "../package.json"),
);
const { Workbook, SpreadsheetFile } = requireArtifact("@oai/artifact-tool");
const data = JSON.parse(
  await readFile(
    new URL("../src/features/retail/dossier.json", import.meta.url),
    "utf8",
  ),
);
const output = new URL("../public/retail/", import.meta.url);
await mkdir(output, { recursive: true });
for (const table of [data.products, data.changes, data.stores]) {
  const csv = [table.headers, ...table.rows]
    .map((row) =>
      row.map((cell) => '"' + cell.replaceAll('"', '""') + '"').join(","),
    )
    .join("\r\n");
  await writeFile(new URL(table.file, output), "\uFEFF" + csv + "\r\n");
}

const workbook = Workbook.create();
const events = data.events;
const sheet = workbook.worksheets.add(events.sheet);
sheet.getRangeByIndexes(
  0,
  0,
  events.rows.length + 1,
  events.headers.length,
).values = [events.headers, ...events.rows];
sheet.getRange("A1:E1").format.fill = "#2458C6";
sheet.getRange("A1:E1").format.font.color = "#FFFFFF";
sheet.getRange("A1:E1").format.font.bold = true;
sheet.getRange("A:E").format.columnWidth = 22;
const spreadsheet = await SpreadsheetFile.exportXlsx(workbook);
await spreadsheet.save(
  decodeURIComponent(new URL(events.file, output).pathname),
);
await rm(new URL(events.file + ".inspect.ndjson", output), { force: true });

const [id, name, supplier] = data.products.rows.find(
  (row) => row[0] === data.notice.productId,
);
const [, date, status] = data.changes.rows
  .filter((row) => row[0] === id)
  .sort((a, b) => a[1].localeCompare(b[1]))
  .at(-1);
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const fields = [
  ["대상 상품", name],
  ["상품 ID", id],
  ["적용일", date],
  ["납품 상태", status],
];
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html lang="ko"><meta charset="utf-8"><style>
    @page{size:A4;margin:28mm 23mm}body{font:12pt/1.7 "Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#17263c}
    header,footer{border-top:2px solid #2458c6;padding:12px 0;color:#42546c}
    h1{margin:48px 0 8px;font-size:28pt}table{border-collapse:collapse;width:100%;margin:28px 0}
    td,th{padding:10px;text-align:left;border-bottom:1px solid #ccd7e4}th{background:#eff3f8;width:30%}
    footer{margin-top:70px;font-size:10pt}</style>
    <header>LINK MARKET &nbsp; / &nbsp; 공급사 수신 공문</header><h1>${escape(status)} 안내</h1>
    <p>${escape(supplier)} &nbsp; · &nbsp; 문서번호 ${escape(data.notice.id)}</p>
    <table>${fields.map(([key, value]) => `<tr><th>${key}</th><td>${escape(value)}</td></tr>`).join("")}</table>
    <h3>중단 사유</h3><p>${escape(data.notice.reason)}</p><p>해당 상품을 사용하는 행사 운영 일정을 확인해 주시기 바랍니다.</p>
    <footer>AsterGraph 졸업작품 시연용 가상 문서 &nbsp; · &nbsp; 1 / 1</footer></html>`);
  await page.pdf({
    path: decodeURIComponent(new URL(data.notice.file, output).pathname),
    preferCSSPageSize: true,
    printBackground: true,
  });
} finally {
  await browser.close();
}
