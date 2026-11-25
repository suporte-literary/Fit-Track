const loginForm = document.getElementById('login-form');
const mensagemErro = document.getElementById('mensagem-erro');

loginForm.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const usuarioDigitado = document.getElementById('usuario').value.trim().toLowerCase();
    const senhaDigitada = document.getElementById('senha').value;

    const listaUsuarios = JSON.parse(localStorage.getItem('fittrack_usuarios')) || [];

    // Procura o usuário correspondente na lista salva
    const usuarioEncontrado = listaUsuarios.find(
        item => item.usuario === usuarioDigitado && item.senha === senhaDigitada
    );

    if (usuarioEncontrado) {
        // Salva quem está logado no momento para o dashboard saber qual conta carregar
        localStorage.setItem('fittrack_usuario_logado', usuarioEncontrado.usuario);
        window.location.href = 'dashboard.html';
    } else {
        mensagemErro.textContent = 'Usuário ou senha incorretos.';
    }
});
