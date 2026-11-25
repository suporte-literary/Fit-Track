// dashboard.js — Versão compatível com GitHub Pages
let usuarioAtual = null;
let dadosUsuario = null;
let dataSelecionada = formatarDataISO(new Date());

// ============= INICIALIZAÇÃO =============
async function iniciar() {
    try {
        // Aguardar login
        usuarioAtual = await new Promise(resolve => {
            const unsubscribe = firebase.auth().onAuthStateChanged(user => {
                unsubscribe();
                resolve(user);
            });
        });

        if (!usuarioAtual) {
            window.location.href = 'index.html';
            return;
        }

        // Carregar dados do Firestore
        const docSnap = await firebase.firestore().collection('usuarios').doc(usuarioAtual.uid).get();
        
        if (docSnap.exists) {
            dadosUsuario = docSnap.data();
        } else {
            dadosUsuario = {
                nomeCompleto: '',
                usuario: '',
                metas: { calorias: 2000, agua: 2500, atividade: 45 },
                registros: {}
            };
        }

        if (!dadosUsuario.metas) dadosUsuario.metas = { calorias: 2000, agua: 2500, atividade: 45 };
        if (!dadosUsuario.registros) dadosUsuario.registros = {};

        // Saudação
        const primeiroNome = dadosUsuario.nomeCompleto 
            ? dadosUsuario.nomeCompleto.split(' ')[0] 
            : usuarioAtual.email.split('@')[0];
        const el = document.getElementById('saudacao-usuario');
        if (el) el.textContent = `Olá, ${primeiroNome}`;

        // Botão Sair
        const btnSair = document.getElementById('btn-sair');
        if (btnSair) btnSair.addEventListener('click', async () => {
            await firebase.auth().signOut();
            window.location.href = 'index.html';
        });

        carregarInputsMetas();
        renderizarCalendario();
        atualizarPainelDoDia();
        
    } catch (erro) {
        console.error('Erro ao inicializar:', erro);
    }
}

// ============= SALVAR NO FIREBASE =============
async function salvar() {
    if (!usuarioAtual) return;
    try {
        await firebase.firestore().collection('usuarios').doc(usuarioAtual.uid).set(dadosUsuario, { merge: true });
    } catch (erro) {
        console.error('Erro ao salvar:', erro);
    }
}

// ============= FUNÇÕES AUXILIARES =============
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

function obterRegistrosDoDia(dataISO) {
    if (!dadosUsuario.registros[dataISO]) {
        dadosUsuario.registros[dataISO] = { calorias: [], agua: [], atividade: [] };
    }
    return dadosUsuario.registros[dataISO];
}

// ============= METAS =============
function carregarInputsMetas() {
    const inputCal = document.getElementById('meta-calorias');
    const inputAgua = document.getElementById('meta-agua');
    const inputAtiv = document.getElementById('meta-atividade');

    if (inputCal) inputCal.value = dadosUsuario.metas.calorias;
    if (inputAgua) inputAgua.value = dadosUsuario.metas.agua;
    if (inputAtiv) inputAtiv.value = dadosUsuario.metas.atividade;

    if (inputCal) inputCal.addEventListener('change', () => {
        dadosUsuario.metas.calorias = Number(inputCal.value);
        salvar();
    });
    if (inputAgua) inputAgua.addEventListener('change', () => {
        dadosUsuario.metas.agua = Number(inputAgua.value);
        salvar();
    });
    if (inputAtiv) inputAtiv.addEventListener('change', () => {
        dadosUsuario.metas.atividade = Number(inputAtiv.value);
        salvar();
    });
}

// ============= CALENDÁRIO =============
function renderizarCalendario() {
    const container = document.getElementById('dias-semana');
    if (!container) return;
    container.innerHTML = '';

    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());

    const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < 7; i++) {
        const data = new Date(inicioSemana);
        data.setDate(inicioSemana.getDate() + i);
        const dataISO = formatarDataISO(data);
        const diaSemana = nomesDias[i];
        const diaMes = data.getDate();

        const reg = dadosUsuario.registros[dataISO] || { calorias: [], agua: [], atividade: [] };
        const caloriasDia = reg.calorias.reduce((s, i) => s + Number(i.kcal || 0), 0);
        const aguaDia = reg.agua.reduce((s, i) => s + Number(i.valor || 0), 0);
        const atividadeDia = reg.atividade.reduce((s, i) => s + Number(i.valor || 0), 0);

        const calOk = caloriasDia > 0 && caloriasDia <= dadosUsuario.metas.calorias;
        const agOk = aguaDia >= dadosUsuario.metas.agua * 0.8;
        const atOk = atividadeDia >= dadosUsuario.metas.atividade;
        const totalOk = [calOk, agOk, atOk].filter(Boolean).length;

        let classeStatus = '';
        if (totalOk === 3) classeStatus = 'meta-completa';
        else if (totalOk > 0) classeStatus = 'meta-parcial';

        const ehHoje = dataISO === formatarDataISO(hoje) ? 'dia-hoje' : '';
        const ehSelecionado = dataISO === dataSelecionada ? 'dia-selecionado' : '';

        const div = document.createElement('div');
        div.className = `dia-semana ${ehHoje} ${ehSelecionado} ${classeStatus}`;
        div.innerHTML = `
            <div class="nome-dia">${diaSemana}</div>
            <div class="numero-dia">${diaMes}</div>
        `;
        div.addEventListener('click', () => {
            dataSelecionada = dataISO;
            renderizarCalendario();
            atualizarPainelDoDia();
        });
        container.appendChild(div);
    }
}

// ============= PAINEL DO DIA =============
function atualizarPainelDoDia() {
    const reg = obterRegistrosDoDia(dataSelecionada);

    const elData = document.getElementById('data-selecionada');
    if (elData) elData.textContent = formatarDataBr(dataSelecionada);

    // Calorias
    const totalCal = reg.calorias.reduce((s, i) => s + Number(i.kcal || 0), 0);
    const elTotalCal = document.getElementById('total-calorias');
    const elMetaCal = document.getElementById('meta-calorias-texto');
    const elBarraCal = document.getElementById('barra-calorias');
    const elListaCal = document.getElementById('lista-refeicoes');
    
    if (elTotalCal) elTotalCal.textContent = totalCal.toLocaleString('pt-BR');
    if (elMetaCal) elMetaCal.textContent = `/ ${dadosUsuario.metas.calorias.toLocaleString('pt-BR')} kcal`;
    if (elBarraCal) elBarraCal.style.width = `${Math.min((totalCal / dadosUsuario.metas.calorias) * 100, 100)}%`;
    if (elListaCal) {
        elListaCal.innerHTML = '';
        reg.calorias.forEach((item, indice) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${item.nome}: ${item.kcal} kcal
                <button class="btn-excluir" data-tipo="calorias" data-indice="${indice}">×</button>
            `;
            elListaCal.appendChild(li);
        });
    }

    // Água
    const totalAgua = reg.agua.reduce((s, i) => s + Number(i.valor || 0), 0);
    const elTotalAgua = document.getElementById('total-agua');
    const elMetaAgua = document.getElementById('meta-agua-texto');
    const elBarraAgua = document.getElementById('barra-agua');
    const elListaAgua = document.getElementById('lista-agua');
    
    if (elTotalAgua) elTotalAgua.textContent = totalAgua.toLocaleString('pt-BR');
    if (elMetaAgua) elMetaAgua.textContent = `/ ${dadosUsuario.metas.agua.toLocaleString('pt-BR')} ml`;
    if (elBarraAgua) elBarraAgua.style.width = `${Math.min((totalAgua / dadosUsuario.metas.agua) * 100, 100)}%`;
    if (elListaAgua) {
        elListaAgua.innerHTML = '';
        reg.agua.forEach((item, indice) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${item.valor} ml
                <button class="btn-excluir" data-tipo="agua" data-indice="${indice}">×</button>
            `;
            elListaAgua.appendChild(li);
        });
    }

    // Atividade
    const totalAtiv = reg.atividade.reduce((s, i) => s + Number(i.valor || 0), 0);
    const elTotalAtiv = document.getElementById('total-atividade');
    const elMetaAtiv = document.getElementById('meta-atividade-texto');
    const elBarraAtiv = document.getElementById('barra-atividade');
    const elListaAtiv = document.getElementById('lista-atividade');
    
    if (elTotalAtiv) elTotalAtiv.textContent = totalAtiv.toLocaleString('pt-BR');
    if (elMetaAtiv) elMetaAtiv.textContent = `/ ${dadosUsuario.metas.atividade.toLocaleString('pt-BR')} min`;
    if (elBarraAtiv) elBarraAtiv.style.width = `${Math.min((totalAtiv / dadosUsuario.metas.atividade) * 100, 100)}%`;
    if (elListaAtiv) {
        elListaAtiv.innerHTML = '';
        reg.atividade.forEach((item, indice) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${item.nome}: ${item.valor} min
                <button class="btn-excluir" data-tipo="atividade" data-indice="${indice}">×</button>
            `;
            elListaAtiv.appendChild(li);
        });
    }
}

// ============= ADICIONAR ITENS =============
const formRefeicao = document.getElementById('form-refeicao');
if (formRefeicao) {
    formRefeicao.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-refeicao').value.trim();
        const kcal = Number(document.getElementById('qtd-calorias').value);
        if (nome && kcal > 0) {
            const reg = obterRegistrosDoDia(dataSelecionada);
            reg.calorias.push({ nome, kcal });
            await salvar();
            atualizarPainelDoDia();
            renderizarCalendario();
            formRefeicao.reset();
        }
    });
}

const formAgua = document.getElementById('form-agua');
if (formAgua) {
    formAgua.addEventListener('submit', async (e) => {
        e.preventDefault();
        const valor = Number(document.getElementById('qtd-agua').value);
        if (valor > 0) {
            const reg = obterRegistrosDoDia(dataSelecionada);
            reg.agua.push({ valor });
            await salvar();
            atualizarPainelDoDia();
            renderizarCalendario();
            formAgua.reset();
        }
    });
}

const formAtividade = document.getElementById('form-atividade');
if (formAtividade) {
    formAtividade.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-atividade').value.trim();
        const valor = Number(document.getElementById('duracao-atividade').value);
        if (nome && valor > 0) {
            const reg = obterRegistrosDoDia(dataSelecionada);
            reg.atividade.push({ nome, valor });
            await salvar();
            atualizarPainelDoDia();
            renderizarCalendario();
            formAtividade.reset();
        }
    });
}

// ============= EXCLUIR ITENS =============
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-excluir')) {
        const tipo = e.target.dataset.tipo;
        const indice = Number(e.target.dataset.indice);
        const reg = obterRegistrosDoDia(dataSelecionada);
        reg[tipo].splice(indice, 1);
        await salvar();
        atualizarPainelDoDia();
        renderizarCalendario();
    }
});

// Iniciar quando a página carregar
document.addEventListener('DOMContentLoaded', iniciar);
