const ReqsAndDocsViewActions = {
    INIT_VIEW: "",

    CURRENT_REQUIREMENT_CHANGED: "",

    DOCUMENTS_LOADED: "",
    DOCUMENTS_ALREADY_LOADED: "",

    ADD_DOCUMENT: "",
    ADD_DOCUMENT_DONE: "",
}

const RequirementsActions = {
    REQUIREMENTS_LOADED: "",
    REQUIREMENTS_ALREADY_LOADED: "",
    REQUIREMENTS_ALREADY_LOADING: "",
}

const AllDocsViewActions = {
    INIT_VIEW: "",
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

        case ReqsAndDocsViewActions.CURRENT_REQUIREMENT_CHANGED:
            return { ...state, requirementsLoadingState: 'loading', documentsLoadingState: 'loading', currentReqId: action.id }

        case RequirementsActions.REQUIREMENTS_LOADED:        
        case RequirementsActions.REQUIREMENTS_ALREADY_LOADED:
            return { ...state, requirementsLoadingState: 'loaded' }

        case ReqsAndDocsViewActions.DOCUMENTS_LOADED:
        case ReqsAndDocsViewActions.DOCUMENTS_ALREADY_LOADED: 
            return { ...state, documentsLoadingState: 'loaded' }

        case ReqsAndDocsViewActions.ADD_DOCUMENT:
            return { ...state, documentsLoadingState: 'loading' }

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

        case RequirementsActions.REQUIREMENTS_ALREADY_LOADED:
        case RequirementsActions.REQUIREMENTS_LOADED:
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
        switchMap(([_, store]) => fetchReqsIfNeeded(store, this.fetch)))
    )

    @Effect()
    this.actions.ofType(ReqAndDocsViewActions.CURRENT_REQUIREMENT_CHANGED).pipe(
        withLatestFrom(this.store),
        switchMap(([reqId, store]) => {
            const requirement = selectCurrentReq(store)
            const documents = getDocsForReq(req, selectDocuments(store))
            const needsFetching = documents.map(d => !!d).indexOf(false) >= 0;
            if (!needsFetching) return ObservableArray.of({ type: ReqsAndDocsViewActions.DOCUMENTS_LOADED_ALREADY })
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
    this.actions.ofType(ReqAndDocsViewActions.INIT_VIEW).pipe(
        withLatestFrom(this.store)
        switchMap(([_, store]) => fetchReqsIfNeeded(store, this.fetch)))
    )
}

function fetchReqsIfNeeded(store, fetch) {
    const status = selectRequirementsStatus(store)
    switch (status) {
        case 'initial':
            return fetch.requirements().then(data => ({ type: RequirementsActions.REQUIREMENTS_LOADED, data }))
        case 'loading':
            return { type: RequirementsActions.REQUIREMENTS_ALREADY_LOADING }
        case 'loaded':
            return { type: RequirementsActions.REQUIREMENTS_ALREADY_LOADED }
    }
}

function getDocsForReq(req: Requirement, docs: Document[]): Document[] {
    return req.documentIds.map(docId => this.documents[docId]);
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
    selectDocuments = createSelector(selectRequirements, documentsState, (reqs, docs) => flatMap(reqs, req => req.documentIds.map(id => doc[id])))
}