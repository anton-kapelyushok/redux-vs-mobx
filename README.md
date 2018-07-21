# redux vs mobx
Small project aimed to display differences difference between two libraries.

It does not have a view layer, it does not even compile. 
The aim of the project was to display the differencies, not to make anything working

## What this code tries to do

Two entities, requirement:
```
type Requirement = {
  id: string;
  name: string;
}
```
and document:
```
type Document = {
  id: string;
  name: string;
}
```
Requirement can have many documents.

### Implemented in branch `start`:
- view with requirements 
  - while loading requirements, indicator should be displayed
- upon click on a requirement, documents for the requirement should be displayed
  - while documents are loading, indicator should be displayed
  - documents should not be retrieved again if they were loaded already
- ability to add document to requirement
    - documents should be updated after adding a new requirement 
 
### Implemented in branch `docs-from-server`:
- all from `start` branch
- view with all documents
  - documents should be taken from the server separately
  - if documents were already fetched, they should not be retrieved again
  - documents between first view and the second view should be in consistent state
