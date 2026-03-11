// db, collection, getDocs, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy → from firebase-init.js

/**
 * Service to handle all Firebase interactions for the Expansao sector.
 */
window.ExpansaoService = {
    // ---- Obras Kanban ----
    async getObras() {
        const obrasCollection = collection(db, "obras_expansao");
        const querySnapshot = await getDocs(obrasCollection);
        const obras = [];
        querySnapshot.forEach((docSnap) => {
            obras.push({ id: docSnap.id, ...docSnap.data() });
        });
        return obras;
    },

    async salvarObra(payload, id = null) {
        if (id) {
            await updateDoc(doc(db, "obras_expansao", id), payload);
            return id;
        } else {
            const docRef = await addDoc(collection(db, "obras_expansao"), payload);
            return docRef.id;
        }
    },

    async excluirObra(id) {
        await deleteDoc(doc(db, "obras_expansao", id));
    },

    // ---- Equipe ----
    listenEquipe(callback) {
        const qEquipe = query(collection(db, "equipe_expansao"));
        return onSnapshot(qEquipe, (snapshot) => {
            const equipe = [];
            snapshot.forEach(d => equipe.push({ id: d.id, ...d.data() }));
            callback(equipe);
        });
    },

    async addMembroEquipe(nome) {
        await addDoc(collection(db, "equipe_expansao"), { nome });
    },

    async removerMembroEquipe(id) {
        await deleteDoc(doc(db, "equipe_expansao", id));
    },

    // ---- Tarefas / Projetos da Equipe ----
    listenProjetos(callback) {
        const qProjetos = query(collection(db, "projetos_expansao"), orderBy("data", "desc"));
        return onSnapshot(qProjetos, (snapshot) => {
            const projetos = [];
            snapshot.forEach(d => projetos.push({ id: d.id, ...d.data() }));
            callback(projetos);
        });
    },

    async salvarProjeto(payload) {
        await addDoc(collection(db, "projetos_expansao"), payload);
    },

    async atualizarStatusProjeto(id, novoStatus) {
        await updateDoc(doc(db, "projetos_expansao", id), { status: novoStatus });
    },

    async deletarProjeto(id) {
        await deleteDoc(doc(db, "projetos_expansao", id));
    }
};
