// dashboard.js — Versão ajustada para seu HTML
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

        // Saudação
        const primeiroNome = usuarioAtual.email.split('@')[0];
        const elSaudacao = document.querySelector('.saudacao-usuario, [class*="olá"], h1');
        if (elSaudacao) elSaudacao.textContent = `Olá, ${primeiroNome}`;

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

        // Botão Sair
        const btnSair = document.querySelector('.btn-sair, button:contains("Sair")');
        if (btnSair) btnSair.addEventListener('click', async () => {
            await firebase.auth().signOut();
            window.location.href = 'index.html';
        });

        carregarValoresNaTela();
        renderizarCalendario();
        atualizarPainelDoDia();
        
        // Botão Atualizar Metas
        const btnAtualizarMetas = document.querySelector('button:contains("Atualizar Metas")');
        if (btnAtualizarMetas) {
            btnAtualizarMetas.addEventListener('click', salvarMetas);
        }

        // Formulários
        vincularFormularios();
        
    } catch (erro) {
        console.error('Erro ao inicializar:', erro);
    }
}

// ============= SALVAR NO FIREBASE =============
async function salvar() {
    if (!usuarioAtual) return;
    try {
        await firebase.firestore().collection('usuarios').doc(usuarioAtual.uid).set(dadosUsuario, { merge: true });
        console.log('✅ Dados salvos!');
    } catch (erro) {
        console.error('❌ Erro ao salvar:', erro);
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

// ============= CARREGAR VALORES NA TELA =============
function carregarValoresNaTela() {
    // Metas
    const inputMetaCal = document.querySelector('input[placeholder*="Calorias"], input[placeholder*="calorias"]');
    const inputMetaAgua = document.querySelector('input[placeholder*="Água"], input[placeholder*="água"]');
    const inputMetaAtiv = document.querySelector('input[placeholder*="Atividade"], input[placeholder*="Física"]');

    if (inputMetaCal) inputMetaCal.value = dadosUsuario.metas.calorias;
    if (inputMetaAgua) inputMetaAgua.value = dadosUsuario.metas.agua;
    if (inputMetaAtiv) inputMetaAtiv.value = dadosUsuario.metas.atividade;
}

// ============= SALVAR METAS =============
async function salvarMetas() {
    const inputMetaCal = document.querySelector('input[placeholder*="Calorias"], input[placeholder*="calorias"]');
    const inputMetaAgua = document.querySelector('input[placeholder*="Água"], input[placeholder*="água"]');
    const inputMetaAtiv = document.querySelector('input[placeholder*="Atividade"], input[placeholder*="Física"]');

    if (inputMetaCal && Number(inputMetaCal.value) > 0) {
        dadosUsuario.metas.calorias = Number(inputMetaCal.value);
    }
    if (inputMetaAgua && Number(inputMetaAgua.value) > 0) {
        dadosUsuario.metas.agua = Number(inputMetaAgua.value);
    }
    if (inputMetaAtiv && Number(inputMetaAtiv.value) > 0) {
        dadosUsuario.metas.atividade = Number(inputMetaAtiv.value);
    }

    await salvar();
    atualizarPainelDoDia();
    alert('✅ Metas atualizadas!');
}

// ============= CALENDÁRIO =============
function renderizarCalendario() {
    const container = document.querySelector('.dias-semana, .calendario, [class*="dom"], [class*="seg"]');
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
        const diaMes = data.getDate();

        const ehHoje = dataISO === formatarDataISO(hoje) ? 'dia-hoje' : '';
        const ehSelecionado = dataISO === dataSelecionada ? 'dia-selecionado' : '';

        const div = document.createElement('div');
        div.className = `dia-semana ${ehHoje} ${ehSelecionado}`;
        div.innerHTML = `
            <div style="font-size:12px;color:#888;">${nomesDias[i]}</div>
            <div style="font-weight:bold;">${diaMes}</div>
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

    // Totais
    const totalCal = reg.calorias.reduce((s, i) => s + Number(i.kcal || 0), 0);
    const totalAgua = reg.agua.reduce((s, i) => s + Number(i.valor || 0), 0);
    const totalAtiv = reg.atividade.reduce((s, i) => s + Number(i.valor || 0), 0);

    // Atualizar textos
    const elCal = document.querySelector('div:contains("/ kcal"), span:contains("/ kcal")');
    const elAgua = document.querySelector('div:contains("/ ml"), span:contains("/ ml")');
    const elAtiv = document.querySelector('div:contains("/ min"), span:contains("/ min")');

    if (elCal) elCal.innerHTML = `${totalCal} / ${dadosUsuario.metas.calorias} kcal`;
    if (elAgua) elAgua.innerHTML = `${totalAgua} / ${dadosUsuario.metas.agua} ml`;
    if (elAtiv) elAtiv.innerHTML = `${totalAtiv} / ${dadosUsuario.metas.atividade} min`;
}

// ============= VINCULAR FORMULÁRIOS =============
function vincularFormularios() {
    // ==== REFEIÇÕES / CALORIAS ====
    const btnAddRefeicao = document.querySelector('button:contains("+"), button img[alt*="+"]');
    if (btnAddRefeicao) {
        btnAddRefeicao.addEventListener('click', async () => {
            const nomeRef = document.querySelector('input[placeholder*="Refeição"], input[placeholder*="Ex: Almoço"]');
            const nomeAlim = document.querySelector('input[placeholder*="Alimento"], input[placeholder*="Ex: Arroz"]');
            const gramas = document.querySelector('input[placeholder*="Gramas"]');
            const kcal = document.querySelector('input[placeholder*="Calorias (kcal)"]');

            if (!nomeRef || !nomeAlim || !kcal) return;
            
            const nome = `${nomeRef.value.trim()} - ${nomeAlim.value.trim()}`;
            const valorKcal = Number(kcal.value);

            if (nome && valorKcal > 0) {
                const reg = obterRegistrosDoDia(dataSelecionada);
                reg.calorias.push({ nome: nome, kcal: valorKcal });
                await salvar();
                atualizarPainelDoDia();
                
                // Limpar campos
                if (nomeRef) nomeRef.value = '';
                if (nomeAlim) nomeAlim.value = '';
                if (gramas) gramas.value = '';
                if (kcal) kcal.value = '';
            }
        });
    }

    // ==== ÁGUA ====
    const btn250 = document.querySelector('button:contains("+ 250ml")');
    const btn500 = document.querySelector('button:contains("+ 500ml")');
    const btnOutraAgua = document.querySelector('button[style*="background:green"], button:contains("✓")');
    const inputOutraAgua = document.querySelector('input[placeholder*="Outra qtd"]');

    if (btn250) {
        btn250.addEventListener('click', async () => {
            const reg = obterRegistrosDoDia(dataSelecionada);
            reg.agua.push({ valor: 250 });
            await salvar();
            atualizarPainelDoDia();
        });
    }

    if (btn500) {
        btn500.addEventListener('click', async () => {
            const reg = obterRegistrosDoDia(dataSelecionada);
            reg.agua.push({ valor: 500 });
            await salvar();
            atualizarPainelDoDia();
        });
    }

    if (btnOutraAgua && inputOutraAgua) {
        btnOutraAgua.addEventListener('click', async () => {
            const valor = Number(inputOutraAgua.value);
            if (valor > 0) {
                const reg = obterRegistrosDoDia(dataSelecionada);
                reg.agua.push({ valor: valor });
                await salvar();
                atualizarPainelDoDia();
                inputOutraAgua.value = '';
            }
        });
    }

    // ==== ATIVIDADE FÍSICA ====
    const btnAddAtiv = document.querySelector('.atividade button:contains("+"), button:has(+ input[placeholder*="Minutos"]) + button');
    if (btnAddAtiv) {
        btnAddAtiv.addEventListener('click', async () => {
            const nomeAtiv = document.querySelector('input[placeholder*="Ex: Corrida"]');
            const minutos = document.querySelector('input[placeholder*="Minutos"]');

            if (nomeAtiv && minutos) {
                const nome = nomeAtiv.value.trim();
                const valorMin = Number(minutos.value);

                if (nome && valorMin > 0) {
                    const reg = obterRegistrosDoDia(dataSelecionada);
                    reg.atividade.push({ nome: nome, valor: valorMin });
                    await salvar();
                    atualizarPainelDoDia();
                    
                    nomeAtiv.value = '';
                    minutos.value = '';
                }
            }
        });
    }
}

// Iniciar quando a página carregar
document.addEventListener('DOMContentLoaded', iniciar);
