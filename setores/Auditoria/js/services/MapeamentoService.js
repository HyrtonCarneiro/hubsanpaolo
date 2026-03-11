/**
 * MapeamentoService.js
 * Comunicação com Firestore para a coleção 'mapeamento_auditoria'.
 */

window.MapeamentoService = {
    registrarTentativa(dados) {
        return window.addDoc(window.collection(window.db, "mapeamento_auditoria"), {
            ...dados,
            autor: window.currentUser,
            createdAt: window.serverTimestamp()
        });
    },

    initListeners(callback) {
        const q = window.query(window.collection(window.db, "mapeamento_auditoria"), window.orderBy("dataTentativa", "desc"));
        return window.onSnapshot(q, (snapshot) => {
            const dados = [];
            snapshot.forEach(doc => {
                dados.push({ id: doc.id, ...doc.data() });
            });
            callback(dados);
        });
    },

    excluirRegistro(id) {
        if (!confirm("Deseja realmente excluir este registro?")) return;
        return window.deleteDoc(window.doc(window.db, "mapeamento_auditoria", id));
    }
};
