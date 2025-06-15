import { createContext, useContext, type Component, type ParentProps } from 'solid-js';
import { createStore } from 'solid-js/store';
import { type Atom, type WritableAtom, createStore as createJotaiStore } from 'jotai';

// Create a Jotai store
const store = createJotaiStore();

// Context for the store
const StoreContext = createContext(store);

// Provider component
export const Provider: Component<ParentProps> = (props) => {
  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  );
};

// Custom useAtom hook for SolidJS
export function useAtom<Value>(anAtom: Atom<Value> | WritableAtom<Value, any[], any>) {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useAtom must be used within Provider');
  
  const [state, setState] = createStore({
    value: store.get(anAtom)
  });
  
  // Subscribe to atom changes
  const unsubscribe = store.sub(anAtom, () => {
    setState('value', store.get(anAtom));
  });
  
  // Cleanup on unmount
  onCleanup(() => {
    unsubscribe();
  });
  
  // Return getter and setter
  const get = () => state.value;
  const set = (value: any) => store.set(anAtom as WritableAtom<Value, any[], any>, value);
  
  return [get, set] as const;
}

// Re-export atom creators
export { atom } from 'jotai';
export { atomWithStorage } from 'jotai/utils';

// Helper to cleanup subscriptions
import { onCleanup } from 'solid-js';