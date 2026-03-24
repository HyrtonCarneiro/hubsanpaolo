// js/logic/ProtocolosLogic.js
// Centralized logic for Protocolos de Chamados (shared between TI and Auditoria)

window.ProtocolosLogic = {
    collectionName: 'protocolos_suporte',

    initListener: function (callback) {
        try {
            const q = query(collection(db, this.collectionName), orderBy("timestamp", "desc"));
            return onSnapshot(q, (snapshot) => {
                const protocolos = [];
                snapshot.forEach(docSnap => {
                    protocolos.push({ firebaseId: docSnap.id, ...docSnap.data() });
                });
                if (callback) callback(protocolos);
            }, (err) => {
                console.error("Erro no listener de protocolos:", err);
            });
        } catch (e) {
            console.error("Erro ao iniciar listener de protocolos", e);
        }
    },

    salvar: async function (dados) {
        try {
            const payload = {
                ...dados,
                status: dados.status || 'Pendente',
                timestamp: Date.now(),
                autor: window.currentUser || 'Sistema'
            };
            return await addDoc(collection(db, this.collectionName), payload);
        } catch (e) {
            console.error("Erro ao salvar protocolo:", e);
            throw e;
        }
    },

    atualizar: async function (id, dados) {
        try {
            const docRef = doc(db, this.collectionName, id);
            return await updateDoc(docRef, dados);
        } catch (e) {
            console.error("Erro ao atualizar protocolo:", e);
            throw e;
        }
    },

    toggleStatus: async function (id, currentStatus) {
        try {
            const novoStatus = currentStatus === 'Resolvido' ? 'Pendente' : 'Resolvido';
            const dados = { status: novoStatus };
            if (novoStatus === 'Resolvido') {
                dados.dataResolvido = Date.now();
            } else {
                dados.dataResolvido = deleteField();
            }
            return await this.atualizar(id, dados);
        } catch (e) {
            console.error("Erro ao alternar status do protocolo:", e);
            throw e;
        }
    },

    excluir: async function (id) {
        try {
            if (!confirm("Tem certeza que deseja excluir este protocolo?")) return;
            return await deleteDoc(doc(db, this.collectionName, id));
        } catch (e) {
            console.error("Erro ao excluir protocolo:", e);
            throw e;
        }
    }
};
