/**
 * MapeamentoService.js
 * Comunicação com Firestore para a coleção 'mapeamento_auditoria'.
 */

const { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } = window;

window.MapeamentoService = {
    registrarTentativa(dados) {
        return addDoc(collection(db, "mapeamento_auditoria"), {
            ...dados,
            autor: window.currentUser,
            createdAt: serverTimestamp()
        });
    },

    initListeners(callback) {
        const q = query(collection(db, "mapeamento_auditoria"), orderBy("dataTentativa", "desc"));
        return onSnapshot(q, (snapshot) => {
            const dados = [];
            snapshot.forEach(doc => {
                dados.push({ id: doc.id, ...doc.data() });
            });
            callback(dados);
        });
    },

    excluirRegistro(id) {
        if (!confirm("Deseja realmente excluir este registro?")) return;
        return deleteDoc(doc(db, "mapeamento_auditoria", id));
    }
};
