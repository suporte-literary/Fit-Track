import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCLHmqR0bDmq7j-q-E0I456DlAgWMIKkgY",
    authDomain: "fittrack-59829.firebaseapp.com",
    projectId: "fittrack-59829",
    storageBucket: "fittrack-59829.firebasestorage.app",
    messagingSenderId: "384935605390",
    appId: "1:384935605390:web:2eb5540c6e3031781a85df"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async function() {
    const usuarioId = localStorage.getItem('fittrack_usuario_atual');
    if (!usuarioId) {
        window.location.href = 'index.html';
        return;
    }

    const userDocRef = doc(db, 'usuarios', usuarioId);

    let dadosUsuario = null;
    let dataSelecionada = formatarDataLocal(new Date());
    let mesAtual = new Date().getMonth();
    let anoAtual = new Date().getFullYear();

    function formatarDataLocal(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }

    function formatarDataTitulo(iso) {
        const hoje = formatarDataLocal(new Date());
        if (iso === hoje) return 'Hoje';
        const [ano, mes, dia] = iso.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    async function salvar() {
        try {
            await setDoc(userDocRef, dadosUsuario);
            console.log('✅ SALVO!', dadosUsuario);
            return true;
        } catch (e) {
            console.error('❌ ERRO AO SALVAR:', e);
            alert('Erro ao salvar: ' + e.message);
            return false;
        }
    }

    async function carregar() {
        try {
            console.log('📂 Carregando...');
            const docSnap = await getDoc(userDocRef);

            if (!docSnap.exists()) {
                console.error('❌ Documento não encontrado!');
                alert('Usuário não encontrado. Faça login novamente.');
                localStorage.removeItem('fittrack_usuario_atual');
                window.location.href = 'index.html';
                return;
            }

            dadosUsuario = docSnap.data();
            console.log('✅ CARREGADO!', dadosUsuario);

            if (!dadosUsuario.metas) dadosUsuario.metas = { calorias: 2000, agua: 2500, atividade: 45 };
            if (!dadosUsuario.registros) dadosUsuario.registros = {};

            const nome = dadosUsuario.nomeCompleto?.split(' ')[0] || dadosUsuario.usuario || 'Usuário';
            document.getElementById('saudacao-usuario').textContent = `Olá, ${nome}!`;

            document.getElementById('meta-calorias').value = dadosUsuario.metas.calorias;
            document.getElementById('meta-agua').value = dadosUsuario.metas.agua;
            document.getElementById('meta-atividade').value = dadosUsuario.metas.atividade;

            renderizarCalendario();
            atualizarPainel();
        } catch (e) {
            console.error('❌ ERRO AO CARREGAR:', e);
            alert('Erro ao carregar dados: ' + e.message);
        }
    }

    function garantirRegistroDia() {
        if (!dadosUsuario.registros[dataSelecionada]) {
            dadosUsuario.registros[dataSelecionada] = { calorias: [], agua: [], atividade: [] };
        }
        if (!dadosUsuario.registros[dataSelecionada].calorias) dadosUsuario.registros[dataSelecionada].calorias = [];
        if (!dadosUsuario.registros[dataSelecionada].agua) dadosUsuario.registros[dataSelecionada].agua = [];
        if (!dadosUsuario.registros[dataSelecionada].atividade) dadosUsuario.registros[dataSelecionada].atividade = [];
    }

    // Atualizar Metas
    document.getElementById('form-metas').addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!dadosUsuario) return;

        dadosUsuario.metas.calorias = Number(document.getElementById('meta-calorias').value);
        dadosUsuario.metas.agua = Number(document.getElementById('meta-agua').value);
        dadosUsuario.metas.atividade = Number(document.getElementById('meta-atividade').value);

        const ok = await salvar();
        if (ok) {
            atualizarPainel();
            alert('✅ Metas salvas!');
        }
    });

    // Adicionar Calorias e Refeições
    document.getElementById('form-calorias').addEventListener('submit', async e => {
        e.preventDefault();
        if (!dadosUsuario) return;

        const ref = document.getElementById('refeicao-nome').value;
        const ali = document.getElementById('alimento-nome').value;
        const gramas = Number(document.getElementById('alimento-gramas').value);
        const kcal = Number(document.getElementById('alimento-kcal').value);

        garantirRegistroDia();
        dadosUsuario.registros[dataSelecionada].calorias.push({
            refeicao: ref,
            alimento: ali,
            gramas: gramas,
            kcal: kcal
        });

        await salvar();
        atualizarPainel();
        document.getElementById('form-calorias').reset();
    });

    // Atalhos de Água
    document.querySelectorAll('.btn-agua-rapido').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!dadosUsuario) return;
            const ml = Number(btn.dataset.ml);
            garantirRegistroDia();
            dadosUsuario.registros[dataSelecionada].agua.push({ descricao: 'Copo', valor: ml });
            await salvar();
            atualizarPainel();
        });
    });

    // Adicionar Água Personalizada
    document.getElementById('form-agua').addEventListener('submit', async e => {
        e.preventDefault();
        if (!dadosUsuario) return;
        const ml = Number(document.getElementById('valor-agua').value);
        garantirRegistroDia();
        dadosUsuario.registros[dataSelecionada].agua.push({ descricao: 'Personalizado', valor: ml });
        await salvar();
        atualizarPainel();
        document.getElementById('valor-agua').value = '';
    });

    // Adicionar Atividade Física
    document.getElementById('form-atividade').addEventListener('submit', async e => {
        e.preventDefault();
        if (!dadosUsuario) return;
        const nome = document.getElementById('desc-atividade').value;
        const min = Number(document.getElementById('valor-atividade').value);
        garantirRegistroDia();
        dadosUsuario.registros[dataSelecionada].atividade.push({ descricao: nome, valor: min });
        await salvar();
        atualizarPainel();
        document.getElementById('desc-atividade').value = '';
        document.getElementById('valor-atividade').value = '';
    });

    // Atualizar Barras e Listas na Tela
    function atualizarPainel() {
        if (!dadosUsuario) return;

        document.getElementById('data-selecionada-texto').textContent = formatarDataTitulo(dataSelecionada);

        const reg = dadosUsuario.registros[dataSelecionada] || { calorias: [], agua: [], atividade: [] };
        const totalCal = reg.calorias.reduce((s, i) => s + (i.kcal || 0), 0);
        const totalAgua = reg.agua.reduce((s, i) => s + (i.valor || 0), 0);
        const totalAtv = reg.atividade.reduce((s, i) => s + (i.valor || 0), 0);

        document.getElementById('status-calorias').textContent = `${totalCal} / ${dadosUsuario.metas.calorias} kcal`;
        document.getElementById('status-agua').textContent = `${totalAgua} / ${dadosUsuario.metas.agua} ml`;
        document.getElementById('status-atividade').textContent = `${totalAtv} / ${dadosUsuario.metas.atividade} min`;

        document.getElementById('barra-calorias').style.width = `${Math.min((totalCal / dadosUsuario.metas.calorias) * 100, 100)}%`;
        document.getElementById('barra-agua').style.width = `${Math.min((totalAgua / dadosUsuario.metas.agua) * 100, 100)}%`;
        document.getElementById('barra-atividade').style.width = `${Math.min((totalAtv / dadosUsuario.metas.atividade) * 100, 100)}%`;

        // Renderizar Lista de Refeições
        const listaRefeicoes = document.getElementById('lista-refeicoes');
        listaRefeicoes.innerHTML = '';
        reg.calorias.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'item-refeicao';
            const textoGramas = item.gramas ? ` (${item.gramas}g)` : '';
            div.innerHTML = `
                <span><strong>${item.refeicao}:</strong> ${item.alimento}${textoGramas} - ${item.kcal} kcal</span>
                <button type="button" class="btn-remover" data-tipo="calorias" data-index="${index}">✕</button>
            `;
            listaRefeicoes.appendChild(div);
        });

        // Renderizar Lista de Água
        const listaAgua = document.getElementById('lista-agua');
        listaAgua.innerHTML = '';
        reg.agua.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.descricao}: +${item.valor} ml</span>
                <button type="button" class="btn-remover" data-tipo="agua" data-index="${index}">✕</button>
            `;
            listaAgua.appendChild(li);
        });

        // Renderizar Lista de Atividades
        const listaAtividade = document.getElementById('lista-atividade');
        listaAtividade.innerHTML = '';
        reg.atividade.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.descricao}: ${item.valor} min</span>
                <button type="button" class="btn-remover" data-tipo="atividade" data-index="${index}">✕</button>
            `;
            listaAtividade.appendChild(li);
        });

        // Eventos para remover itens
