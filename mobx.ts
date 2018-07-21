export class DocumentsStore {
    @observable documents = {}

    @action async fetchAllDocuments() {
        this.fetch.allDocuments().then(this.updateAllDocuments)
    }

    @action.bound updateAllDocuments(data) {
        const documents = data.map(toDocument)
        documents.forEach(this.storeDocument)
    }

    storeDocument(doc) {
        documents[id] = doc
    }
}

export class RequirementsStore {

    @observable requirements = {}

    @action async initRequirements() {
        this.fetch.requirements().then(this.updateRequirements)
    }

    @action.bound updateRequirements(data) {
        this.requirements = toRequirementsRecordMap(data)
    }
}

export class Requirement {
    @observable id
    @observable name
    @observable documentIds = []

    @computed get documents() {
        return this.documentIds.map(id => this.documentsStore[id])
    }

    @action async createDocument(docDto) {
        this.fetch.addDocToReq(this.id, docDto)
            .then(this.addDocument)
    }

    @action async fetchDocumentsIfNeeded() {
        if (this.documents) return
        await this.fetch.documents(this.id).then(this.updateDocuments)
    }

    @action.bound addDocument(doc) {
        this.documentIds.push(doc.id)
        this.documentsStore.storeDocument(doc)
    }

    @action.bound updateDocuments(result) {
        this.documents = toDocuments(result)
        this.documents.forEach(this.documentsStore.storeDocument)
    }
}

export class ReqsAndDocsViewStore {
    @observable currentReq = null
    @observable requirementsLoadingState = 'loading'
    @observable documentsLoadingState = 'loading'

    @computed get requirements() {
        return Object.values(this.requirementsStore)
    }

    @action async init() {
        await this.requirementsStore.initRequirements()
        runInAction(() => this.requirementsLoadingState = 'loaded')
    }

    @action async selectRequirement(req) {
        this.currentReq = req
        this.documentsLoadingState = 'loading'
        await req.fetchDocumentsIfNeeded()
        if (this.currentReq === req) { // ?? this.currentReq.id === req.id ??
            runInAction(() => this.documentsLoadingState = 'loaded')
        } 
    }

    @action async createDocument(docDto) {
        this.documentsLoadingState = 'loading'
        const req = this.currentReq
        await req.createDocument(docDto)
        if (this.currentReq === req) {
            runInAction(() => this.documentsLoadingState = 'loaded')
        }
    }
}

export class AllDocsStore {
    @observable loadingState = 'loading'
    @observable documentIds = []

    @computed get documents() {
        return this.documentIds.map(id => this.documentsStore[id])
    }

    @action async init() {
        await this.documentsStore.fetchAllDocuments()
        runInAction(() => this.requirementsLoadingState = 'loaded')
    }
}
