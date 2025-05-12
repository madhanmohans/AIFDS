import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  ComponentConfig, 
  PlaygroundState, 
  PlaygroundAction, 
  DropPosition,
  TechStack 
} from '../types/playground';

// Local storage key
const PLAYGROUND_STORAGE_KEY = 'playground_data_v1';

// Load saved state from localStorage or use initial state
const loadSavedState = (): PlaygroundState => {
  try {
    const savedData = localStorage.getItem(PLAYGROUND_STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log('Loaded saved playground state', parsedData);
      return parsedData;
    }
  } catch (err) {
    console.error('Error loading saved playground state:', err);
  }
  
  // Return initial state if nothing saved or error
  return {
    components: [],
    selectedComponent: null,
    selectedAvailableComponent: null,
    dropTarget: null,
    lastUpdated: Date.now(),
    techStack: 'react', // Default to React
    previewMode: false, // Default to structure view
  };
};

// Initial state - load from localStorage if available
const initialState: PlaygroundState = loadSavedState();

// Improved function to propagate context to children with better array handling and fallback mechanisms
const propagateContextToChildren = (component: ComponentConfig): ComponentConfig => {
  if (!component.children || component.children.length === 0) {
    return component;
  }

  console.log(`⏬ Propagating context from ${component.type}:${component.id} to ${component.children.length} children`);
  console.log(`Parent context data:`, component.contextData);
  console.log(`Parent contextPath:`, component.props?.contextPath);

  const updatedChildren = component.children.map(child => {
    // Track if context was assigned through contextPath
    let contextAssigned = false;
    let childContextData = undefined;
    
    // First approach: If the parent has context data and the child has a contextPath,
    // extract specific context for the child
    if (component.contextData && child.props && child.props.contextPath) {
      const path = child.props.contextPath;
      
      try {
        // If the path is empty, inherit all parent context
        if (!path) {
          childContextData = component.contextData;
          contextAssigned = true;
          console.log(`Propagating full context from ${component.id} to child ${child.id}`);
        } else {
          console.log(`Trying to access path "${path}" in parent context:`, component.contextData);
          
          // Navigate to the specified context path in the parent's data
          childContextData = path.split('.').reduce((obj: any, key: string) => {
            if (!obj) return undefined;
            // Handle array indices in path like "results[0]"
            if (key.includes('[') && key.includes(']')) {
              const arrayName = key.substring(0, key.indexOf('['));
              const indexStr = key.substring(key.indexOf('[') + 1, key.indexOf(']'));
              const index = parseInt(indexStr, 10);
              
              if (obj[arrayName] && Array.isArray(obj[arrayName]) && !isNaN(index)) {
                return obj[arrayName][index];
              }
              return undefined;
            }
            return obj[key];
          }, component.contextData);
          
          if (childContextData !== undefined) {
            contextAssigned = true;
            console.log(`✅ Propagating context data from ${component.id} to child ${child.id} via path ${path}:`, childContextData);
          } else {
            console.warn(`❌ Failed to resolve context path "${path}" in parent context:`, component.contextData);
          }
        }
      } catch (error) {
        console.error(`Error propagating context from ${component.id} to ${child.id} with path ${path}:`, error);
      }
    }
    
    // Special handling for various container components to ensure they pass their context to children
    // even if the children don't have contextPath specified
    if (!contextAssigned && 
        (component.type === 'Card' || 
         component.type === 'Flexbox' || 
         component.type === 'Stack' || 
         component.type === 'ScrollableContainer' || 
         component.type === 'Section') && 
        component.contextData) {
      childContextData = component.contextData;
      contextAssigned = true;
      console.log(`🃏 ${component.type} component ${component.id} passing context to child ${child.id}`);
    }
    
    // Second approach: For MapComponent, ensure we're properly handling array data iteration
    if (!contextAssigned && component.type === 'MapComponent' && component.contextData) {
      try {
        // If MapComponent has dataPath, use that to extract data array
        if (component.props && component.props.dataPath) {
          const dataPath = component.props.dataPath;
          
          // Extract the array data
          let dataArray = null;
          
          // Handle direct array contextData case
          if (Array.isArray(component.contextData)) {
            dataArray = component.contextData;
          } else {
            // Extract data through path
            dataArray = dataPath.split('.').reduce((obj: any, path: string) => 
              obj && typeof obj === 'object' ? obj[path] : null, component.contextData);
          }
          
          // If we found an array, pass a single item as context to each child
          if (Array.isArray(dataArray) && dataArray.length > 0) {
            // For MapComponent, we'll automatically use the first item in preview
            // In the real rendering, this would iterate over all items
            childContextData = dataArray[0];
            contextAssigned = true;
            console.log(`🗺️ MapComponent ${component.id} passing item context to child ${child.id}:`, childContextData);
          }
        }
      } catch (error) {
        console.error(`Error setting MapComponent context for ${child.id}:`, error);
      }
    }
    
    // Third approach (fallback): If child still has no context and parent has context,
    // inherit the entire parent context as a fallback
    if (!contextAssigned && !child.contextData && component.contextData) {
      childContextData = component.contextData;
      console.log(`↪️ Fallback: ${child.id} inheriting full context from parent ${component.id}`);
    }
    
    // Create the updated child with context
    const updatedChild = {
      ...child,
      // Only set context if we have something to set
      ...(childContextData !== undefined ? { contextData: childContextData } : {}),
    };
    
    // Recursively update this child's children
    if (updatedChild.children && updatedChild.children.length > 0) {
      return {
        ...updatedChild,
        children: propagateContextToChildren(updatedChild).children
      };
    }
    
    return updatedChild;
  });
  
  return {
    ...component,
    children: updatedChildren
  };
};

// Reducer function for state management
function playgroundReducer(state: PlaygroundState, action: PlaygroundAction): PlaygroundState {
  let newState: PlaygroundState;
  
  switch (action.type) {
    case 'ADD_COMPONENT': {
      const newState = {
        ...state,
        components: [...state.components, action.payload],
        lastUpdated: Date.now(),
      };
      console.log('Component added:', action.payload.type);
      return newState;
    }

    case 'UPDATE_COMPONENT': {
      const updateComponent = (components: ComponentConfig[]): ComponentConfig[] => {
        return components.map(comp => {
          if (comp.id === action.payload.id) {
            console.log('Updating component:', comp.id, 'with props:', action.payload.props);
            const updatedComponent = {
              ...comp,
              props: {
                ...comp.props,
                ...action.payload.props,
              },
            };
            
            // If contextPath is being updated, this is critical for context propagation
            if (action.payload.props && 'contextPath' in action.payload.props) {
              console.log(`⚠️ ContextPath changed to "${action.payload.props.contextPath}" - force propagating context`);
              // Always propagate to children when contextPath changes, even if no context data yet
              return propagateContextToChildren(updatedComponent);
            }
            
            // If this component has context data, propagate to children
            if (updatedComponent.contextData && updatedComponent.children && updatedComponent.children.length > 0) {
              console.log(`🔄 Component has context data - propagating to ${updatedComponent.children.length} children`);
              return propagateContextToChildren(updatedComponent);
            }
            
            return updatedComponent;
          }
          if (comp.children && comp.children.length > 0) {
            return {
              ...comp,
              children: updateComponent(comp.children),
            };
          }
          return comp;
        });
      };

      const updatedComponents = updateComponent(state.components);
      
      // Find the updated component to maintain selection
      const findUpdatedComponent = (components: ComponentConfig[], id: string): ComponentConfig | null => {
        for (const comp of components) {
          if (comp.id === id) return comp;
          if (comp.children && comp.children.length > 0) {
            const found = findUpdatedComponent(comp.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      // Always get the freshest version of the component after update
      const updatedSelectedComponent = action.payload.id === state.selectedComponent?.id
        ? findUpdatedComponent(updatedComponents, action.payload.id)
        : state.selectedComponent;

      const newState = {
        ...state,
        components: updatedComponents,
        selectedComponent: updatedSelectedComponent,
        lastUpdated: Date.now(),
      };
      
      return newState;
    }

    case 'DELETE_COMPONENT': {
      const removeComponent = (components: ComponentConfig[]): ComponentConfig[] => {
        return components.filter(comp => {
          if (comp.id === action.payload) return false;
          if (comp.children && comp.children.length > 0) {
            comp.children = removeComponent(comp.children);
          }
          return true;
        });
      };

      const newState = {
        ...state,
        components: removeComponent(state.components),
        selectedComponent: state.selectedComponent?.id === action.payload ? null : state.selectedComponent,
        lastUpdated: Date.now(),
      };
      console.log('Component deleted:', action.payload);
      return newState;
    }

    case 'SELECT_COMPONENT':
      return {
        ...state,
        selectedComponent: action.payload,
        lastUpdated: Date.now(),
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
      
      // Find the component being moved
      const findComponent = (components: ComponentConfig[], id: string): ComponentConfig | null => {
        for (const comp of components) {
          if (comp.id === id) return comp;
          if (comp.children && comp.children.length > 0) {
            const found = findComponent(comp.children, id);
            if (found) return { ...found }; // Return a copy to avoid reference issues
          }
        }
        return null;
      };
      
      // Create a deep clone of the source component to avoid reference issues
      const sourceComponent = findComponent(state.components, sourceId);
      if (!sourceComponent) return state;
      
      // Clone the source component to avoid reference issues
      const sourceComponentClone = JSON.parse(JSON.stringify(sourceComponent));
      
      // Remove the component from its current position, but make a copy first
      const removeComponent = (components: ComponentConfig[], id: string): ComponentConfig[] => {
        const result: ComponentConfig[] = [];
        for (const comp of components) {
          if (comp.id === id) {
            // Skip this component (will be added elsewhere)
            continue;
          }
          
          const newComp = { ...comp };
          if (newComp.children && newComp.children.length > 0) {
            newComp.children = removeComponent(newComp.children, id);
          }
          result.push(newComp);
        }
        return result;
      };
      
      // Start with a fresh copy of the components
      const newComponents = removeComponent(state.components, sourceId);
      
      // Helper to add the component to the right position
      const addComponent = (components: ComponentConfig[], targetId: string, component: ComponentConfig, position: DropPosition): ComponentConfig[] => {
        return components.map(comp => {
          if (comp.id === targetId) {
            // Add component relative to this one
            if (position === 'inside') {
              const updatedComp = {
                ...comp,
                children: [...(comp.children || []), component],
              };
              // If the target has context data, propagate it to the new child
              if (comp.contextData) {
                return propagateContextToChildren(updatedComp);
              }
              return updatedComp;
            }
          }
          
          // Check for children
          if (comp.children && comp.children.length > 0) {
            const result = addComponent(comp.children, targetId, component, position);
            
            // If children were changed, update this component
            if (result !== comp.children) {
              return { ...comp, children: result };
            }
          }
          
          return comp;
        });
      };

      // Find where the target component exists at the root level
      const targetIndex = newComponents.findIndex(comp => comp.id === targetId);
      
      if (targetIndex !== -1) {
        // If target is at root level, handle 'before' and 'after' here
        if (position === 'before') {
          newComponents.splice(targetIndex, 0, sourceComponentClone);
        } else if (position === 'after') {
          newComponents.splice(targetIndex + 1, 0, sourceComponentClone);
        } else {
          // For 'inside', add as a child
          return {
            ...state,
            components: addComponent(newComponents, targetId, sourceComponentClone, position),
            lastUpdated: Date.now(),
          };
        }
        
        return {
          ...state,
          components: newComponents,
          lastUpdated: Date.now(),
        };
      }
      
      // If we get here, the target is nested - use addComponent for all positions
      return {
        ...state,
        components: addComponent(newComponents, targetId, sourceComponentClone, position),
        lastUpdated: Date.now(),
      };
    }

    case 'REORDER_COMPONENTS': {
      return {
        ...state,
        components: action.payload,
        lastUpdated: Date.now(),
      };
    }

    case 'SET_TECH_STACK': {
      return {
        ...state,
        techStack: action.payload,
        lastUpdated: Date.now(),
      };
    }

    case 'TOGGLE_PREVIEW_MODE': {
      return {
        ...state,
        previewMode: action.payload,
      };
    }

    case 'ADD_CHILD_COMPONENT': {
      const { parentId, component } = action.payload;
      
      // Helper to add a component to a parent
      const addChildToParent = (components: ComponentConfig[]): ComponentConfig[] => {
        return components.map(comp => {
          if (comp.id === parentId) {
            const updatedComp = {
              ...comp,
              children: [...(comp.children || []), component],
            };
            // If parent has context data, propagate to the new child
            if (comp.contextData) {
              return propagateContextToChildren(updatedComp);
            }
            return updatedComp;
          }
          if (comp.children && comp.children.length > 0) {
            return {
              ...comp,
              children: addChildToParent(comp.children),
            };
          }
          return comp;
        });
      };

      return {
        ...state,
        components: addChildToParent(state.components),
        lastUpdated: Date.now(),
      };
    }

    case 'UPDATE_API_CONFIG': {
      const { id, apiConfig } = action.payload;
      
      // Helper to update the API config
      const updateApiConfig = (components: ComponentConfig[]): ComponentConfig[] => {
        return components.map(comp => {
          if (comp.id === id) {
            return {
              ...comp,
              apiConfig,
            };
          }
          if (comp.children && comp.children.length > 0) {
            return {
              ...comp,
              children: updateApiConfig(comp.children),
            };
          }
          return comp;
        });
      };

      return {
        ...state,
        components: updateApiConfig(state.components),
        lastUpdated: Date.now(),
      };
    }

    case 'UPDATE_CONTEXT_DATA': {
      const { id, contextData } = action.payload;
      
      // Helper to update the context data
      const updateContextData = (components: ComponentConfig[]): ComponentConfig[] => {
        return components.map(comp => {
          if (comp.id === id) {
            // Update the component's context data
            const updatedComp = {
              ...comp,
              contextData,
            };
            
            // Propagate context data to children
            if (updatedComp.children && updatedComp.children.length > 0) {
              return propagateContextToChildren(updatedComp);
            }
            
            return updatedComp;
          }
          
          if (comp.children && comp.children.length > 0) {
            return {
              ...comp,
              children: updateContextData(comp.children),
            };
          }
          return comp;
        });
      };

      return {
        ...state,
        components: updateContextData(state.components),
        lastUpdated: Date.now(),
      };
    }

    case 'UPDATE_CONTEXT_TRANSFORM': {
      const { id, contextTransform } = action.payload;
      
      // Helper to update the context transform code
      const updateContextTransform = (components: ComponentConfig[]): ComponentConfig[] => {
        return components.map(comp => {
          if (comp.id === id) {
            return {
              ...comp,
              contextTransform,
            };
          }
          if (comp.children && comp.children.length > 0) {
            return {
              ...comp,
              children: updateContextTransform(comp.children),
            };
          }
          return comp;
        });
      };

      return {
        ...state,
        components: updateContextTransform(state.components),
        lastUpdated: Date.now(),
      };
    }

    case 'IMPORT_PLAYGROUND_DATA': {
      const importedData = action.payload;
      
      // Validate that the imported data has the right structure
      if (!importedData.components) {
        console.error('Invalid playground data format: missing components array');
        return state;
      }
      
      newState = {
        ...state,
        components: importedData.components,
        techStack: importedData.techStack || state.techStack,
        lastUpdated: Date.now(),
        // Reset selection since the component ids will be different
        selectedComponent: null,
        dropTarget: null,
      };
      
      console.log('Imported playground data', importedData);
      return newState;
    }

    default:
      return state;
  }
}

// Create the context
const PlaygroundContext = createContext<{
  state: PlaygroundState;
  dispatch: React.Dispatch<PlaygroundAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Provider component
export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playgroundReducer, initialState);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      // Remove selectedComponent and dropTarget before saving
      const stateToSave = {
        ...state,
        selectedComponent: null,
        dropTarget: null,
      };
      
      localStorage.setItem(PLAYGROUND_STORAGE_KEY, JSON.stringify(stateToSave));
      console.log('Saved playground state to localStorage');
    } catch (err) {
      console.error('Error saving playground state:', err);
    }
  }, [state.components, state.techStack]);

  return (
    <PlaygroundContext.Provider value={{ state, dispatch }}>
      {children}
    </PlaygroundContext.Provider>
  );
}

// Custom hook for accessing the context
export function usePlayground() {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error('usePlayground must be used within a PlaygroundProvider');
  }
  return context;
} 