document.addEventListener('DOMContentLoaded', async function() {

    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase não carregou! Verifique a ordem das tags <script> no HTML.');
        alert('Erro de carregamento. Atualize a página.');
        return;
    }

    const db = firebase.firestore();

    const usuarioId = localStorage.getItem('fittrack_usuario_atual');
    if (!usuarioId) {
        window.location.href = 'index.html';
        return;
    }

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
            await db.collection('usuarios').doc(usuarioId).set(dadosUsuario);
            console.log('✅ SALVO!', dadosUsuario.metas);
            return true;
        } catch (e) {
            console.error('❌ ERRO AO SALVAR:', e);
            alert('Erro: ' + e.message);
            return false;
        }
    }

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

        if (!dadosUsuario.metas) dadosUsuario.metas = { calorias: 2000, agua: 2500, atividade: 45 };
        if (!dadosUsuario.registros) dadosUsuario.registros = {};

        const nome = dadosUsuario.nomeCompleto?.split(' ')[0] || dadosUsuario.usuario || 'Usuário';
        document.getElementById('saudacao-usuario').textContent = `Olá, ${nome}!`;

        document.getElementById('meta-calorias').value = dadosUsuario.metas.calorias;
        document.getElementById('meta-agua').value = dadosUsuario.metas.agua;
        document.getElementById('meta-atividade').value = dadosUsuario.metas.atividade;

        renderizarCalendario();
        atualizarPainel();
    }

    function garantirRegistroDia() {
        if (!dadosUsuario.registros[dataSelecionada]) {
            dadosUsuario.registros[dataSelecionada] = { calorias: [], agua: [], atividade: [] };
        }
        if (!dadosUsuario.registros[dataSelecionada].calorias) dadosUsuario.registros[dataSelecionada].calorias = [];
        if (!dadosUsuario.registros[dataSelecionada].agua) dadosUsuario.registros[dataSelecionada].agua = [];
        if (!dadosUsuario.registros[dataSelecionada].atividade) dadosUsuario.registros[dataSelecionada].atividade = [];
    }

    document.getElementById('form-metas').addEventListener('submit', async function(e) {
        e.preventDefault();

        dadosUsuario.metas.calorias = Number(document.getElementById('meta-calorias').value);
        dadosUsuario.metas.agua = Number(document.getElementById('meta-agua').value);
        dadosUsuario.metas.atividade = Number(document.getElementById('meta-atividade').value);

        await salvar();
        atualizarPainel();
        alert('✅ Metas salvas!');
    });

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

        // Renderizar Refeições
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

        // Renderizar Água
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

        // Renderizar Atividades
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

        // Remover itens
        document.querySelectorAll('.btn-remover').forEach(btn => {
            btn.addEventListener('click', async () => {
                const tipo = btn.dataset.tipo;
                const index = Number(btn.dataset.index);
                dadosUsuario.registros[dataSelecionada][tipo].splice(index, 1);
                await salvar();
                atualizarPainel();
            });
        });
    }

    document.getElementById('form-calorias').addEventListener('submit', async e => {
        e.preventDefault();
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

    document.querySelectorAll('.btn-agua-rapido').forEach(btn => {
        btn.addEventListener('click', async () => {
            const ml = Number(btn.dataset.ml);
            garantirRegistroDia();
            dadosUsuario.registros[dataSelecionada].agua.push({ descricao: 'Copo', valor: ml });
            await salvar();
            atualizarPainel();
        });
    });

    document.getElementById('form-agua').addEventListener('submit', async e => {
        e.preventDefault();
        const ml = Number(document.getElementById('valor-agua').value);
        garantirRegistroDia();
        dadosUsuario.registros[dataSelecionada].agua.push({ descricao: 'Personalizado', valor: ml });
        await salvar();
        atualizarPainel();
        document.getElementById('valor-agua').value = '';
    });

    document.getElementById('form-atividade').addEventListener('submit', async e => {
        e.preventDefault();
        const nome = document.getElementById('desc-atividade').value;
        const min = Number(document.getElementById('valor-atividade').value);
        garantirRegistroDia();
        dadosUsuario.registros[dataSelecionada].atividade.push({ descricao: nome, valor: min });
        await salvar();
        atualizarPainel();
        document.getElementById('desc-atividade').value = '';
        document.getElementById('valor-atividade').value = '';
    });

    // Calendário
    function renderizarCalendario() {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        document.getElementById('mes-ano-atual').textContent = `${meses[mesAtual]} ${anoAtual}`;

        const grade = document.getElementById('grade-dias');
        grade.innerHTML = '';

        const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
        const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();
        const hojeISO = formatarDataLocal(new Date());

for (let i = 0; i < primeiroDia; i++) {
grade.appendChild(document.createElement('span'));
}
for (let dia = 1; dia <= ultimoDia; dia++) {
const btn = document.createElement('button');
btn.type = 'button';
btn.textContent = dia;
const iso = ${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')};
if (iso === dataSelecionada) btn.classList.add('selecionado');
if (iso === hojeISO) btn.classList.add('hoje');
btn.addEventListener('click', () => {
dataSelecionada = iso;
renderizarCalendario();
atualizarPainel();
});
grade.appendChild(btn);
}
}
document.getElementById('mes-anterior').addEventListener('click', () => {
mesAtual--;
if (mesAtual < 0) {
mesAtual = 11;
anoAtual--;
}
renderizarCalendario();
});
document.getElementById('proximo-mes').addEventListener('click', () => {
mesAtual++;
if (mesAtual > 11) {
mesAtual = 0;
anoAtual++;
}
renderizarCalendario();
});
document.getElementById('btn-sair').addEventListener('click', () => {
localStorage.removeItem('fittrack_usuario_atual');
window.location.href = 'index.html';
});
carregar();
});
