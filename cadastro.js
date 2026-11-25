const cadastroForm = document.getElementById('cadastro-form');
const mensagemCadastro = document.getElementById('mensagem-cadastro');

cadastroForm.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const nomeCompleto = document.getElementById('nome-completo').value.trim();
    const usuario = document.getElementById('novo-usuario').value.trim().toLowerCase();
    const senha = document.getElementById('nova-senha').value;

    // Busca a lista de usuários já cadastrados ou cria uma lista vazia
    const listaUsuarios = JSON.parse(localStorage.getItem('fittrack_usuarios')) || [];

    // Verifica se o nome de usuário já existe
    const usuarioExiste = listaUsuarios.some(item => item.usuario === usuario);

    if (usuarioExiste) {
        mensagemCadastro.textContent = 'Este nome de usuário já está em uso.';
        return;
    }

    // Cria o novo usuário com metas padrão iniciais
    const novoCadastro = {
        nomeCompleto: nomeCompleto,
        usuario: usuario,
        senha: senha,
        metas: {
            calorias: 2000,
            agua: 2500,
            atividade: 45
        },
        registros: {} // Aqui ficarão salvos os dados de cada dia do calendário
    };

    listaUsuarios.push(novoCadastro);
    localStorage.setItem('fittrack_usuarios', JSON.stringify(listaUsuarios));

    alert('Cadastro realizado com sucesso! Faça seu login.');
    window.location.href = 'index.html';
});
