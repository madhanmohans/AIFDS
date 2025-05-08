import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

export interface ComponentProperty {
  type: 'text' | 'number' | 'color' | 'select';
  label: string;
  default: any;
  options?: string[];
}

export interface ComponentConfig {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: ComponentConfig[];
}

interface PlaygroundState {
  components: ComponentConfig[];
  selectedComponent: ComponentConfig | null;
  selectedAvailableComponent: string | null;
  dropTarget: { id: string; position: 'before' | 'after' | 'inside' } | null;
}

type PlaygroundAction =
  | { type: 'ADD_COMPONENT'; payload: ComponentConfig }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; props: Record<string, any> } }
  | { type: 'DELETE_COMPONENT'; payload: string }
  | { type: 'SELECT_COMPONENT'; payload: ComponentConfig | null }
  | { type: 'SELECT_AVAILABLE_COMPONENT'; payload: string | null }
  | { type: 'SET_DROP_TARGET'; payload: { id: string; position: 'before' | 'after' | 'inside' } | null }
  | { type: 'MOVE_COMPONENT'; payload: { sourceId: string; targetId: string; position: 'before' | 'after' | 'inside' } }
  | { type: 'REORDER_COMPONENTS'; payload: ComponentConfig[] };

const initialState: PlaygroundState = {
  components: [],
  selectedComponent: null,
  selectedAvailableComponent: null,
  dropTarget: null,
};

function playgroundReducer(state: PlaygroundState, action: PlaygroundAction): PlaygroundState {
  switch (action.type) {
    case 'ADD_COMPONENT': {
      const newState = {
        ...state,
        components: [...state.components, action.payload],
      };
      // Log the updated component tree
      console.log('Component Tree:', JSON.stringify(newState.components, null, 2));
      return newState;
    }

    case 'UPDATE_COMPONENT': {
      const updateComponent = (components: ComponentConfig[]): ComponentConfig[] => {
        return components.map(comp => {
          if (comp.id === action.payload.id) {
            return {
              ...comp,
              props: {
                ...comp.props,
                ...action.payload.props,
              },
            };
          }
          if (comp.children) {
            return {
              ...comp,
              children: updateComponent(comp.children),
            };
          }
          return comp;
        });
      };

      const newState = {
        ...state,
        components: updateComponent(state.components),
        selectedComponent: state.selectedComponent?.id === action.payload.id
          ? { ...state.selectedComponent, props: { ...state.selectedComponent.props, ...action.payload.props } }
          : state.selectedComponent,
      };
      // Log the updated component tree
      console.log('Component Tree:', JSON.stringify(newState.components, null, 2));
      return newState;
    }

    case 'DELETE_COMPONENT': {
      const removeComponent = (components: ComponentConfig[]): ComponentConfig[] => {
        return components.filter(comp => {
          if (comp.id === action.payload) return false;
          if (comp.children) {
            comp.children = removeComponent(comp.children);
          }
          return true;
        });
      };

      const newState = {
        ...state,
        components: removeComponent(state.components),
        selectedComponent: state.selectedComponent?.id === action.payload ? null : state.selectedComponent,
      };
      // Log the updated component tree
      console.log('Component Tree:', JSON.stringify(newState.components, null, 2));
      return newState;
    }

    case 'SELECT_COMPONENT':
      return {
        ...state,
        selectedComponent: action.payload,
      };

    case 'SELECT_AVAILABLE_COMPONENT':
      return {
        ...state,
        selectedAvailableComponent: action.payload,
      };

    case 'SET_DROP_TARGET':
      return {
        ...state,
        dropTarget: action.payload,
      };

    case 'MOVE_COMPONENT': {
      const { sourceId, targetId, position } = action.payload;
      
      const findComponent = (components: ComponentConfig[], id: string): ComponentConfig | null => {
        for (const comp of components) {
          if (comp.id === id) return comp;
          if (comp.children) {
            const found = findComponent(comp.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const removeComponent = (components: ComponentConfig[], id: string): ComponentConfig[] => {
        return components.filter(comp => {
          if (comp.id === id) return false;
          if (comp.children) {
            comp.children = removeComponent(comp.children, id);
          }
          return true;
        });
      };

      const addComponent = (
        components: ComponentConfig[],
        targetId: string,
        component: ComponentConfig,
        position: 'before' | 'after' | 'inside'
      ): ComponentConfig[] => {
        return components.map(comp => {
          if (comp.id === targetId) {
            if (position === 'inside') {
              return {
                ...comp,
                children: [...(comp.children || []), component],
              };
            }
            return comp;
          }
          if (comp.children) {
            return {
              ...comp,
              children: addComponent(comp.children, targetId, component, position),
            };
          }
          return comp;
        });
      };

      const sourceComponent = findComponent(state.components, sourceId);
      if (!sourceComponent) return state;

      const newComponents = removeComponent(state.components, sourceId);
      const updatedComponents = addComponent(newComponents, targetId, sourceComponent, position);

      const newState = {
        ...state,
        components: updatedComponents,
      };
      // Log the updated component tree
      console.log('Component Tree:', JSON.stringify(newState.components, null, 2));
      return newState;
    }

    case 'REORDER_COMPONENTS': {
      return {
        ...state,
        components: action.payload,
      };
    }

    default:
      return state;
  }
}

const PlaygroundContext = createContext<{
  state: PlaygroundState;
  dispatch: React.Dispatch<PlaygroundAction>;
} | null>(null);

export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playgroundReducer, initialState);

  // Log initial state and state changes
  useEffect(() => {
    console.log('Initial Component Tree:', JSON.stringify(state.components, null, 2));
  }, []);

  useEffect(() => {
    console.log('Component Tree Updated:', JSON.stringify(state.components, null, 2));
  }, [state.components]);

  return (
    <PlaygroundContext.Provider value={{ state, dispatch }}>
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground() {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error('usePlayground must be used within a PlaygroundProvider');
  }
  return context;
} 