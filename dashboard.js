// ==========================================
// CONFIGURAÇÃO DO FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCLHmqR0bDmq7j-q-E0I456DlAgWMIKkgY",
  authDomain: "fittrack-59829.firebaseapp.com",
  projectId: "fittrack-59829",
  storageBucket: "fittrack-59829.firebasestorage.app",
  messagingSenderId: "384935605390",
  appId: "1:384935605390:web:2eb5540c6e3031781a85df"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// VERIFICAR SESSÃO
// ==========================================
const usuarioId = localStorage.getItem('fittrack_usuario_atual');
if (!usuarioId) {
    window.location.href = 'index.html';
}

let dadosUsuario = null;
let dataVisualizacao = new Date();
let dataSelecionada = formatarDataISO(new Date());

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================
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

// ==========================================
// SALVAR DADOS NO FIREBASE
// ==========================================
async function salvarDadosNoFirebase() {
    try {
        await db.collection('usuarios').doc(usuarioId).set(dadosUsuario);
        console.log('✅ Salvo no Firebase!');
        return true;
    } catch (erro) {
        console.error('❌ Erro ao salvar:', erro);
        alert('Erro ao salvar: ' + erro.message);
        return false;
    }
}

// ==========================================
// CARREGAR DADOS
// ==========================================
async function carregarDados() {
    try {
        const doc = await db.collection('usuarios').doc(usuarioId).get();
        
        if (!doc.exists) {
            localStorage.removeItem('fittrack_usuario_atual');
            window.location.href = 'index.html';
            return;
        }
        
        dadosUsuario = doc.data();
        console.log('✅ Dados carregados:', dadosUsuario);

        // Garantir que existam as propriedades
        if (!dadosUsuario.metas) {
            dadosUsuario.metas = { calorias: 2000, agua: 2500, atividade: 45 };
        }
        if (!dadosUsuario.registros) {
            dadosUsuario.registros = {};
        }

        // Saudação
        const primeiroNome = dadosUsuario.nomeCompleto 
            ? dadosUsuario.nomeCompleto.split(' ')[0] 
            : dadosUsuario.usuario;
        document.getElementById('saudacao-usuario').textContent = `Olá, ${primeiroNome}`;

        carregarInputsMetas();
        renderizarCalendario();
        atualizarPainelDoDia();
        
    } catch (erro) {
        console.error('❌ Erro ao carregar:', erro);
        alert('Erro ao carregar: ' + erro.message);
    }
}

// ==========================================
// METAS — CARREGAR E SALVAR
// ==========================================
function carregarInputsMetas() {
    document.getElementById('meta-calorias').value = dadosUsuario.metas.calorias;
    document.getElementById('meta-agua').value = dadosUsuario.metas.agua;
    document.getElementById('meta-atividade').value = dadosUsuario.metas.atividade;
    console.log('📝 Metas carregadas:', dadosUsuario.metas);
}

document.getElementById('form-metas').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    dadosUsuario.metas.calorias = Number(document.getElementById('meta-calorias').value);
    dadosUsuario.metas.agua = Number(document.getElementById('meta-agua').value);
    dadosUsuario.metas.atividade = Number(document.getElementById('meta-atividade').value);

    await salvarDadosNoFirebase();
    carregarInputsMetas();
    atualizarPainelDoDia();
    alert('✅ Metas atualizadas!');
});

// ==========================================
// OBTER REGISTROS DO DIA
// ==========================================
function obterRegistrosDoDia(dataISO) {
    if (!dadosUsuario.registros[dataISO]) {
        dadosUsuario.registros[dataISO] = {
            calorias: [],
            agua: [],
            atividade: []
        };
    }
    return dadosUsuario.registros[dataISO];
}

// ==========================================
// CALENDÁRIO
// ==========================================
function renderizarCalendario() {
    const grade = document.getElementById('grade-dias');
    const tituloMes = document.getElementById('mes-ano-atual');
    if (!grade) return;
    
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

        const reg = dadosUsuario.registros[dataISO];
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

// ==========================================
// PAINEL DO DIA
// ==========================================
function atualizarPainelDoDia() {
    if (!dadosUsuario) return;
    
    const hoje = formatarDataISO(new Date());
    const textoData = document.getElementById('data-selecionada-texto');
    textoData.textContent = dataSelecionada === hoje 
        ? 'Hoje' 
        : formatarDataBr(dataSelecionada);

    const dadosDia = obterRegistrosDoDia(dataSelecionada);

    renderizarCaloriasAgrupadas(dadosDia.calorias, dadosUsuario.metas.calorias);
    renderizarSimples('agua', dadosDia.agua, dadosUsuario.metas.agua, 'ml');
    renderizarSimples('atividade', dadosDia.atividade, dadosUsuario.metas.atividade, 'min');
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

            li.querySelector('.btn-remover').addEventListener('click', async () => {
                listaCalorias.splice(item.indexOriginal, 1);
                await salvarDadosNoFirebase();
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
        li.querySelector('.btn-remover').addEventListener('click', async () => {
            lista.splice(index, 1);
            await salvarDadosNoFirebase();
            atualizarPainelDoDia();
            renderizarCalendario();
        });
        ul.appendChild(li);
    });
}

// ==========================================
// ADICIONAR REGISTROS
// ==========================================

// Calorias / Refeições
document.getElementById('form-calorias').addEventListener('submit', async (e) => {
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

    await salvarDadosNoFirebase();
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
    btn.addEventListener('click', async () => {
        const ml = Number(btn.dataset.ml);
        obterRegistrosDoDia(dataSelecionada).agua.push({
            descricao: 'Copo / Garrafa',
            valor: ml
        });
        await salvarDadosNoFirebase();
        atualizarPainelDoDia();
        renderizarCalendario();
    });
});

// Água - Formulário Personalizado
document.getElementById('form-agua').addEventListener('submit', async (e) => {
    e.preventDefault();
    const quantidade = Number(document.getElementById('valor-agua').value);
    
    obterRegistrosDoDia(dataSelecionada).agua.push({
        descricao: 'Quantidade personalizada',
        valor: quantidade
    });

    await salvarDadosNoFirebase();
    document.getElementById('valor-agua').value = '';
    document.getElementById('valor-agua').focus();
    
    atualizarPainelDoDia();
    renderizarCalendario();
});

// Atividade Física
document.getElementById('form-atividade').addEventListener('submit', async (e) => {
    e.preventDefault();
    const descricao = document.getElementById('desc-atividade').value.trim();
    const minutos = Number(document.getElementById('valor-atividade').value);

    obterRegistrosDoDia(dataSelecionada).atividade.push({
        descricao: descricao,
        valor: minutos
    });

    await salvarDadosNoFirebase();
    document.getElementById('desc-atividade').value = '';
    document.getElementById('valor-atividade').value = '';
    document.getElementById('desc-atividade').focus();
    
    atualizarPainelDoDia();
    renderizarCalendario();
});

// ==========================================
// BOTÃO SAIR
// ==========================================
document.getElementById('btn-sair').addEventListener('click', () => {
    localStorage.removeItem('fittrack_usuario_atual');
    window.location.href = 'index.html';
});

// ==========================================
// INICIAR
// ==========================================
carregarDados();
