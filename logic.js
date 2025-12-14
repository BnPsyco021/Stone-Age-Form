export function computeTotals(rows) {
  let income = 0;
  let expense = 0;

  for (const row of rows) {
    const value = Number(row.amount) || 0;
    if (!value) continue;

    if (row.type === "expense") {
      expense += value;
    } else {
      income += value;
    }
  }

  return {
    income,
    expense,
    balance: income - expense
  };
}

export function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  });
}

export function newEmptyRow() {
  return {
    id: `row-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`,
    date: "",
    description: "",
    category: "",
    type: "expense",
    amount: null,
    recurring: false
  };
}

