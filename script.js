// Configuração do Firebase
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

// --- LOGIN ---
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario-login').value.trim();
    const senha = document.getElementById('senha-login').value;
    const aviso = document.getElementById('aviso-login');

    try {
        const snapshot = await db.collection('usuarios')
            .where('usuario', '==', usuario)
            .get();

        if (snapshot.empty) {
            aviso.textContent = '⚠️ Usuário não encontrado';
            return;
        }

        const doc = snapshot.docs[0];
        const dados = doc.data();

        if (dados.senha !== senha) {
            aviso.textContent = '⚠️ Senha incorreta';
            return;
        }

        // Salvar ID da sessão
        localStorage.setItem('fittrack_usuario_atual', doc.id);
        window.location.href = 'dashboard.html';
    } catch (erro) {
        aviso.textContent = '❌ Erro: ' + erro.message;
    }
});

// --- CRIAR CONTA ---
document.getElementById('form-criar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nomeCompleto = document.getElementById('nome-completo').value.trim();
    const usuario = document.getElementById('usuario-criar').value.trim();
    const senha = document.getElementById('senha-criar').value;
    const aviso = document.getElementById('aviso-criar');

    try {
        // Verificar se usuário já existe
        const existe = await db.collection('usuarios')
            .where('usuario', '==', usuario)
            .get();

        if (!existe.empty) {
            aviso.textContent = '⚠️ Nome de usuário já existe';
            return;
        }

        // Criar novo usuário
        const novoUsuario = {
            nomeCompleto: nomeCompleto,
            usuario: usuario,
            senha: senha,
            metas: { calorias: 2000, agua: 2500, atividade: 45 },
            registros: {}
        };

        await db.collection('usuarios').add(novoUsuario);
        aviso.textContent = '✅ Conta criada! Faça login.';
        aviso.style.color = '#4ade80';
        
        // Limpar formulário
        document.getElementById('form-criar').reset();
        
        // Ir para aba de login
        document.querySelector('[data-tab="entrar"]').click();
    } catch (erro) {
        aviso.textContent = '❌ Erro: ' + erro.message;
    }
});
