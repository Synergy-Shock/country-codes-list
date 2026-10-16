// Playground for country-codes-list. Runs the published package from jsDelivr.
// Every value from the dataset or the user goes into the DOM through textContent
// or DOM properties, never through innerHTML.

const PKG_URL = "https://cdn.jsdelivr.net/npm/country-codes-list@3/+esm";
const $ = (sel) => document.querySelector(sel);
const q = JSON.stringify; // JS string literal for snippets

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}

// "EUR €", or just "CHF" when the symbol falls back to the code.
const fmtCurrency = (c) => (c.currencySymbol && c.currencySymbol !== c.currencyCode ? `${c.currencyCode} ${c.currencySymbol}` : c.currencyCode);

// ---------- Snippet panel ----------
function showSnippet(code, output = "") {
  $("#snippet-code").textContent = `const countryCodes = require("country-codes-list");\n\n${code}`;
  $("#snippet-out").textContent = output ? `// → ${output}` : "";
}

// ---------- Copy buttons ----------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-copy]");
  if (!btn) return;
  const text = $(btn.dataset.copy).textContent;
  const label = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied";
  } catch {
    btn.textContent = "Copy failed";
  }
  setTimeout(() => (btn.textContent = label), 1500);
});

let cc;
try {
  cc = await import(PKG_URL);
} catch (err) {
  $("#status").textContent = `Could not load the package from jsDelivr (${err.message}). Check your connection and reload.`;
  $("#status").classList.add("error");
  throw err;
}

const all = cc.all();
$("#status").textContent = `Loaded country-codes-list from jsDelivr: ${all.length} records.`;
$("#status").classList.add("sr-only");
document.querySelectorAll("[disabled]").forEach((n) => (n.disabled = false));

// ---------- Record dialog ----------
const dialog = $("#record");
function openRecord(code) {
  const c = cc.findOneByCode(code);
  $("#record-title").textContent = `${c.flag} ${c.countryNameEn}`;
  $("#record-json").textContent = JSON.stringify(c, null, 2);
  showSnippet(`countryCodes.findOneByCode(${q(code)});`, `{ countryNameEn: ${q(c.countryNameEn)}, … }`);
  dialog.showModal();
}
$("#record-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close(); // click on the backdrop
});

// ---------- findOneByCode ----------
const FIELDS = [
  ["countryCode", "Alpha-2"],
  ["countryCodeAlpha3", "Alpha-3"],
  ["countryCodeNumeric", "Numeric"],
  ["countryCallingCode", "Calling code", (v) => `+${v}`],
  ["currencyCode", "Currency", (v, c) => (v ? fmtCurrency(c) : "")],
  ["officialLanguageNameEn", "Language"],
  ["region", "Region"],
  ["tinName", "Tax ID"],
];

function lookup() {
  const code = $("#lookup-input").value.trim();
  const out = $("#lookup-result");
  out.replaceChildren();
  if (!code) {
    out.append(el("p", { className: "hint", textContent: "Type a code, for example GB, GBR or 826." }));
    showSnippet(`countryCodes.findOneByCode("GB");`);
    return;
  }
  const c = cc.findOneByCode(code);
  showSnippet(`countryCodes.findOneByCode(${q(code)});`, c ? `{ countryCode: ${q(c.countryCode)}, countryNameEn: ${q(c.countryNameEn)}, … }` : "undefined");
  if (!c) {
    out.append(el("p", { className: "bad", textContent: `No country for “${code}”.${/^\d{1,2}$/.test(code) ? " Numeric codes need three digits (“032”, not “32”)." : ""}` }));
    return;
  }
  const dl = el("dl", { className: "facts" });
  for (const [key, label, fmt] of FIELDS) {
    const v = fmt ? fmt(c[key], c) : c[key];
    if (v) dl.append(el("div", {}, el("dt", { textContent: label }), el("dd", { textContent: v })));
  }
  const why = c.countryCode === code.toUpperCase() ? "" : ` (resolved from “${code}”)`;
  out.append(
    el("p", { className: "found" }, el("span", { className: "flag", textContent: c.flag }), ` ${c.countryNameEn}${why}`),
    dl,
    el("button", { type: "button", className: "link", textContent: "Show full record", onclick: () => openRecord(c.countryCode) }),
  );
}
$("#lookup-input").addEventListener("input", lookup);
$("#lookup-form").addEventListener("submit", (e) => e.preventDefault());
document.querySelectorAll("[data-try]").forEach((b) =>
  b.addEventListener("click", () => {
    $("#lookup-input").value = b.dataset.try;
    lookup();
  }),
);

// ---------- Phone length checker ----------
const sel = $("#phone-country");
for (const o of cc.customArray({ label: "{flag} {countryNameEn} (+{countryCallingCode})", value: "{countryCode}" }, { sortBy: "label" })) {
  sel.append(new Option(o.label, o.value));
}
sel.value = "GB";

function checkPhone() {
  const code = sel.value;
  const raw = $("#phone-number").value;
  const c = cc.findOneByCode(code);
  const digits = raw.replace(/\D/g, "");
  const lengths = c.nationalNumberLengths;
  const ok = lengths.includes(digits.length);
  const out = $("#phone-result");
  out.replaceChildren();
  showSnippet(
    `const { nationalNumberLengths } = countryCodes.findOneByCode(${q(code)});\n` +
      `const digits = ${q(raw)}.replace(/\\D/g, "");\n` +
      `nationalNumberLengths.includes(digits.length);`,
    `${ok}  (lengths: [${lengths.join(", ")}], digits: ${digits.length})`,
  );
  if (!digits) {
    out.append(el("p", { className: "hint", textContent: "Type the number without the +country code." }));
    return;
  }
  if (!lengths.length) {
    out.append(el("p", { className: "warn", textContent: `${c.countryNameEn} has no recorded lengths. An empty list means “not recorded”, not “any length”.` }));
    return;
  }
  const list = lengths.join(" or ");
  out.append(
    el("p", { className: ok ? "good" : "bad" },
      ok ? `✓ ${digits.length} digits is a possible length for ${c.countryNameEn}.` : `✗ ${digits.length} digits. ${c.countryNameEn} numbers have ${list} digits.`),
  );
  // Trunk prefix: national formats often start with 0, which is not part of the national number.
  if (digits.startsWith("0") && lengths.includes(digits.length - 1)) {
    out.append(el("p", { className: "warn", textContent: `It starts with 0. That is usually a trunk prefix for local dialing. Without it the number has ${digits.length - 1} digits, which is valid. Strip the trunk prefix, keep the area code.` }));
  } else if (digits.startsWith(c.countryCallingCode) && lengths.includes(digits.length - c.countryCallingCode.length)) {
    out.append(el("p", { className: "warn", textContent: `It looks like it includes the calling code ${c.countryCallingCode}. Remove it and count only the national number.` }));
  }
}
sel.addEventListener("change", checkPhone);
$("#phone-number").addEventListener("input", checkPhone);
$("#phone-form").addEventListener("submit", (e) => e.preventDefault());

// ---------- Table ----------
const COLS = [
  ["countryNameEn", "Country"],
  ["countryCode", "Alpha-2"],
  ["countryCodeAlpha3", "Alpha-3"],
  ["countryCodeNumeric", "Num."],
  ["countryCallingCode", "Calling"],
  ["currencyCode", "Currency"],
  ["currencyDecimals", "Dec."],
  ["officialLanguageCode", "Lang."],
  ["region", "Region"],
  ["tinName", "Tax ID"],
];
let sortKey = "countryNameEn";
let sortDir = 1;

const head = $("#table-head");
for (const [key, label] of COLS) {
  const th = el("th", { scope: "col" }, el("button", { type: "button", textContent: label, onclick: () => setSort(key) }));
  th.dataset.key = key;
  head.append(th);
}

const unique = (key) => [...new Set(all.map((c) => c[key]).filter(Boolean))].sort();
for (const r of unique("region")) $("#f-region").append(new Option(r, r));
for (const code of unique("currencyCode")) {
  const name = all.find((c) => c.currencyCode === code).currencyNameEn;
  $("#f-currency").append(new Option(`${code} · ${name}`, code));
}

function setSort(key) {
  sortDir = key === sortKey ? -sortDir : 1;
  sortKey = key;
  renderTable();
}

function renderTable() {
  const term = $("#f-search").value.trim().toLowerCase();
  const region = $("#f-region").value;
  const currency = $("#f-currency").value;

  // Build the snippet from the same filters the table uses.
  let base = "countryCodes.all()";
  const steps = [];
  if (region && !currency) base = `countryCodes.filter("region", ${q(region)})`;
  else if (currency && !region) base = `countryCodes.filter("currencyCode", ${q(currency)})`;
  else if (region && currency) {
    base = `countryCodes.filter("region", ${q(region)})`;
    steps.push(`.filter((c) => c.currencyCode === ${q(currency)})`);
  }
  if (term) steps.push(`.filter((c) => c.countryNameEn.toLowerCase().includes(${q(term)}) ||\n    [c.countryCode, c.countryCodeAlpha3, c.countryCodeNumeric].includes(${q(term.toUpperCase())}))`);
  const cmp = typeof all[0][sortKey] === "number" ? `(a.${sortKey} ?? -1) - (b.${sortKey} ?? -1)` : `a.${sortKey}.localeCompare(b.${sortKey})`;
  steps.push(`.sort((a, b) => ${sortDir === 1 ? cmp : `-(${cmp})`})`);

  const rows = all
    .filter((c) => !region || c.region === region)
    .filter((c) => !currency || c.currencyCode === currency)
    .filter((c) => !term || c.countryNameEn.toLowerCase().includes(term) ||
      [c.countryCode, c.countryCodeAlpha3, c.countryCodeNumeric].includes(term.toUpperCase()))
    .sort((a, b) => {
      const x = a[sortKey], y = b[sortKey];
      const d = typeof x === "number" || typeof y === "number" ? (x ?? -1) - (y ?? -1) : String(x).localeCompare(String(y));
      return d * sortDir;
    });

  const body = $("#table-body");
  body.replaceChildren(...rows.map((c) => {
    const tr = el("tr");
    tr.addEventListener("click", (e) => {
      if (!e.target.closest("button")) openRecord(c.countryCode);
    });
    tr.append(
      el("th", { scope: "row" }, el("button", { type: "button", className: "name", onclick: () => openRecord(c.countryCode) },
        el("span", { className: "flag", textContent: c.flag, ariaHidden: "true" }), ` ${c.countryNameEn}`)),
      el("td", { className: "mono", textContent: c.countryCode }),
      el("td", { className: "mono", textContent: c.countryCodeAlpha3 }),
      el("td", { className: "mono", textContent: c.countryCodeNumeric || "—" }),
      el("td", { className: "mono", textContent: `+${c.countryCallingCode}` }),
      el("td", { textContent: c.currencyCode ? fmtCurrency(c) : "—" }),
      el("td", { className: "mono", textContent: c.currencyDecimals ?? "—" }),
      el("td", { className: "mono", textContent: c.officialLanguageCode, title: c.officialLanguageNameEn }),
      el("td", { textContent: c.region }),
      el("td", { textContent: c.tinName || "—" }),
    );
    return tr;
  }));

  for (const th of head.children) {
    th.setAttribute("aria-sort", th.dataset.key === sortKey ? (sortDir === 1 ? "ascending" : "descending") : "none");
  }
  $("#table-count").textContent = `${rows.length} of ${all.length} countries`;
  showSnippet(`${base}\n  ${steps.join("\n  ")};`, `${rows.length} countries`);
}
$("#table-filters").addEventListener("input", renderTable);
$("#table-filters").addEventListener("change", renderTable); // some tools only fire change on <select>
$("#table-filters").addEventListener("submit", (e) => e.preventDefault());

renderTable();
checkPhone();
lookup(); // last, so the first snippet shown is the lookup
