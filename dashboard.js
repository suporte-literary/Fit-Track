let usuarioAtual = null;
let dadosUsuario = null;

// INICIO
async function iniciar() {
    console.log('✅ Página carregou');
    
    // Verificar login
    firebase.auth().onAuthStateChanged(async function(usuario) {
        if (!usuario) {
            console.log('⚠️ Não está logado');
            window.location.href = 'index.html';
            return;
        }
        
        usuarioAtual = usuario;
        console.log('✅ Usuário:', usuario.email);
        
        // Saudação
        const saudacao = document.getElementById('saudacao-usuario');
        if (saudacao) saudacao.textContent = 'Olá, ' + usuario.email.split('@')[0] + '!';
        
        // Carregar dados
        await carregarDados();
        
        // Vincular botões
        vincularBotoes();
    });
}

// CARREGAR DADOS
async function carregarDados() {
    console.log('📂 Carregando dados...');
    
    const doc = await firebase.firestore()
        .collection('usuarios')
        .doc(usuarioAtual.uid)
        .get();
    
    if (doc.exists) {
        dadosUsuario = doc.data();
        console.log('✅ Dados carregados:', dadosUsuario);
    } else {
        dadosUsuario = {
            metas: { calorias: 2000, agua: 2500, atividade: 45 },
            registros: {}
        };
        console.log('📋 Dados novos criados');
    }
    
    if (!dadosUsuario.metas) dadosUsuario.metas = { calorias: 2000, agua: 2500, atividade: 45 };
    if (!dadosUsuario.registros) dadosUsuario.registros = {};
    
    // Mostrar valores nos campos
    document.getElementById('meta-calorias').value = dadosUsuario.metas.calorias;
    document.getElementById('meta-agua').value = dadosUsuario.metas.agua;
    document.getElementById('meta-atividade').value = dadosUsuario.metas.atividade;
}

// SALVAR DADOS
async function salvarTudo() {
    console.log('💾 Salvando...');
    try {
        await firebase.firestore()
            .collection('usuarios')
            .doc(usuarioAtual.uid)
            .set(dadosUsuario, { merge: true });
        console.log('✅ SALVO COM SUCESSO!');
        alert('✅ Salvo!');
        return true;
    } catch (erro) {
        console.error('❌ ERRO AO SALVAR:', erro);
        alert('Erro: ' + erro.message);
        return false;
    }
}

// VINCULAR BOTÕES
function vincularBotoes() {
    console.log('🔗 Vinculando botões...');
    
    // SALVAR METAS
    const formMetas = document.getElementById('form-metas');
    if (formMetas) {
        formMetas.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📝 Salvando metas...');
            
            dadosUsuario.metas.calorias = Number(document.getElementById('meta-calorias').value);
            dadosUsuario.metas.agua = Number(document.getElementById('meta-agua').value);
            dadosUsuario.metas.atividade = Number(document.getElementById('meta-atividade').value);
            
            await salvarTudo();
        });
    } else {
        console.error('❌ Formulário de metas NÃO encontrado!');
    }
}

// INICIAR
document.addEventListener('DOMContentLoaded', iniciar);
