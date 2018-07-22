const ReqsAndDocsViewActions = {
    INIT_VIEW: "",

    CURRENT_REQUIREMENT_CHANGED: "",

    DOCUMENTS_LOADED: "",

    ADD_DOCUMENT: "",
    ADD_DOCUMENT_DONE: "",
}

const AllDocsViewActions = {
    INIT_VIEW: "",

    REQUIREMENTS_LOADED: "",
    REQUIREMENTS_ALREADY_LOADED: "",
    REQUIREMENTS_ALREADY_LOADING: "",

    DOCUMENTS_LOADED: "",
}

const reqsAndDocsViewInitialState = {
    currentReqId = null,
    requirementsLoadingState: 'loading',
    documentsLoadingState: 'loading',
}

const reqsAndDocsReducer = (state = reqsAndDocsViewInitialState, action) => {
    switch (action.type) {
        case ReqsAndDocsViewActions.INIT_VIEW:
            return reqsAndDocsViewInitialState;

        case ReqsAndDocsViewActions.ADD_DOCUMENT:
        case ReqsAndDocsViewActions.CURRENT_REQUIREMENT_CHANGED:
            return { ...state, requirementsLoadingState: 'loading', currentReqId: action.id }

        case ReqsAndDocsViewActions.REQUIREMENTS_LOADED:        
        case ReqsAndDocsViewActions.REQUIREMENTS_ALREADY_LOADED:
            return { ...state, requirementsLoadingState: 'loaded' }

        case ReqsAndDocsViewActions.DOCUMENTS_LOADED:
        case ReqsAndDocsViewActions.DOCUMENTS_ALREADY_LOADED: 
            return { ...state, documentsLoadingState: 'loaded' }

        case ReqsAndDocsViewActions.ADD_DOCUMENT_DONE:
            if (action.reqId === state.currentReqId) {
                return { ...state, documentsLoadingState: 'loaded'}
            }
            return state;
        default:
            return state;
    }
}

const allDocsViewInitialState = {
    loadingState: 'loading',
}

const allDocsViewReducer = (state = allDocsViewInitialState, action) => {
    switch (action.type) {
        case AllDocsViewActions.INIT_VIEW:
            return allDocsViewInitialState;

        case AllDocsViewActions.DOCUMENTS_LOADED:
            return {
                loadingState: 'loaded',
            }
        default:
            return state;
    }
}

const documentsReducer = (state = {}, action) => {
    switch (action.type) {
        case ReqsAndDocsViewActions.ADD_DOCUMENT_DONE:
            return {
                ...state, 
                action.doc,
            }
        case ReqsAndDocsViewActions.DOCUMENTS_LOADED:
            return {
                ...state,
                toRecordMap(action.data)
            }
        default:
            return state;

    }
}

const requirementsInitialState = {
    status: 'initial',
    requirements: {}
}

const requirementsReducer = (state = requirementsInitialState, action) => {
    const requirements = (state = {}, action) => {
        switch (action.type) {
            case ReqsAndDocsViewActions.ADD_DOCUMENT_DONE:
                const req = state[action.reqId]
                return {
                    ...state,
                    reqId: { ...req, documentIds: [...documentIds, action.doc.id ]}
                }
            case AllDocsViewActions.REQUIREMENTS_LOADED:
            case ReqsAndDocsViewActions.REQUIREMENTS_LOADED:
                return toRecordMap(action.data)
            default:
                return state;
        }
    }

    const status = (state = 'initial', action) => {
        switch (action.type) {
            case AllDocsViewActions.INIT_VIEW:
            case ReqsAndDocsViewActions.INIT_VIEW:
                if (state === 'initial') {
                    return 'loading'
                }
                return state;
            case AllDocsViewActions.REQUIREMENTS_LOADED:
            case ReqsAndDocsViewActions.REQUIREMENTS_LOADED:
                return 'loaded'
            default:
                return state;
        }
    }

    return {
        requirements: requirements(state, action),
        status: status(state, action),
    }
}

class ReqsAndDocsViewEffect {
    @Effect()
    this.actions.ofType(ReqAndDocsViewActions.INIT_VIEW).pipe(
        withLatestFrom(this.store)
        switchMap(([_, store]) => {
            const status = selectRequirementsStatus(store)
            switch status {
                case 'initial':
                    const data = await this.fetch.requirements();
                    return { type: ReqsAndDocsViewActions.REQUIREMENTS_LOADED, data }
                case 'loading':
                    return { type: ReqsAndDocsViewActions.REQUIREMENTS_ALREADY_LOADING }
                case 'loaded':
                    return { type: ReqAndDocsViewActions.REQUIREMENTS_ALREADY_LOADED }
            }
        }))
    )

    @Effect()
    this.actions.ofType(ReqAndDocsViewActions.CURRENT_REQUIREMENT_CHANGED).pipe(
        withLatestFrom(this.store),
        switchMap(([reqId, store]) => {
            const requirement = selectCurrentReq(store)
            const documents = getDocsForReq(req, selectDocuments(store))
            const needsFetching = needsDocumentsFetching(store, req)
            if (!needsFetching) return Observable.of({ type: ReqsAndDocsViewActions.DOCUMENTS_LOADED, data: [] })
            return this.fetch.documents(reqId).pipe(
                map(data => ({ type: ReqsAndDocsViewActions.DOCUMENTS_LOADED, reqId, data })))
        })
    )

    @Effect()
    this.actions.ofType(ReqAndDocsViewActions.ADD_DOCUMENT).pipe(
        withLatestFrom(this.store),
        switchMap(([docDto, store] => {
            const requirement = selectCurrentReq(store)
            return this.fetch.addDocToReq(req.id, docDto).pipe(
                map(doc => ({ type: ReqsAndDocsViewActions.ADD_DOCUMENT_DONE, reqId, doc }})))
        })
    )
}

class AllDocsViewEffect {
    @Effect()
    this.actions.ofType(AllDocsViewActions.INIT_VIEW).pipe(
        withLatestFrom(this.store),
        switchMap(([_, store]) => {
            const status = selectRequirementsStatus(store)
            switch status {
                case 'initial':
                    const data = await this.fetch.requirements();
                    return { type: AllDocsViewActions.REQUIREMENTS_LOADED, data }
                case 'loading':
                    // what should we do here? watch for other actions?
                    // or should we map all REQUIREMENTS_LOADED actions to separate action? 
                    return this.actions.ofType(ReqsAndDocsViewActions.REQUIREMENTS_LOADED).pipe(
                        first(),
                        map(() => ({ type: AllDocsViewActions.REQUIREMENTS_ALREADY_LOADED })),
                    )
                    // may be wait until the store becomes good for us?
                    // the last one, probably
                    return this.store.pipe(
                        map(selectRequirementsStatus)
                        filter(status => status === 'loaded'),
                        first(),
                        map(() => ({ type: AllDocsViewActions.REQUIREMENTS_ALREADY_LOADED })),
                    )

                case 'loaded':
                    return { type: AllDocsViewActions.REQUIREMENTS_ALREADY_LOADED }
            }
        })
    )

    @Effect()
    this.actions.ofType(AllDocsViewActions.REQUIREMENTS_LOADED, AllDocsViewActions.REQUIREMENTS_ALREADY_LOADED).pipe(
        withLatestFrom(this.store),
        switchMap((_, store) => {
            const requirements = selectRequirements(store)
            const fetchPromises = requirements
                .filter(req => needsDocumentsFetching(store, req))
                .map(req => this.fetch.documents(req.id))

            const results = await Promise.all(fetchPromises)
            const documents = flatMap(results, i => i)
            return { type: AllDocsViewActions.DOCUMENTS_LOADED, data: documents }
        }),
    )
}

function getDocsForReq(req: Requirement, docs: Document[]): Document[] {
    return req.documentIds.map(docId => this.documents[docId]);
}

function needsDocumentsFetching(store, req) {
    const documents = getDocsForReq(req, selectDocuments(store))
    return documents.map(d => !!d).indexOf(false) >= 0;
}

class RequirementsSelectors {
    selectRequirementsStatus = createSelector(requirementsState, x => x.status)
    selectRequirements = createSelector(requirementsState, x => Object.values(requirementsState))
}

class ReqsAndDocsViewSelectors {
    selectCurrentReqId = createSelector(viewState, x => x.currentReqId)
    selectCurrentReq = createSelector(selectRequirements, selectCurrentReqId, (reqs, id) => reqs[id])
    selectCurrentDocuments = createSelector(documentsState, selectCurrentReq, (docs, req) => req.documentIds.map(id => docs[id]))
    selectDocumentsLoading = createSelector(viewState, x => x.documentsLoadingState)
}

class AllDocsViewSelectors {
    selectLoading = createSelector(viewState, x => x.loadingState)
    selectDocuments = createSelector(selectRequirements, documentsState, 
        (reqs, docs) => flatMap(reqs, req => req.documentIds.map(id => doc[id])))
}