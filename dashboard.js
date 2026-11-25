// 1. Verifica sessão ativa
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

// Inicializa metas e registros se não existirem
if (!usuarioAtual.metas) {
    usuarioAtual.metas = { calorias: 2000, agua: 2500, atividade: 45 };
}
if (!usuarioAtual.registros) {
    usuarioAtual.registros = {};
}
// Garante que os dados iniciais sejam salvos na primeira vez
listaUsuarios[indiceUsuario] = usuarioAtual;
localStorage.setItem('fittrack_usuarios', JSON.stringify(listaUsuarios));

// 2. Controle de datas
let dataVisualizacao = new Date();
let dataSelecionada = formatarDataISO(new Date());

// 3. Inicialização da tela
const primeiroNome = usuarioAtual.nomeCompleto 
    ? usuarioAtual.nomeCompleto.split(' ')[0] 
    : usuarioAtual.usuario;
document.getElementById('saudacao-usuario').textContent = `Olá, ${primeiroNome}`;

carregarInputsMetas();
renderizarCalendario();
atualizarPainelDoDia();

// Botão Sair
document.getElementById('btn-sair').addEventListener('click', () => {
    localStorage.removeItem('fittrack_usuario_logado');
    window.location.href = 'index.html';
});

// Funções auxiliares
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

function salvarDadosNoNavegador() {
    listaUsuarios[indiceUsuario] = usuarioAtual;
    localStorage.setItem('fittrack_usuarios', JSON.stringify(listaUsuarios));
}

function obterRegistrosDoDia(dataISO) {
    if (!usuarioAtual.registros[dataISO]) {
        usuarioAtual.registros[dataISO] = {
            calorias: [],
            agua: [],
            atividade: []
        };
    }
    return usuarioAtual.registros[dataISO];
}

// --- CALENDÁRIO ---
function renderizarCalendario() {
    const grade = document.getElementById('grade-dias');
    const tituloMes = document.getElementById('mes-ano-atual');
    grade.innerHTML = '';

    const ano = dataVisualizacao.getFullYear();
    const mes = dataVisualizacao.getMonth();

    tituloMes.textContent = dataVisualizacao.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) {
        grade.appendChild(document.createElement('div'));
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const btnDia = document.createElement('button');
        btnDia.type = 'button';
        btnDia.className = 'dia-btn';
        btnDia.textContent = dia;

        const dataISO = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        if (dataISO === dataSelecionada) {
            btnDia.classList.add('selecionado');
        }

        const reg = usuarioAtual.registros[dataISO];
        if (reg && (reg.calorias.length > 0 || reg.agua.length > 0 || reg.atividade.length > 0)) {
            btnDia.classList.add('tem-registro');
        }

        btnDia.addEventListener('click', () => {
            dataSelecionada = dataISO;
            renderizarCalendario();
            atualizarPainelDoDia();
        });

        grade.appendChild(btnDia);
    }
}

document.getElementById('mes-anterior').addEventListener('click', () => {
    dataVisualizacao.setMonth(dataVisualizacao.getMonth() - 1);
    renderizarCalendario();
});

document.getElementById('proximo-mes').addEventListener('click', () => {
    dataVisualizacao.setMonth(dataVisualizacao.getMonth() + 1);
    renderizarCalendario();
});

// --- METAS ---
function carregarInputsMetas() {
    document.getElementById('meta-calorias').value = usuarioAtual.metas.calorias;
    document.getElementById('meta-agua').value = usuarioAtual.metas.agua;
    document.getElementById('meta-atividade').value = usuarioAtual.metas.atividade;
}

document.getElementById('form-metas').addEventListener('submit', (e) => {
    e.preventDefault();
    usuarioAtual.metas.calorias = Number(document.getElementById('meta-calorias').value);
    usuarioAtual.metas.agua = Number(document.getElementById('meta-agua').value);
    usuarioAtual.metas.atividade = Number(document.getElementById('meta-atividade').value);

    salvarDadosNoNavegador();
    carregarInputsMetas(); // Garante que os inputs reflitam o valor salvo
    atualizarPainelDoDia();
    alert('Metas atualizadas com sucesso!');
});

// --- ATUALIZAÇÃO DO PAINEL DO DIA ---
function atualizarPainelDoDia() {
    const hoje = formatarDataISO(new Date());
    const textoData = document.getElementById('data-selecionada-texto');
    textoData.textContent = dataSelecionada === hoje 
        ? 'Hoje' 
        : formatarDataBr(dataSelecionada);

    const dadosDia = obterRegistrosDoDia(dataSelecionada);

    renderizarCaloriasAgrupadas(dadosDia.calorias, usuarioAtual.metas.calorias);
    renderizarSimples('agua', dadosDia.agua, usuarioAtual.metas.agua, 'ml');
    renderizarSimples('atividade', dadosDia.atividade, usuarioAtual.metas.atividade, 'min');
}

function renderizarCaloriasAgrupadas(listaCalorias, metaKcal) {
    const totalDia = listaCalorias.reduce((soma, item) => soma + Number(item.kcal || item.valor || 0), 0);
    const porcentagem = Math.min((totalDia / metaKcal) * 100, 100);

    document.getElementById('status-calorias').textContent = `${totalDia} / ${metaKcal} kcal`;
    document.getElementById('barra-calorias').style.width = `${porcentagem}%`;

    const container = document.getElementById('lista-refeicoes');
    container.innerHTML = '';

    if (listaCalorias.length === 0) return;

    const grupos = {};
    listaCalorias.forEach((item, indexOriginal) => {
        const nomeRef = item.refeicao || 'Refeição';
        if (!grupos[nomeRef]) {
            grupos[nomeRef] = [];
        }
        grupos[nomeRef].push({ ...item, indexOriginal });
    });

    for (const [nomeRefeicao, itens] of Object.entries(grupos)) {
        const bloco = document.createElement('div');
        bloco.className = 'bloco-refeicao';

        const titulo = document.createElement('div');
        titulo.className = 'bloco-refeicao-titulo';
        titulo.textContent = `${nomeRefeicao}:`;
        bloco.appendChild(titulo);

        const ul = document.createElement('ul');
        ul.className = 'itens-refeicao';

        let subtotalRefeicao = 0;

        itens.forEach(item => {
            const kcalItem = Number(item.kcal || item.valor || 0);
            const gramasTexto = item.gramas ? ` - ${item.gramas}g` : '';
            const alimentoTexto = item.alimento || item.descricao || 'Alimento';
            subtotalRefeicao += kcalItem;

            const li = document.createElement('li');
            li.innerHTML = `
                <span>${alimentoTexto}${gramasTexto} - <strong>${kcalItem}kcal</strong></span>
                <button type="button" class="btn-remover" title="Excluir item">x</button>
            `;

            li.querySelector('.btn-remover').addEventListener('click', () => {
                listaCalorias.splice(item.indexOriginal, 1);
                salvarDadosNoNavegador();
                atualizarPainelDoDia();
                renderizarCalendario();
            });

            ul.appendChild(li);
        });

        bloco.appendChild(ul);

        const rodape = document.createElement('div');
        rodape.className = 'total-refeicao';
        rodape.textContent = `Total kcal: ${subtotalRefeicao}kcal`;
        bloco.appendChild(rodape);

        container.appendChild(bloco);
    }
}

function renderizarSimples(tipo, lista, meta, unidade) {
    const total = lista.reduce((soma, item) => soma + Number(item.valor || 0), 0);
    const porcentagem = Math.min((total / meta) * 100, 100);

    document.getElementById(`status-${tipo}`).textContent = `${total} / ${meta} ${unidade}`;
    document.getElementById(`barra-${tipo}`).style.width = `${porcentagem}%`;

    const ul = document.getElementById(`lista-${tipo}`);
    ul.innerHTML = '';

    lista.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.descricao} — <strong>${item.valor} ${unidade}</strong></span>
            <button type="button" class="btn-remover" title="Excluir">x</button>
        `;
        li.querySelector('.btn-remover').addEventListener('click', () => {
            lista.splice(index, 1);
            salvarDadosNoNavegador();
            atualizarPainelDoDia();
            renderizarCalendario();
        });
        ul.appendChild(li);
    });
}

// --- EVENTOS DE ADICIONAR REGISTROS ---

// Calorias / Refeições
document.getElementById('form-calorias').addEventListener('submit', (e) => {
    e.preventDefault();
    const refeicao = document.getElementById('refeicao-nome').value.trim();
    const alimento = document.getElementById('alimento-nome').value.trim();
    const gramas = Number(document.getElementById('alimento-gramas').value);
    const kcal = Number(document.getElementById('alimento-kcal').value);

    obterRegistrosDoDia(dataSelecionada).calorias.push({
        refeicao: refeicao,
        alimento: alimento,
        gramas: gramas,
        kcal: kcal
    });

    salvarDadosNoNavegador();
    document.getElementById('refeicao-nome').value = '';
    document.getElementById('alimento-nome').value = '';
    document.getElementById('alimento-gramas').value = '';
    document.getElementById('alimento-kcal').value = '';
    document.getElementById('refeicao-nome').focus();

    atualizarPainelDoDia();
    renderizarCalendario();
});

// Água - Botões Rápidos
document.querySelectorAll('.btn-agua-rapido').forEach(btn => {
    btn.addEventListener('click', () => {
        const ml = Number(btn.dataset.ml);
        obterRegistrosDoDia(dataSelecionada).agua.push({
            descricao: 'Copo / Garrafa',
            valor: ml
        });
        salvarDadosNoNavegador();
        atualizarPainelDoDia();
        renderizarCalendario();
    });
});

// Água - Formulário Personalizado
document.getElementById('form-agua').addEventListener('submit', (e) => {
    e.preventDefault();
    const quantidade = Number(document.getElementById('valor-agua').value);
    
    obterRegistrosDoDia(dataSelecionada).agua.push({
        descricao: 'Quantidade personalizada',
        valor: quantidade
    });

    salvarDadosNoNavegador();
    document.getElementById('valor-agua').value = '';
    document.getElementById('valor-agua').focus();
    
    atualizarPainelDoDia();
    renderizarCalendario();
});

// Atividade Física
document.getElementById('form-atividade').addEventListener('submit', (e) => {
    e.preventDefault();
    const descricao = document.getElementById('desc-atividade').value.trim();
    const minutos = Number(document.getElementById('valor-atividade').value);

    obterRegistrosDoDia(dataSelecionada).atividade.push({
        descricao: descricao,
        valor: minutos
    });

    salvarDadosNoNavegador();
    document.getElementById('desc-atividade').value = '';
    document.getElementById('valor-atividade').value = '';
    document.getElementById('desc-atividade').focus();
    
    atualizarPainelDoDia();
    renderizarCalendario();
});
