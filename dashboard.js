// ==========================================
// AGUARDAR PÁGINA CARREGAR COMPLETAMENTE
// ==========================================
document.addEventListener('DOMContentLoaded', async function() {

    // ==========================================
    // FIREBASE JÁ ESTÁ INICIALIZADO NO HTML
    // ==========================================
    const db = firebase.firestore();

    // ==========================================
    // VERIFICAR SESSÃO
    // ==========================================
    const usuarioId = localStorage.getItem('fittrack_usuario_atual');
    if (!usuarioId) {
        window.location.href = 'index.html';
        return; // ⬅️ importante parar a execução
    }

    let dadosUsuario = null;
    let dataSelecionada = new Date().toISOString().split('T')[0];

    // ==========================================
    // SALVAR NO FIREBASE
    // ==========================================
    async function salvar() {
        try {
            await db.collection('usuarios').doc(usuarioId).set(dadosUsuario);
            console.log('✅ SALVO!', dadosUsuario.metas);
            return true;
        } catch (e) {
            console.error('❌ ERRO AO SALVAR:', e);
            alert('Erro: ' + e.message);
            return false;
        }
    }

    // ==========================================
    // CARREGAR DO FIREBASE
    // ==========================================
    async function carregar() {
        console.log('📂 Carregando...');
        const doc = await db.collection('usuarios').doc(usuarioId).get();
        
        if (!doc.exists) {
            console.error('❌ Documento não encontrado!');
            alert('Usuário não encontrado. Faça login novamente.');
            localStorage.removeItem('fittrack_usuario_atual');
            window.location.href = 'index.html';
            return;
        }
        
        dadosUsuario = doc.data();
        console.log('✅ CARREGADO!', dadosUsuario);
        
        // Garantir estrutura padrão
        if (!dadosUsuario.metas) dadosUsuario.metas = { calorias: 2000, agua: 2500, atividade: 45 };
        if (!dadosUsuario.registros) dadosUsuario.registros = {};
        
        // Saudação
        const nome = dadosUsuario.nomeCompleto?.split(' ')[0] || dadosUsuario.usuario || 'Usuário';
        document.getElementById('saudacao-usuario').textContent = `Olá, ${nome}!`;
        
        // Preencher campos das metas
        document.getElementById('meta-calorias').value = dadosUsuario.metas.calorias;
        document.getElementById('meta-agua').value = dadosUsuario.metas.agua;
        document.getElementById('meta-atividade').value = dadosUsuario.metas.atividade;
        
        atualizarPainel();
    }

    // ==========================================
    // SALVAR METAS
    // ==========================================
    document.getElementById('form-metas').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        dadosUsuario.metas.calorias = Number(document.getElementById('meta-calorias').value);
        dadosUsuario.metas.agua = Number(document.getElementById('meta-agua').value);
        dadosUsuario.metas.atividade = Number(document.getElementById('meta-atividade').value);
        
        await salvar();
        atualizarPainel();
        alert('✅ Metas salvas!');
    });

    // ==========================================
    // ATUALIZAR EXIBIÇÃO DO PAINEL
    // ==========================================
    function atualizarPainel() {
        if (!dadosUsuario) return; // ⬅️ proteção extra
        
        const reg = dadosUsuario.registros[dataSelecionada] || { calorias:[], agua:[], atividade:[] };
        const totalCal = reg.calorias.reduce((s,i)=>s+(i.kcal||0),0);
        const totalAgua = reg.agua.reduce((s,i)=>s+(i.valor||0),0);
        const totalAtv = reg.atividade.reduce((s,i)=>s+(i.valor||0),0);
        
        document.getElementById('status-calorias').textContent = `${totalCal} / ${dadosUsuario.metas.calorias} kcal`;
        document.getElementById('status-agua').textContent = `${totalAgua} / ${dadosUsuario.metas.agua} ml`;
        document.getElementById('status-atividade').textContent = `${totalAtv} / ${dadosUsuario.metas.atividade} min`;
        
        document.getElementById('barra-calorias').style.width = `${Math.min((totalCal/dadosUsuario.metas.calorias)*100,100)}%`;
        document.getElementById('barra-agua').style.width = `${Math.min((totalAgua/dadosUsuario.metas.agua)*100,100)}%`;
        document.getElementById('barra-atividade').style.width = `${Math.min((totalAtv/dadosUsuario.metas.atividade)*100,100)}%`;
    }

    // ==========================================
    // ADICIONAR REFEIÇÃO
    // ==========================================
    document.getElementById('form-calorias').addEventListener('submit', async e => {
        e.preventDefault();
        const ref = document.getElementById('refeicao-nome').value;
        const ali = document.getElementById('alimento-nome').value;
        const kcal = Number(document.getElementById('alimento-kcal').value);
        
        if (!dadosUsuario.registros[dataSelecionada]) dadosUsuario.registros[dataSelecionada] = { calorias:[],agua:[],atividade:[] };
        dadosUsuario.registros[dataSelecionada].calorias.push({ refeicao: ref, alimento: ali, kcal: kcal });
        
        await salvar();
        atualizarPainel();
        document.getElementById('form-calorias').reset();
    });

    // ==========================================
    // ADICIONAR ÁGUA — BOTÕES RÁPIDOS
    // ==========================================
    document.querySelectorAll('.btn-agua-rapido').forEach(btn => {
        btn.addEventListener('click', async () => {
            const ml = Number(btn.dataset.ml);
            if (!dadosUsuario.registros[dataSelecionada]) dadosUsuario.registros[dataSelecionada] = { calorias:[],agua:[],atividade:[] };
            dadosUsuario.registros[dataSelecionada].agua.push({ descricao: 'Copo', valor: ml });
            await salvar();
            atualizarPainel();
        });
    });

    // ÁGUA — PERSONALIZADA
    document.getElementById('form-agua').addEventListener('submit', async e => {
        e.preventDefault();
        const ml = Number(document.getElementById('valor-agua').value);
        if (!dadosUsuario.registros[dataSelecionada]) dadosUsuario.registros[dataSelecionada] = { calorias:[],agua:[],atividade:[] };
        dadosUsuario.registros[dataSelecionada].agua.push({ descricao: 'Personalizado', valor: ml });
        await salvar();
        atualizarPainel();
        document.getElementById('valor-agua').value = '';
    });

    // ==========================================
    // ADICIONAR ATIVIDADE
    // ==========================================
    document.getElementById('form-atividade').addEventListener('submit', async e => {
        e.preventDefault();
        const nome = document.getElementById('desc-atividade').value;
        const min = Number(document.getElementById('valor-atividade').value);
        if (!dadosUsuario.registros[dataSelecionada]) dadosUsuario.registros[dataSelecionada] = { calorias:[],agua:[],atividade:[] };
        dadosUsuario.registros[dataSelecionada].atividade.push({ descricao: nome, valor: min });
        await salvar();
        atualizarPainel();
        document.getElementById('desc-atividade').value = '';
        document.getElementById('valor-atividade').value = '';
    });

    // ==========================================
    // SAIR
    // ==========================================
    document.getElementById('btn-sair').addEventListener('click', () => {
        localStorage.removeItem('fittrack_usuario_atual');
        window.location.href = 'index.html';
    });

    // ==========================================
    // INICIAR
    // ==========================================
    carregar();

}); // ⬅️ Fecha o DOMContentLoaded
