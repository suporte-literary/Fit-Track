// dados-service.js — Conexão com o Firestore
import { auth, db, onAuthStateChanged, doc, setDoc, getDoc } from './firebase-config.js';

let usuarioAtual = null;

// Esperar o usuário estar logado
export function esperarUsuarioLogado() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            usuarioAtual = user;
            resolve(user);
        });
    });
}

// Salvar dados do usuário
export async function salvarDadosUsuario(dados) {
    if (!usuarioAtual) return false;
    try {
        const ref = doc(db, "usuarios", usuarioAtual.uid);
        await setDoc(ref, dados, { merge: true });
        return true;
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
        return false;
    }
}

// Carregar dados do usuário
export async function carregarDadosUsuario() {
    if (!usuarioAtual) return null;
    try {
        const ref = doc(db, "usuarios", usuarioAtual.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return snap.data();
        } else {
            return {
                nomeCompleto: usuarioAtual.displayName || '',
                email: usuarioAtual.email,
                metas: { calorias: 2000, agua: 2500, atividade: 45 },
                registros: {}
            };
        }
    } catch (erro) {
        console.error("Erro ao carregar:", erro);
        return null;
    }
}

// Fazer logout
export async function sair() {
    await auth.signOut();
    window.location.href = 'index.html';
}
