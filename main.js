import { loadMonthData, saveMonthData, clearMonthData } from "./storage.js";
import { computeTotals, formatCurrency, newEmptyRow } from "./logic.js";

const rowsContainer = document.getElementById("rows-container");
const summaryIncome = document.getElementById("summary-income");
const summaryExpense = document.getElementById("summary-expense");
const summaryBalance = document.getElementById("summary-balance");
const footerTotal = document.getElementById("footer-total");
const monthLabel = document.getElementById("current-month-label");
const addRowBtn = document.getElementById("add-row-btn");
const clearMonthBtn = document.getElementById("clear-month-btn");
const monthNavButtons = document.querySelectorAll(".nav-btn");

let currentYearMonth = getTodayYearMonth(); // "YYYY-MM"

function getTodayYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(ym) {
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function shiftMonth(ym, delta) {
  const [year, month] = ym.split("-");
  const base = new Date(Number(year), Number(month) - 1 + delta, 1);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

function renderMonth() {
  monthLabel.textContent = formatMonthLabel(currentYearMonth);

  const data = loadMonthData(currentYearMonth);
  rowsContainer.innerHTML = "";
  data.rows.forEach((row) => {
    const tr = createRowElement(row);
    rowsContainer.appendChild(tr);
  });

  if (data.rows.length === 0) {
    // cria algumas linhas vazias iniciais
    for (let i = 0; i < 5; i++) {
      const tr = createRowElement(newEmptyRow());
      rowsContainer.appendChild(tr);
    }
  }

  updateTotals();
}

function createRowElement(row) {
  const tr = document.createElement("tr");
  tr.dataset.id = row.id;

  tr.innerHTML = `
    <td>
      <input type="date" value="${row.date || ""}" />
    </td>
    <td>
      <input type="text" placeholder="Ex: Salário, Mercado" value="${row.description || ""}" />
    </td>
    <td>
      <select>
        ${buildCategoryOptions(row.category)}
      </select>
    </td>
    <td>
      <select>
        <option value="income" ${row.type === "income" ? "selected" : ""}>Entrada</option>
        <option value="expense" ${row.type === "expense" ? "selected" : ""}>Saída</option>
      </select>
    </td>
    <td>
      <input type="number" step="0.01" min="0" value="${row.amount ?? ""}" />
    </td>
    <td style="text-align:center;">
      <input type="checkbox" ${row.recurring ? "checked" : ""} />
    </td>
    <td>
      <button class="delete-btn">×</button>
    </td>
  `;

  tr.addEventListener("input", handleRowChange, { capture: true });
  tr.addEventListener("change", handleRowChange, { capture: true });

  const delBtn = tr.querySelector(".delete-btn");
  delBtn.addEventListener("click", () => {
    tr.remove();
    persistRows();
    updateTotals();
  });

  return tr;
}

function buildCategoryOptions(selected) {
  const categories = [
    "Salário",
    "Freelancer",
    "Investimentos",
    "Mercado",
    "Aluguel",
    "Contas (água, luz, internet)",
    "Transporte",
    "Lazer",
    "Saúde",
    "Outros"
  ];
  const placeholderSelected = selected ? "" : "selected";
  const options = [`<option value="" disabled ${placeholderSelected}>Selecione</option>`];
  for (const cat of categories) {
    const isSelected = selected === cat ? "selected" : "";
    options.push(`<option value="${cat}" ${isSelected}>${cat}</option>`);
  }
  return options.join("");
}

function handleRowChange() {
  persistRows();
  updateTotals();
}

function readRowsFromDOM() {
  const rows = [];
  rowsContainer.querySelectorAll("tr").forEach((tr, index) => {
    const inputs = tr.querySelectorAll("input, select");
    const [dateInput, descInput, catSelect, typeSelect, amountInput, recurringInput] = inputs;

    const amount = parseFloat(amountInput.value.replace(",", ".")); // suporta vírgula

    rows.push({
      id: tr.dataset.id || `row-${index}-${Date.now()}`,
      date: dateInput.value || "",
      description: descInput.value.trim(),
      category: catSelect.value || "",
      type: typeSelect.value === "expense" ? "expense" : "income",
      amount: isNaN(amount) ? 0 : amount,
      recurring: recurringInput.checked
    });
  });

  // remove linhas totalmente vazias (sem data, descrição e valor)
  return rows.filter(
    (r) => r.date || r.description || (typeof r.amount === "number" && r.amount > 0)
  );
}

function persistRows() {
  const rows = readRowsFromDOM();
  saveMonthData(currentYearMonth, { rows });
}

function updateTotals() {
  const rows = readRowsFromDOM();
  const totals = computeTotals(rows);

  summaryIncome.textContent = formatCurrency(totals.income);
  summaryExpense.textContent = formatCurrency(totals.expense);
  summaryBalance.textContent = formatCurrency(totals.balance);
  footerTotal.textContent = formatCurrency(totals.balance);
}

/* Event wiring */

addRowBtn.addEventListener("click", () => {
  const row = newEmptyRow();
  const tr = createRowElement(row);
  rowsContainer.appendChild(tr);
  persistRows();
});

clearMonthBtn.addEventListener("click", () => {
  if (!confirm("Tem certeza que deseja limpar todas as linhas deste mês?")) return;
  clearMonthData(currentYearMonth);
  renderMonth();
});

monthNavButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const delta = Number(btn.dataset.dir || "0");
    currentYearMonth = shiftMonth(currentYearMonth, delta);
    renderMonth();
  });
});

/* Init */

renderMonth();

