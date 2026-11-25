// Verifica sessão ativa
const usuarioLogadoKey = localStorage.getItem('fittrack_usuario_logado');
if (!usuarioLogadoKey) {
    window.location.href = 'index.html';
}

let listaUsuarios = JSON.parse(localStorage.getItem('fittrack_usuarios')) || [];
let indiceUsuario = listaUsuarios.findIndex(u => u.usuario === usuarioLogadoKey);

if (indiceUsuario === -1) {
    localStorage.removeItem('fittrack_usuario_logado');
    window.location.href = 'index.html';
}

let usuarioAtual = listaUsuarios[indiceUsuario];

if (!usuarioAtual.metas) {
    usuarioAtual.metas = { calorias: 2000, agua: 2500, atividade: 45 };
}
if (!usuarioAtual.registros) {
    usuarioAtual.registros = {};
}

// Saudação
const primeiroNome = usuarioAtual.nomeCompleto
    ? usuarioAtual.nomeCompleto.split(' ')[0]
    : usuarioAtual.usuario;
document.getElementById('saudacao-usuario').textContent = `Olá, ${primeiroNome}`;

// Botão Sair
document.getElementById('btn-sair').addEventListener('click', () => {
    localStorage.removeItem('fittrack_usuario_logado');
    window.location.href = 'index.html';
});

// Controle de período
let periodoAtual = 'semana';

// Formatação de datas
function formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function formatarDataBr(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarDataCurta(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}`;
}

// Obter intervalo de datas conforme período
function obterIntervalo(periodo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let inicio, fim;

    if (periodo === 'semana') {
        const diaSemana = hoje.getDay();
        inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - diaSemana);
        fim = new Date(inicio);
        fim.setDate(inicio.getDate() + 6);
    } else if (periodo === 'mes') {
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    } else if (periodo === 'ano') {
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = new Date(hoje.getFullYear(), 11, 31);
    }

    return { inicio, fim };
}

function gerarListaDatas(inicio, fim) {
    const lista = [];
    const corrente = new Date(inicio);
    while (corrente <= fim) {
        lista.push(formatarDataISO(corrente));
        corrente.setDate(corrente.getDate() + 1);
    }
    return lista;
}

// ✅ Calcular totais e médias — Lógica CORRIGIDA para calorias
function calcularEstatisticas(listaDatas, metas) {
    let totalCalorias = 0, totalAgua = 0, totalAtividade = 0;
    let diasCaloriasOk = 0, diasAguaOk = 0, diasAtividadeOk = 0;
    const detalhesPorDia = [];

    listaDatas.forEach(dataISO => {
        const reg = usuarioAtual.registros[dataISO] || { calorias: [], agua: [], atividade: [] };
        
        const caloriasDia = reg.calorias.reduce((s, i) => s + Number(i.kcal || 0), 0);
        const aguaDia = reg.agua.reduce((s, i) => s + Number(i.valor || 0), 0);
        const atividadeDia = reg.atividade.reduce((s, i) => s + Number(i.valor || 0), 0);

        totalCalorias += caloriasDia;
        totalAgua += aguaDia;
        totalAtividade += atividadeDia;

        // ✅ CORRIGIDO: Calorias = ABAIXO ou IGUAL à meta (e com registro no dia)
        if (caloriasDia > 0 && caloriasDia <= metas.calorias) diasCaloriasOk++;
        // Água e Atividade continuam = NO MÍNIMO a meta
        if (aguaDia >= metas.agua * 0.8) diasAguaOk++;
        if (atividadeDia >= metas.atividade) diasAtividadeOk++;

        detalhesPorDia.push({
            data: dataISO,
            calorias: caloriasDia,
            agua: aguaDia,
            atividade: atividadeDia
        });
    });

    const qtdDias = listaDatas.length;

    return {
        totalCalorias,
        totalAgua,
        totalAtividade,
        mediaCalorias: Math.round(totalCalorias / qtdDias),
        mediaAgua: Math.round(totalAgua / qtdDias),
        mediaAtividade: Math.round(totalAtividade / qtdDias),
        diasCaloriasOk,
        diasAguaOk,
        diasAtividadeOk,
        qtdDias,
        detalhesPorDia
    };
}

// Atualizar tela com os dados
function atualizarTela() {
    const { inicio, fim } = obterIntervalo(periodoAtual);
    const listaDatas = gerarListaDatas(inicio, fim);
    const stats = calcularEstatisticas(listaDatas, usuarioAtual.metas);

    // Título e intervalo
    const titulos = {
        semana: 'Resumo da Semana',
        mes: 'Resumo do Mês',
        ano: 'Resumo do Ano'
    };
    document.getElementById('titulo-periodo').textContent = titulos[periodoAtual];
    document.getElementById('intervalo-datas').textContent = 
        `${formatarDataBr(formatarDataISO(inicio))} a ${formatarDataBr(formatarDataISO(fim))}`;

    // Cartões — Calorias
    document.getElementById('calorias-total').textContent = stats.totalCalorias.toLocaleString('pt-BR') + ' kcal';
    document.getElementById('calorias-media').textContent = stats.mediaCalorias.toLocaleString('pt-BR');
    document.getElementById('calorias-meta').textContent = `${stats.diasCaloriasOk}/${stats.qtdDias}`;
    const percCalorias = Math.min((stats.diasCaloriasOk / stats.qtdDias) * 100, 100);
    document.getElementById('barra-calorias-geral').style.width = `${percCalorias}%`;

    // Cartões — Água
    document.getElementById('agua-total').textContent = stats.totalAgua.toLocaleString('pt-BR') + ' ml';
    document.getElementById('agua-media').textContent = stats.mediaAgua.toLocaleString('pt-BR');
    document.getElementById('agua-meta').textContent = `${stats.diasAguaOk}/${stats.qtdDias}`;
    const percAgua = Math.min((stats.diasAguaOk / stats.qtdDias) * 100, 100);
    document.getElementById('barra-agua-geral').style.width = `${percAgua}%`;

    // Cartões — Atividade
    document.getElementById('atividade-total').textContent = stats.totalAtividade.toLocaleString('pt-BR') + ' min';
    document.getElementById('atividade-media').textContent = stats.mediaAtividade.toLocaleString('pt-BR');
    document.getElementById('atividade-meta').textContent = `${stats.diasAtividadeOk}/${stats.qtdDias}`;
    const percAtividade = Math.min((stats.diasAtividadeOk / stats.qtdDias) * 100, 100);
    document.getElementById('barra-atividade-geral').style.width = `${percAtividade}%`;

    // Renderizar gráfico de barras
    renderizarGrafico(stats.detalhesPorDia, usuarioAtual.metas);

    // Renderizar tabela
    renderizarTabela(stats.detalhesPorDia, usuarioAtual.metas);
}

function renderizarGrafico(dados, metas) {
    const container = document.getElementById('grafico-barras');
    container.innerHTML = '';

    const maxCalorias = Math.max(...dados.map(d => d.calorias), metas.calorias, 1);
    const maxAgua = Math.max(...dados.map(d => d.agua), metas.agua, 1);
    const maxAtividade = Math.max(...dados.map(d => d.atividade), metas.atividade, 1);

    dados.forEach(dia => {
        const coluna = document.createElement('div');
        coluna.className = 'coluna-grafico';

        const barras = document.createElement('div');
        barras.className = 'barras-agrupadas';

        // Calorias
        const altCalorias = Math.max((dia.calorias / maxCalorias) * 150, 3);
        const barraCal = document.createElement('div');
        barraCal.className = 'mini-barra-calorias';
        barraCal.style.height = `${altCalorias}px`;
        barras.appendChild(barraCal);

        // Água
        const altAgua = Math.max((dia.agua / maxAgua) * 150, 3);
        const barraAg = document.createElement('div');
        barraAg.className = 'mini-barra-agua';
        barraAg.style.height = `${altAgua}px`;
        barras.appendChild(barraAg);

        // Atividade
        const altAtiv = Math.max((dia.atividade / maxAtividade) * 150, 3);
        const barraAt = document.createElement('div');
        barraAt.className = 'mini-barra-atividade';
        barraAt.style.height = `${altAtiv}px`;
        barras.appendChild(barraAt);

        coluna.appendChild(barras);

        const rotulo = document.createElement('div');
        rotulo.className = 'rotulo-data';
        rotulo.textContent = formatarDataCurta(dia.data);
        coluna.appendChild(rotulo);

        container.appendChild(coluna);
    });

    // Legenda do gráfico
    const legenda = document.createElement('div');
    legenda.className = 'legenda-grafico';
    legenda.innerHTML = `
        <div class="item-legenda"><span class="ponto-legenda" style="background:#f59e0b"></span> Calorias</div>
        <div class="item-legenda"><span class="ponto-legenda" style="background:#3b82f6"></span> Água</div>
        <div class="item-legenda"><span class="ponto-legenda" style="background:#10b981"></span> Atividade</div>
    `;
    container.appendChild(legenda);
}

// ✅ Tabela atualizada com destaque para calorias acima da meta
function renderizarTabela(dados, metas) {
    const corpo = document.getElementById('corpo-tabela');
    corpo.innerHTML = '';

    dados.forEach(dia => {
        const tr = document.createElement('tr');

        // ✅ Lógica corrigida para calorias
        const calOk = dia.calorias > 0 && dia.calorias <= metas.calorias;
        const calEstourado = dia.calorias > metas.calorias;
        const agOk = dia.agua >= metas.agua * 0.8;
        const atOk = dia.atividade >= metas.atividade;
        const totalOk = [calOk, agOk, atOk].filter(Boolean).length;

        let statusTexto, statusClasse;
        if (calEstourado) {
            statusTexto = '⚠️ Calorias acima!';
            statusClasse = 'status-falha';
        } else if (totalOk === 3) {
            statusTexto = '✅ Meta do dia';
            statusClasse = 'status-sucesso';
        } else if (totalOk > 0) {
            statusTexto = '⚠️ Parcial';
            statusClasse = 'status-parcial';
        } else {
            statusTexto = '❌ Não cumprida';
            statusClasse = 'status-falha';
        }

        tr.innerHTML = `
            <td><strong>${formatarDataBr(dia.data)}</strong></td>
            <td style="${calEstourado ? 'color:#ef4444;font-weight:bold' : ''}">${dia.calorias.toLocaleString('pt-BR')} kcal ${calEstourado ? '⚠️' : ''}</td>
            <td>${dia.agua.toLocaleString('pt-BR')} ml</td>
            <td>${dia.atividade} min</td>
            <td class="${statusClasse}">${statusTexto}</td>
        `;
        corpo.appendChild(tr);
    });
}

// Botões de período
document.querySelectorAll('.btn-periodo').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-periodo').forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        periodoAtual = btn.dataset.periodo;
        atualizarTela();
    });
});

// Inicializar
atualizarTela();
