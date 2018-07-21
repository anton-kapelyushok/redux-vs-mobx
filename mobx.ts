export class RequirementsStore {

    @observable requirements

    @action async initRequirementsIfNeeded() {
        if (this.requirements) return;
        this.fetch.requirements().then(this.updateRequirements)
    }

    @action.bound updateRequirements(data) {
        this.requirements = toRequirementsRecordMap(data)
    }
}

export class Requirement {
    @observable id
    @observable name
    @observable documents = null

    @action async createDocument(docDto) {
        this.fetch.addDocToReq(this.id, docDto)
            .then(this.addDocument)
    }

    @action async fetchDocumentsIfNeeded() {
        if (this.documents) return
        await this.fetch.documents(this.id).then(this.updateDocuments)
    }

    @action.bound addDocument(doc) {
        this.documents.push(doc)
    }

    @action.bound updateDocuments(result) {
        this.documents = toDocuments(result)
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
        await this.requirementsStore.initRequirementsIfNeeded()
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

    @computed get documents() {
        return flatmap(Object.values(this.requirementsStore), req => req.documents)
    }

    @action async init() {
        await this.requirementsStore.initRequirementsIfNeeded()
        const reqs = Object.values(this.requirementsStore)
        const promises = reqs.map(req => req.fetchDocumentsIfNeeded())
        await Promise.all(promises)
        runInAction(() => this.requirementsLoadingState = 'loaded')
    }
}
