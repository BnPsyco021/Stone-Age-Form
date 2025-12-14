import Chart from "chart.js/auto";

const elementos = {
  data: document.getElementById("data"),
  descricao: document.getElementById("descricao"),
  categoria: document.getElementById("categoria"),
  pagamento: document.getElementById("pagamento"),
  valor: document.getElementById("valor"),
  btnAdicionar: document.getElementById("adicionar"),
  tabelaCorpo: document.getElementById("tabela-corpo"),
  totalGeral: document.getElementById("total-geral"),
  tabs: document.querySelectorAll(".tab-btn"),
  canvas: document.getElementById("grafico")
};

const STORAGE_KEY = "controle-financeiro-gastos";
let gastos = [];
let chart;
let modoGrafico = "dia"; // "dia" | "mes"

function hojeISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

function carregarGastos() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    gastos = salvo ? JSON.parse(salvo) : [];
  } catch {
    gastos = [];
  }
}

function salvarGastos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gastos));
}

function formatarValor(num) {
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatarDataBr(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function atualizarTabela() {
  elementos.tabelaCorpo.innerHTML = "";
  let total = 0;

  gastos.forEach((gasto, index) => {
    const tr = document.createElement("tr");

    const tdData = document.createElement("td");
    tdData.textContent = formatarDataBr(gasto.data);

    const tdDesc = document.createElement("td");
    tdDesc.textContent = gasto.descricao;

    const tdCat = document.createElement("td");
    tdCat.textContent = gasto.categoria;

    const tdPag = document.createElement("td");
    tdPag.textContent = gasto.pagamento;

    const tdValor = document.createElement("td");
    tdValor.className = "valor-col";
    tdValor.textContent = formatarValor(gasto.valor);

    const tdRemover = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "remove-btn";
    btn.textContent = "×";
    btn.addEventListener("click", () => removerGasto(index));
    tdRemover.appendChild(btn);

    tr.append(tdData, tdDesc, tdCat, tdPag, tdValor, tdRemover);
    elementos.tabelaCorpo.appendChild(tr);

    total += gasto.valor;
  });

  elementos.totalGeral.textContent = formatarValor(total);
}

function agruparPorDia() {
  const mapa = {};
  gastos.forEach((g) => {
    mapa[g.data] = (mapa[g.data] || 0) + g.valor;
  });
  const chaves = Object.keys(mapa).sort();
  return {
    labels: chaves.map((d) => formatarDataBr(d)),
    valores: chaves.map((d) => mapa[d])
  };
}

function agruparPorMes() {
  const mapa = {};
  gastos.forEach((g) => {
    const [ano, mes] = g.data.split("-");
    const chave = `${ano}-${mes}`;
    mapa[chave] = (mapa[chave] || 0) + g.valor;
  });
  const chaves = Object.keys(mapa).sort();
  return {
    labels: chaves.map((c) => {
      const [ano, mes] = c.split("-");
      return `${mes}/${ano}`;
    }),
    valores: chaves.map((c) => mapa[c])
  };
}

function criarOuAtualizarGrafico() {
  const ctx = elementos.canvas.getContext("2d");
  const base =
    modoGrafico === "dia" ? agruparPorDia() : agruparPorMes();

  const dataConfig = {
    labels: base.labels,
    datasets: [
      {
        label: modoGrafico === "dia" ? "Gastos por dia" : "Gastos por mês",
        data: base.valores,
        borderColor: "#1f7a5c",
        backgroundColor: "rgba(31,122,92,0.15)",
        borderWidth: 2,
        tension: 0.25,
        fill: true,
        pointRadius: 3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) =>
            "R$ " + formatarValor(context.parsed.y || 0)
        }
      }
    },
    scales: {
      x: {
        ticks: { font: { size: 10 } }
      },
      y: {
        ticks: {
          font: { size: 10 },
          callback: (value) => "R$ " + formatarValor(value)
        }
      }
    }
  };

  if (chart) {
    chart.data = dataConfig;
    chart.options = options;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: "line",
      data: dataConfig,
      options
    });
  }
}

function adicionarGasto() {
  const data = elementos.data.value || hojeISO();
  const descricao = elementos.descricao.value.trim() || "Sem descrição";
  const categoria = elementos.categoria.value;
  const pagamento = elementos.pagamento.value;
  const valor = parseFloat(elementos.valor.value.replace(",", "."));

  if (!valor || valor <= 0) return;

  gastos.push({ data, descricao, categoria, pagamento, valor });
  salvarGastos();
  atualizarTabela();
  criarOuAtualizarGrafico();

  elementos.descricao.value = "";
  elementos.valor.value = "";
  elementos.descricao.focus();
}

function removerGasto(indice) {
  gastos.splice(indice, 1);
  salvarGastos();
  atualizarTabela();
  criarOuAtualizarGrafico();
}

function inicializarTabs() {
  elementos.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      elementos.tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      modoGrafico = tab.dataset.chart;
      criarOuAtualizarGrafico();
    });
  });
}

function init() {
  elementos.data.value = hojeISO();
  carregarGastos();
  atualizarTabela();
  criarOuAtualizarGrafico();
  inicializarTabs();

  elementos.btnAdicionar.addEventListener("click", adicionarGasto);

  elementos.valor.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarGasto();
    }
  });
}

init();

