// Elementos da interface
const formLogin = document.getElementById('form-login');
const formCadastro = document.getElementById('form-cadastro');
const linkParaCadastro = document.getElementById('ir-para-cadastro');
const linkParaLogin = document.getElementById('ir-para-login');
const subtitulo = document.getElementById('subtitulo-auth');
const boxMensagem = document.getElementById('mensagem-feedback');

// Função para exibir alertas na tela
function mostrarMensagem(texto, tipo) {
    boxMensagem.textContent = texto;
    boxMensagem.className = `mensagem ${tipo}`;
}

function limparMensagem() {
    boxMensagem.className = 'mensagem oculto';
}

// Alternar para a tela de Cadastro
linkParaCadastro.addEventListener('click', (e) => {
    e.preventDefault();
    limparMensagem();
    formLogin.classList.add('oculto');
    formCadastro.classList.remove('oculto');
    subtitulo.textContent = 'Crie sua conta gratuita para começar';
});

// Alternar para a tela de Login
linkParaLogin.addEventListener('click', (e) => {
    e.preventDefault();
    limparMensagem();
    formCadastro.classList.add('oculto');
    formLogin.classList.remove('oculto');
    subtitulo.textContent = 'Entre na sua conta para acompanhar suas metas';
});

// Lógica de CADASTRO
formCadastro.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = document.getElementById('cad-nome').value.trim();
    const email = document.getElementById('cad-email').value.trim().toLowerCase();
    const senha = document.getElementById('cad-senha').value;

    // Busca usuários já cadastrados ou cria uma lista vazia
    const usuarios = JSON.parse(localStorage.getItem('fittrack_usuarios')) || [];

    // Verifica se o e-mail já existe
    const emailJaExiste = usuarios.some(user => user.email === email);
    if (emailJaExiste) {
        mostrarMensagem('Este e-mail já está cadastrado. Tente fazer login.', 'erro');
        return;
    }

    // Cria o novo usuário com metas padrão iniciais
    const novoUsuario = {
        nome,
        email,
        senha,
        metas: {
            calorias: 2000,
            agua: 2500, // em ml
            exercicio: 45 // em minutos
        }
    };

    usuarios.push(novoUsuario);
    localStorage.setItem('fittrack_usuarios', JSON.stringify(usuarios));

    // Limpa o formulário, volta para o login e avisa
    formCadastro.reset();
    formCadastro.classList.add('oculto');
    formLogin.classList.remove('oculto');
    subtitulo.textContent = 'Entre na sua conta para acompanhar suas metas';
    mostrarMensagem('Conta criada com sucesso! Agora faça seu login.', 'sucesso');
});

// Lógica de LOGIN
formLogin.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const senha = document.getElementById('login-senha').value;

    const usuarios = JSON.parse(localStorage.getItem('fittrack_usuarios')) || [];

    // Procura usuário com e-mail e senha correspondentes
    const usuarioValido = usuarios.find(user => user.email === email && user.senha === senha);

    if (!usuarioValido) {
        mostrarMensagem('E-mail ou senha incorretos. Verifique ou cadastre-se.', 'erro');
        return;
    }

    // Salva quem está logado no momento (sessão ativa)
    localStorage.setItem('fittrack_sessao_ativa', JSON.stringify(usuarioValido));

    // Avança para o painel principal
    window.location.href = 'dashboard.html';
});
