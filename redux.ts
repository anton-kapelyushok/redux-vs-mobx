const ReqsAndDocsViewActions = {
    INIT_VIEW: "",
    REQUIREMENTS_LOADED: "",

    CURRENT_REQUIREMENT_CHANGED: "",

    DOCUMENTS_LOADED: "",
    DOCUMENTS_LOADED_ALREADY: "",

    ADD_DOCUMENT: "",
    ADD_DOCUMENT_DONE: "",
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

        case ReqsAndDocsViewActions.REQUIREMENTS_LOADED:
            return { ...state, requirementsLoadingState: 'loaded' }

        case ReqsAndDocsViewActions.DOCUMENTS_LOADED_ALREADY: 
        case ReqsAndDocsViewActions.DOCUMENTS_LOADED:
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

const requirementsReducer = (state = {}, action) => {
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

class ReqsAndDocsViewEffect {
    @Effect()
    this.actions.ofType(Actions.INIT_VIEW).pipe(
        switchMap(async () => this.fetch.requirements().pipe(
            map(r => ({ type: ReqsAndDocsViewActions.REQUIREMENTS_LOADED, data: r })))),
    )

    @Effect()
    this.actions.ofType(CURRENT_REQUIREMENT_CHANGED).pipe(
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
    this.actions.ofType(ADD_DOCUMENT).pipe(
        withLatestFrom(this.store),
        switchMap(([docDto, store] => {
            const requirement = selectCurrentReq(store)
            return this.fetch.addDocToReq(req.id, docDto).pipe(
                map(doc => ({ type: ReqsAndDocsViewActions.ADD_DOCUMENT_DONE, reqId, doc }})))
        })
    )
}

function getDocsForReq(req: Requirement, docs: Document[]): Document[] {
    return req.documentIds.map(docId => this.documents[docId]);
}

class ReqsAndDocsViewSelectors {
    selectCurrentReqId = createSelector(viewState, x => x.currentReqId)
    selectCurrentReq = createSelector(requirementsState, selectCurrentReqId, (reqs, id) => reqs[id])
    selectRequirements = createSelector(requirementsState, x => Object.values(requirementsState))
    selectCurrentDocuments = createSelector(documentsState, selectCurrentReq, (docs, req) => req.documentIds.map(id => docs[id]))
    selectRequirementsLoading = createSelector(viewState, x => x.requirementsLoadingState)
    selectDocumentsLoading = createSelector(viewState, x => x.documentsLoadingState)
}