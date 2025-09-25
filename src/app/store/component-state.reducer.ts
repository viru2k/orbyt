import { createAction, createReducer, on, props, Store } from '@ngrx/store';
// Helper function to deep compare objects
const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => isEqual(a[key], b[key]));
  }

  return false;
};
import { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';


export const updateComponentState = createAction(
  '[Component Store] Update Action',
  props<{ componentName: string; componentState: any }>()
);

export const initialState: any = {};

export const componentStateReducer = createReducer(
  initialState,
  on(updateComponentState, (state, { componentName, componentState }) => {
    return { [componentName]: { ...componentState } };
  })
);

export const linkToGlobalState = (componentState$: Observable<any>, componentName: string, globalStore: Store) => {
  componentState$.pipe(distinctUntilChanged((prev, next) => isEqual(prev, next))).subscribe({
    next: (componentState) => globalStore.dispatch(updateComponentState({ componentName, componentState })),
    error: (e) => console.error(e),
  });
};