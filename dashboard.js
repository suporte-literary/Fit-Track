let usuarioAtual = null;
let dadosUsuario = null;
let dataSelecionada = formatarDataISO(new Date());

// ============= INICIALIZAÇÃO =============
async function iniciar() {
    try {
        console.log('🚀 Iniciando FitTrack...');
        
        // Aguardar usuário logado
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

        // Saudação
        const primeiroNome = usuarioAtual.email.split('@')[0];
        const elSaudacao = document.getElementById('saudacao-usuario');
        if (elSaudacao) elSaudacao.textContent = `Olá, ${primeiroNome}!`;

        // Carregar dados do Firestore
        const docSnap = await firebase.firestore()
            .collection('usuarios')
            .doc(usuarioAtual.uid)
            .get();
        
        if (docSnap.exists) {
            dadosUsuario = docSnap.data();
            console.log('✅ Dados carregados do Firestore');
        } else {
            dadosUsuario = {
                metas: { calorias: 2000, agua: 2500, atividade: 45 },
                registros: {}
            };
            console.log('📋 Dados padrão criados');
        }

        if (!dadosUsuario.metas) dadosUsuario.metas = { calorias: 2000, agua: 2500, atividade: 45 };
        if (!dadosUsuario.registros) dadosUsuario.registros = {};

        // Botão Sair
        const btnSair = document.getElementById('btn-sair');
        if (btnSair) btnSair.addEventListener('click', async () => {
            await firebase.auth().signOut();
            window.location.href = 'index.html';
        });

        carregarMetasNosInputs();
        renderizarCalendario();
        atualizarPainelDoDia();
        vincularEventosFormularios();
        
        console.log('🎉 Pronto para usar!');
    } catch (erro) {
        console.error('❌ Erro ao inicializar:', erro);
        alert('Erro ao carregar dados: ' + erro.message);
    }
}

// ============= SALVAR DADOS NO FIREBASE =============
async function salvarDados() {
    if (!usuarioAtual) return;
    try {
        await firebase.firestore()
            .collection('usuarios')
            .doc(usuarioAtual.uid)
            .set(dadosUsuario, { merge: true });
        console.log('💾 Dados salvos com sucesso!');
        return true;
    } catch (erro) {
        console.error('❌ Erro ao salvar:', erro);
        alert('Erro ao salvar: ' + erro.message);
        return false;
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

// ============= CARREGAR METAS NOS CAMPOS =============
function carregarMetasNosInputs() {
    const inputCal = document.getElementById('meta-calorias');
    const inputAgua = document.getElementById('meta-agua');
    const inputAtv = document.getElementById('meta-atividade');

    if (inputCal) inputCal.value = dadosUsuario.metas.calorias;
    if (inputAgua) inputAgua.value = dadosUsuario.metas.agua;
    if (inputAtv) inputAtv.value = dadosUsuario.metas.atividade;
}

// ============= SALVAR METAS =============
const formMetas = document.getElementById('form-metas');
if (formMetas) {
    formMetas.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const cal = Number(document.getElementById('meta-calorias').value);
        const agua = Number(document.getElementById('meta-agua').value);
        const atv = Number(document.getElementById('meta-atividade').value);
        
        if (cal > 0) dadosUsuario.metas.calorias = cal;
        if (agua > 0) dadosUsuario.metas.agua = agua;
        if (atv > 0) dadosUsuario.metas.atividade = atv;
        
        await salvarDados();
        atualizarPainelDoDia();
        alert('✅ Metas salvas!');
    });
}

// ============= CALENDÁRIO =============
let dataAtual = new Date();

function renderizarCalendario() {
    const container = document.getElementById('grade-dias');
    const mesAnoTexto = document.getElementById('mes-ano-atual');
    if (!container) return;
    
    container.innerHTML = '';

    const nomeMeses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    mesAnoTexto.textContent = `${nomeMeses[dataAtual.getMonth()]} ${dataAtual.getFullYear()}`;

    const primeiroDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
    const ultimoDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
    const diaSemanaInicio = primeiroDia.getDay();
    const totalDias = ultimoDia.getDate();
    const hoje = new Date();
    const hojeISO = formatarDataISO(hoje);

    // Dias vazios antes do mês começar
    for (let i = 0; i < diaSemanaInicio; i++) {
        const vazio = document.createElement('div');
        vazio.className = 'dia-vazio';
        container.appendChild(vazio);
    }

    // Dias do mês
    for (let dia = 1; dia <= totalDias; dia++) {
        const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dia);
        const dataISO = formatarDataISO(data);
        const reg = dadosUsuario.registros[dataISO] || { calorias: [], agua: [], atividade: [] };
        
        const totalCal = reg.calorias.reduce((s, i) => s + Number(i.kcal || 0), 0);
        const totalAgua = reg.agua.reduce((s, i) => s + Number(i.ml || i.valor || 0), 0);
        const totalAtv = reg.atividade.reduce((s, i) => s + Number(i.min || i.valor || 0), 0);
        
        const calOk = totalCal > 0 && totalCal <= dadosUsuario.metas.calorias;
        const agOk = totalAgua >= dadosUsuario.metas.agua * 0.8;
        const atOk = totalAtv >= dadosUsuario.metas.atividade;
        const concluidas = [calOk, agOk, atOk].filter(Boolean).length;

        let classeStatus = '';
        if (concluidas === 3) classeStatus = 'meta-completa';
        else if (concluidas > 0) classeStatus = 'meta-parcial';

        const ehHoje = dataISO === hojeISO ? 'dia-hoje' : '';
        const ehSelecionado = dataISO === dataSelecionada ? 'dia-selecionado' : '';

        const div = document.createElement('button');
        div.type = 'button';
        div.className = `dia-mes ${ehHoje} ${ehSelecionado} ${classeStatus}`;
        div.textContent = dia;
        div.addEventListener('click', () => {
            dataSelecionada = dataISO;
            atualizarPainelDoDia();
            // Atualizar seleção visual
            document.querySelectorAll('.dia-mes').forEach(d => d.classList.remove('dia-selecionado'));
            div.classList.add('dia-selecionado');
            document.getElementById('data-selecionada-texto').textContent = formatarDataBr(dataISO);
        });
        container.appendChild(div);
    }
}

// Navegação do mês
const btnMesAnterior = document.getElementById('mes-anterior');
const btnProximoMes = document.getElementById('proximo-mes');
if (btnMesAnterior) btnMesAnterior.addEventListener('click', () => {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    renderizarCalendario();
});
if (btnProximoMes) btnProximoMes.addEventListener('click', () => {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    renderizarCalendario();
});

// ============= ATUALIZAR PAINEL DO DIA =============
function atualizarPainelDoDia() {
    const reg = obterRegistrosDoDia(dataSelecionada);

    // Totais
    const totalCal = reg.calorias.reduce((s, i) => s + Number(i.kcal || 0), 0);
    const totalAgua = reg.agua.reduce((s, i) => s + Number(i.ml || i.valor || 0), 0);
    const totalAtiv = reg.atividade.reduce((s, i) => s + Number(i.min || i.valor || 0), 0);

    // Atualizar textos
    const elStatusCal = document.getElementById('status-calorias');
    const elStatusAgua = document.getElementById('status-agua');
    const elStatusAtiv = document.getElementById('status-atividade');
    
    if (elStatusCal) elStatusCal.textContent = `${totalCal} / ${dadosUsuario.metas.calorias} kcal`;
    if (elStatusAgua) elStatusAgua.textContent = `${totalAgua} / ${dadosUsuario.metas.agua} ml`;
    if (elStatusAtiv) elStatusAtiv.textContent = `${totalAtiv} / ${dadosUsuario.metas.atividade} min`;

    // Barras de progresso
    const barraCal = document.getElementById('barra-calorias');
    const barraAgua = document.getElementById('barra-agua');
    const barraAtiv = document.getElementById('barra-atividade');
    
    if (barraCal) barraCal.style.width = `${Math.min((totalCal / dadosUsuario.metas.calorias) * 100, 100)}%`;
    if (barraAgua) barraAgua.style.width = `${Math.min((totalAgua / dadosUsuario.metas.agua) * 100, 100)}%`;
    if (barraAtiv) barraAtiv.style.width = `${Math.min((totalAtiv / dadosUsuario.metas.atividade) * 100, 100)}%`;

    // Listas
    const listaRef = document.getElementById('lista-refeicoes');
    const listaAgua = document.getElementById('lista-agua');
    const listaAtiv = document.getElementById('lista-atividade');

    if (listaRef) {
        listaRef.innerHTML = '';
        reg.calorias.forEach((item, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.nome} — ${item.kcal} kcal</span>
                <button data-tipo="calorias" data-idx="${idx}" class="btn-excluir">×</button>
            `;
            listaRef.appendChild(li);
        });
    }

    if (listaAgua) {
        listaAgua.innerHTML = '';
        reg.agua.forEach((item, idx) => {
            const valor = item.ml || item.valor;
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${valor} ml</span>
                <button data-tipo="agua" data-idx="${idx}" class="btn-excluir">×</button>
            `;
            listaAgua.appendChild(li);
        });
    }

    if (listaAtiv) {
        listaAtiv.innerHTML = '';
        reg.atividade.forEach((item, idx) => {
            const valor = item.min || item.valor;
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.nome} — ${valor} min</span>
                <button data-tipo="atividade" data-idx="${idx}" class="btn-excluir">×</button>
            `;
            listaAtiv.appendChild(li);
        });
    }
}

// ============= VINCULAR FORMULÁRIOS =============
function vincularEventosFormularios() {
    // ==== REFEIÇÕES / CALORIAS ====
    const formCalorias = document.getElementById('form-calorias');
    if (formCalorias) {
        formCalorias.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nomeRef = document.getElementById('refeicao-nome').value.trim();
            const nomeAlim = document.getElementById('alimento-nome').value.trim();
            const gramas = document.getElementById('alimento-gramas').value;
            const kcal = Number(document.getElementById('alimento-kcal').value);
            
            if (nomeRef && kcal > 0) {
                const reg = obterRegistrosDoDia(dataSelecionada);
                reg.calorias.push({ 
                    nome: `${nomeRef}${nomeAlim ? ' — ' + nomeAlim : ''} (${gramas}g)`, 
                    kcal: kcal 
                });
                await salvarDados();
                atualizarPainelDoDia();
                renderizarCalendario();
                formCalorias.reset();
            }
        });
    }

    // ==== ÁGUA — Botões rápidos ====
    document.querySelectorAll('.btn-agua-rapido').forEach(btn => {
        btn.addEventListener('click', async function() {
            const ml = Number(this.dataset.ml);
            const reg = obterRegistrosDoDia(dataSelecionada);
            reg.agua.push({ ml: ml });
            await salvarDados();
            atualizarPainelDoDia();
            renderizarCalendario();
        });
    });

    // ==== ÁGUA — Formulário personalizado ====
    const formAgua = document.getElementById('form-agua');
    if (formAgua) {
        formAgua.addEventListener('submit', async function(e) {
            e.preventDefault();
            const ml = Number(document.getElementById('valor-agua').value);
            if (ml > 0) {
                const reg = obterRegistrosDoDia(dataSelecionada);
                reg.agua.push({ ml: ml });
                await salvarDados();
                atualizarPainelDoDia();
                renderizarCalendario();
                formAgua.reset();
            }
        });
    }

    // ==== ATIVIDADE FÍSICA ====
    const formAtividade = document.getElementById('form-atividade');
    if (formAtividade) {
        formAtividade.addEventListener('submit', async function(e) {
            e.preventDefault();
            const nome = document.getElementById('desc-atividade').value.trim();
            const minutos = Number(document.getElementById('valor-atividade').value);
            
            if (nome && minutos > 0) {
                const reg = obterRegistrosDoDia(dataSelecionada);
                reg.atividade.push({ nome: nome, min: minutos });
                await salvarDados();
                atualizarPainelDoDia();
                renderizarCalendario();
                formAtividade.reset();
            }
        });
    }

    // ==== EXCLUIR ITENS ====
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('btn-excluir')) {
            const tipo = e.target.dataset.tipo;
            const idx = Number(e.target.dataset.idx);
            const reg = obterRegistrosDoDia(dataSelecionada);
            reg[tipo].splice(idx, 1);
            await salvarDados();
            atualizarPainelDoDia();
            renderizarCalendario();
        }
    });
}

// Iniciar quando a página estiver pronta
document.addEventListener('DOMContentLoaded', iniciar);
