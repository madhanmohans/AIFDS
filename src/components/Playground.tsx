import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Avatar,
  Divider,
  IconButton,
  AppBar,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Stack,
  Tooltip,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';
import { generateReactComponent, generateReactApp, exportPlayground, generateComponentForTechStack } from '../services/codeGenerator';
import JSZip from 'jszip';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { usePlayground } from '../context/PlaygroundContext';
import { availableComponents } from '../config/components';
import type { ComponentConfig, TechStack } from '../types/playground';

// Import our modularized components
import ComponentsPanel from './playground/ComponentsPanel';
import PropertiesPanel from './playground/PropertiesPanel';
import PlaygroundArea from './playground/PlaygroundArea';

// Add TypeScript interfaces for drag and drop operations
interface DragResult {
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
  draggableId: string;
}

type DropPosition = 'before' | 'after' | 'inside';

// Enhanced ComponentConfig interface to explicitly support recursion
interface EnhancedComponentConfig extends ComponentConfig {
  children?: EnhancedComponentConfig[];
}

// Helper function to safely cast to the enhanced type
const asEnhanced = (comp: ComponentConfig): EnhancedComponentConfig => comp as EnhancedComponentConfig;

// Helper function to safely get children array with proper typing
const safeChildren = (comp: ComponentConfig): ComponentConfig[] => {
  return comp.children || [];
};

// Add debounce utility function 
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Create PropertyField components to handle different property types
const PropertyTextField = ({ 
  prop, 
  value, 
  onChange 
}: { 
  prop: any; 
  value: any; 
  onChange: (val: any) => void 
}) => {
  const [localValue, setLocalValue] = useState(value || prop.default || '');
  const debouncedValue = useDebounce(localValue, 300);
  
  // Update when prop value changes (e.g., when selected component changes)
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || prop.default || '');
    }
  }, [value, prop.default]);
  
  useEffect(() => {
    if (debouncedValue !== value && debouncedValue !== undefined) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);
  
  return (
    <TextField
      fullWidth
      label={prop.label}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      margin="normal"
      size="small"
      sx={{
        '& .MuiInputBase-input': {
          fontWeight: prop.label.toLowerCase() === 'font weight' ? localValue : 'normal',
          fontStyle: prop.label.toLowerCase() === 'font style' ? localValue : 'normal',
        }
      }}
    />
  );
};

const PropertySelectField = ({ 
  prop, 
  value, 
  onChange 
}: { 
  prop: any; 
  value: any; 
  onChange: (val: any) => void 
}) => {
  const [localValue, setLocalValue] = useState(value || prop.default || '');
  const debouncedValue = useDebounce(localValue, 300);
  
  // Update when prop value changes (e.g., when selected component changes)
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || prop.default || '');
    }
  }, [value, prop.default]);
  
  useEffect(() => {
    if (debouncedValue !== value && debouncedValue !== undefined) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);
  
  return (
    <FormControl fullWidth margin="normal" size="small">
      <InputLabel>{prop.label}</InputLabel>
      <Select
        value={localValue}
        label={prop.label}
        onChange={(e) => setLocalValue(e.target.value)}
      >
        {prop.options.map((option: string) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const PropertyColorField = ({ 
  prop, 
  value, 
  onChange 
}: { 
  prop: any; 
  value: any; 
  onChange: (val: any) => void 
}) => {
  const [localValue, setLocalValue] = useState(value || prop.default || '#000000');
  const debouncedValue = useDebounce(localValue, 300);
  
  // Update when prop value changes (e.g., when selected component changes)
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || prop.default || '#000000');
    }
  }, [value, prop.default]);
  
  useEffect(() => {
    if (debouncedValue !== value && debouncedValue !== undefined) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
      <Typography variant="body2">{prop.label}:</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box 
          sx={{ 
            width: 20, 
            height: 20, 
            backgroundColor: localValue,
            border: '1px solid #ccc',
            borderRadius: 1,
            mr: 1
          }} 
        />
        <TextField
          size="small"
          type="color"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          sx={{ width: 120 }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Box>
  );
};

const PropertyNumberField = ({ 
  prop, 
  value, 
  onChange 
}: { 
  prop: any; 
  value: any; 
  onChange: (val: any) => void 
}) => {
  const [localValue, setLocalValue] = useState(Number(value) || prop.default || 0);
  const debouncedValue = useDebounce(localValue, 300);
  
  // Update when prop value changes (e.g., when selected component changes)
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(Number(value) || prop.default || 0);
    }
  }, [value, prop.default]);
  
  useEffect(() => {
    if (debouncedValue !== value && debouncedValue !== undefined) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);
  
  return (
    <Box sx={{ my: 1 }}>
      <Typography variant="body2" gutterBottom>
        {prop.label}: {localValue}
      </Typography>
      <Slider
        size="small"
        value={localValue}
        min={prop.min || 0}
        max={prop.max || 100}
        step={prop.step || 1}
        onChange={(_, newValue) => setLocalValue(newValue as number)}
        valueLabelDisplay="auto"
      />
    </Box>
  );
};

const PropertyBooleanField = ({ 
  prop, 
  value, 
  onChange 
}: { 
  prop: any; 
  value: any; 
  onChange: (val: any) => void 
}) => {
  const [localValue, setLocalValue] = useState(value === true || value === 'true');
  const debouncedValue = useDebounce(localValue, 300);
  
  // Update when prop value changes (e.g., when selected component changes)
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value === true || value === 'true');
    }
  }, [value]);
  
  useEffect(() => {
    if (debouncedValue !== value && debouncedValue !== undefined) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);
  
  return (
    <FormControlLabel
      control={
        <Switch
          checked={localValue}
          onChange={(e) => setLocalValue(e.target.checked)}
          size="small"
        />
      }
      label={prop.label}
      sx={{ my: 1 }}
    />
  );
};

// Helper function to convert hex color to RGB for animation
const hexToRgb = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
};

export default function Playground() {
  const { state, dispatch } = usePlayground();
  const { components, selectedComponent, selectedAvailableComponent, dropTarget } = state;
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  
  const debouncedSearchText = useDebounce(searchText, 300);
  
  // Get a color associated with the component type for visualization
  const getComponentColor = (type: string) => {
    switch(type) {
      case 'Section': return '#6caba8';
      case 'Typography': return '#e66e73';
      case 'Button': return '#6d597a';
      case 'Card': return '#b7bf96';
      case 'Image': return '#e6a456';
      case 'Flexbox': return '#7986cb';
      case 'Stack': return '#4db6ac';
      case 'ScrollableContainer': return '#9575cd';
      default: return '#6caba8';
    }
  };

  useEffect(() => {
    // Log the component tree for debugging
    // console.log('Component Tree Structure:', JSON.stringify(components, null, 2));
  }, [components]);

  const handleDragEnd = (result: DragResult) => {
    const { source, destination, draggableId } = result;
    
    // Clear drop target on drag end
    dispatch({ type: 'SET_DROP_TARGET', payload: null });
    
    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    console.log('Drag ended:', { source, destination, draggableId });

    // If dragging from available components panel to playground
    if (source.droppableId === 'available' && destination.droppableId === 'playground') {
      // Find the component from available components
      const sourceIndex = parseInt(source.index.toString());
      const componentType = availableComponents[sourceIndex];
      
      if (!componentType) {
        console.error('Component type not found:', sourceIndex);
        return;
      }

      // Create a new component with unique ID
      // IMPORTANT: All component types now support children for full recursive capability
      const newComponent: ComponentConfig = {
        id: `${componentType.id}-${Date.now()}`,
        type: componentType.type,
        props: { ...componentType.defaultProps },
        children: [], // All components can have children now
      };

      console.log('Adding new component:', newComponent);

      // Add the component to the state
      dispatch({ type: 'ADD_COMPONENT', payload: newComponent });
      
      // Select the component after adding it
      setTimeout(() => {
        dispatch({ type: 'SELECT_COMPONENT', payload: newComponent });
        setSnackbarMessage(`Added ${componentType.type} component`);
        setSnackbarOpen(true);
      }, 100);
    }
    // If reordering components within playground
    else if (source.droppableId === 'playground' && destination.droppableId === 'playground') {
      if (source.index === destination.index) {
        return;
      }

      // Instead of using the complex MOVE_COMPONENT action, let's create a simpler approach
      const reorderedComponents = [...components];
      const [removed] = reorderedComponents.splice(source.index, 1);
      reorderedComponents.splice(destination.index, 0, removed);
      
      // Directly update the state with the reordered components
      dispatch({ 
        type: 'REORDER_COMPONENTS', 
        payload: reorderedComponents 
      });
      
      setSnackbarMessage('Component reordered');
      setSnackbarOpen(true);
    }
  };

  const handleDragOver = (e: React.DragEvent, componentId: string) => {
    e.preventDefault(); // Ensure drop events fire
    e.stopPropagation(); // Stop propagation to parent elements
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const threshold = 0.2; // 20% threshold for top/bottom zones

    let position: DropPosition;
    if (y < height * threshold) {
      position = 'before';
    } else if (y > height * (1 - threshold)) {
      position = 'after';
    } else {
      // Check if the component allows nesting (has children property)
      const component = components.find(c => c.id === componentId);
      if (component && (component.type === 'Section' || component.type === 'Card')) {
        position = 'inside';
      } else {
        // Default to 'after' for components that don't support children
        position = 'after';
      }
    }

    // Highlight the drop target with the position
    dispatch({ type: 'SET_DROP_TARGET', payload: { id: componentId, position } });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      dispatch({ type: 'SET_DROP_TARGET', payload: null });
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    document.body.style.cursor = 'grabbing';
  };

  const renderDropIndicator = (position: DropPosition) => {
    const styles = {
      before: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: '#1976d2',
        zIndex: 1,
      },
      after: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: '#1976d2',
        zIndex: 1,
      },
      inside: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        border: '2px dashed #1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        zIndex: 1,
      },
    };

    return <Box sx={styles[position]} />;
  };

  const handleComponentSelect = (component: ComponentConfig) => {
    // Log the component being selected for debugging
    console.log('Selecting component:', component);
    
    // Clear any previously selected component to avoid stale data
    dispatch({ type: 'SELECT_COMPONENT', payload: null });
    
    // After a short delay to ensure the state is updated, set the new selection
    setTimeout(() => {
      // Find the most recent version of this component in case it was updated
      const freshComponent = findComponentById(components, component.id);
      
      // Dispatch the action to update the selected component in state
      dispatch({ type: 'SELECT_COMPONENT', payload: freshComponent || component });
      
      // Highlight the component in the DOM
      const componentElement = document.querySelector(`[data-test-id="${component.type.toLowerCase()}-${component.id}"]`);
      if (componentElement) {
        componentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Also clear any selected available component to avoid confusion
      dispatch({ type: 'SELECT_AVAILABLE_COMPONENT', payload: null });
    }, 50);
  };

  const handleDeleteComponent = (id: string) => {
    // Use recursive delete function to remove the component from the nested structure
    const updatedComponents = deleteComponentById(components, id);
    
    // Update the state with the filtered components
    dispatch({ type: 'REORDER_COMPONENTS', payload: updatedComponents });
    
    // If the deleted component was selected, clear the selection
    if (selectedComponent?.id === id) {
      dispatch({ type: 'SELECT_COMPONENT', payload: null });
    }
    
    setSnackbarMessage('Component deleted');
    setSnackbarOpen(true);
  };

  // Now let's replace the renderPropertyField function with one that doesn't use hooks directly
  const renderPropertyField = (key: string, prop: any, value: any, onChange: (newValue: any) => void) => {
    const handleChange = (newValue: any) => {
      console.log(`Property updated: ${key} = ${newValue}`);
      
      // Update the component in the global state
      if (selectedComponent) {
        // First, update the component in the component tree
        const updatedComponents = findAndUpdateNestedComponent(components, selectedComponent.id, (comp) => {
          return {
            ...comp,
            props: {
              ...comp.props,
              [key]: newValue
            }
          };
        });
        
        // Update the components array with the modified tree
        dispatch({ 
          type: 'REORDER_COMPONENTS', 
          payload: updatedComponents
        });
        
        // Then, update the selected component to show the changes in the properties panel
        dispatch({
          type: 'UPDATE_COMPONENT',
          payload: {
            id: selectedComponent.id,
            props: { [key]: newValue },
          },
        });
        
        setSnackbarMessage(`Updated ${prop.label.toLowerCase()} to "${newValue}"`);
        setSnackbarOpen(true);
      }
    };
    
    switch (prop.type) {
      case 'select':
        return <PropertySelectField prop={prop} value={value} onChange={handleChange} />;
      case 'color':
        return <PropertyColorField prop={prop} value={value} onChange={handleChange} />;
      case 'number':
        return <PropertyNumberField prop={prop} value={value} onChange={handleChange} />;
      case 'boolean':
        return <PropertyBooleanField prop={prop} value={value} onChange={handleChange} />;
      default:
        return <PropertyTextField prop={prop} value={value} onChange={handleChange} />;
    }
  };

  const renderComponent = (component: ComponentConfig) => {
    const isSelected = selectedComponent?.id === component.id;
    
    // Common component wrapper that applies to all components
    const ComponentWrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <Box
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleComponentSelect(component);
          }}
          sx={{
            position: 'relative',
            padding: component.props?.padding || 2,
            margin: component.props?.margin || 1,
            backgroundColor: component.props?.backgroundColor || 'transparent',
            borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : 0,
            border: component.props?.border || 'none',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              outline: '1px dashed #6caba8',
              '& .delete-btn': {
                opacity: 1,
                transform: 'scale(1)'
              },
              '& .drag-handle': {
                opacity: 1,
                transform: 'scale(1)'
              }
            },
            ...(isSelected && {
              outline: '2px solid #6caba8',
              boxShadow: '0 0 8px rgba(108, 171, 168, 0.3)'
            }),
            className: `cline-${component.type.toLowerCase()}`,
            'data-test-id': `${component.type.toLowerCase()}-${component.id}`,
            'data-selected': isSelected ? 'true' : 'false',
          }}
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            handleDragStart(e, component.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDragOver(e, component.id);
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.style.backgroundColor = '';
            e.currentTarget.style.outline = '';
            
            try {
              // Check if this is a new component being added
              const newComponentData = e.dataTransfer.getData('component');
              if (newComponentData) {
                const componentData = JSON.parse(newComponentData);
                const newComponent: ComponentConfig = {
                  id: `${componentData.id}-${Date.now()}`,
                  type: componentData.type,
                  props: { ...componentData.defaultProps },
                  children: [], // All components can have children
                };
                
                // Add to the children of the current component
                const updatedComponents = findAndUpdateNestedComponent(components, component.id, (comp) => {
                  return {
                    ...comp,
                    children: [...safeChildren(comp), newComponent]
                  };
                });
                
                dispatch({ 
                  type: 'REORDER_COMPONENTS', 
                  payload: updatedComponents
                });
                
                setSnackbarMessage(`Added ${componentData.type} inside ${component.type}`);
                setSnackbarOpen(true);
                
                // Select the new component
                setTimeout(() => {
                  dispatch({ type: 'SELECT_COMPONENT', payload: newComponent });
                }, 100);
              }
            } catch (err) {
              console.error('Error handling drop inside component:', err);
            }
          }}
        >
          {/* Component type indicator */}
          <Typography variant="caption" color="text.secondary" sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            fontSize: '10px', 
            backgroundColor: 'rgba(255,255,255,0.8)', 
            px: 0.5, 
            zIndex: 2,
            borderRadius: '0 0 0 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getComponentColor(component.type) }} />
            {component.type}
          </Typography>
          
          {/* Selection indicator */}
          {isSelected && (
            <Box
              sx={{
                position: 'absolute',
                top: -4,
                left: -4,
                right: -4,
                bottom: -4,
                border: `2px solid ${getComponentColor(component.type)}`,
                borderRadius: '4px',
                pointerEvents: 'none',
                zIndex: 1,
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { boxShadow: `0 0 0 0 rgba(${hexToRgb(getComponentColor(component.type))}, 0.7)` },
                  '70%': { boxShadow: `0 0 0 6px rgba(${hexToRgb(getComponentColor(component.type))}, 0)` },
                  '100%': { boxShadow: `0 0 0 0 rgba(${hexToRgb(getComponentColor(component.type))}, 0)` },
                },
              }}
            />
          )}
          
          {/* Delete button */}
          <Box
            className="delete-btn"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              opacity: 0,
              transform: 'scale(0.8)',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
          >
            <Tooltip title={`Delete ${component.type}`}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteComponent(component.id);
                }}
                sx={{
                  backgroundColor: '#e66e73',
                  color: 'white',
                  width: 18,
                  height: 18,
                  '& .MuiSvgIcon-root': {
                    fontSize: 12
                  },
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  '&:hover': {
                    backgroundColor: '#d25a5e',
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Drag handle */}
          <Box
            className="drag-handle"
            sx={{
              position: 'absolute',
              top: -8,
              left: -8,
              opacity: 0,
              transform: 'scale(0.8)',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
          >
            <Tooltip title={`Drag to reorder`}>
              <IconButton
                size="small"
                sx={{
                  backgroundColor: '#6caba8',
                  color: 'white',
                  width: 18,
                  height: 18,
                  '& .MuiSvgIcon-root': {
                    fontSize: 12
                  },
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  cursor: 'grab',
                  '&:hover': {
                    backgroundColor: '#5a9996',
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Actual component content */}
          {children}
          
          {/* Drop target indicator if this component is the current drop target */}
          {dropTarget?.id === component.id && dropTarget.position && (
            renderDropIndicator(dropTarget.position)
          )}
          
          {/* Children container - shown for all components */}
          <Box
            sx={{
              marginTop: 2,
              padding: component.type === 'Section' || component.type === 'Card' ? 0 : 1,
              borderRadius: 1,
              backgroundColor: component.type === 'Section' || component.type === 'Card' ? 'transparent' : 'rgba(245, 245, 245, 0.5)',
              borderLeft: component.type === 'Section' || component.type === 'Card' ? 'none' : `2px solid ${getComponentColor(component.type)}`,
              display: component.type === 'Button' || component.type === 'Typography' || component.type === 'Image' ? 
                (component.children && component.children.length > 0 ? 'block' : 'none') : 'block'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.style.backgroundColor = 'rgba(108, 171, 168, 0.1)';
              e.currentTarget.style.outline = '2px dashed #6caba8';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.style.backgroundColor = '';
              e.currentTarget.style.outline = '';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.style.backgroundColor = '';
              e.currentTarget.style.outline = '';
              
              try {
                // Check if this is a new component being added
                const newComponentData = e.dataTransfer.getData('component');
                if (newComponentData) {
                  const componentData = JSON.parse(newComponentData);
                  const newComponent: ComponentConfig = {
                    id: `${componentData.id}-${Date.now()}`,
                    type: componentData.type,
                    props: { ...componentData.defaultProps },
                    children: [], // All components can have children
                  };
                  
                  // Add to the children of the current component
                  const updatedComponents = findAndUpdateNestedComponent(components, component.id, (comp) => {
                    return {
                      ...comp,
                      children: [...safeChildren(comp), newComponent]
                    };
                  });
                  
                  dispatch({ 
                    type: 'REORDER_COMPONENTS', 
                    payload: updatedComponents
                  });
                  
                  setSnackbarMessage(`Added ${componentData.type} inside ${component.type}`);
                  setSnackbarOpen(true);
                  
                  // Select the new component
                  setTimeout(() => {
                    dispatch({ type: 'SELECT_COMPONENT', payload: newComponent });
                  }, 100);
                }
              } catch (err) {
                console.error('Error handling drop inside component:', err);
              }
            }}
          >
            {/* Render children components recursively */}
            {component.children && component.children.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {component.children.map((child, index) => (
                  <Box 
                    key={child.id}
                    sx={{ position: 'relative' }}
                  >
                    {renderComponent(child)}
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ 
                padding: 1, 
                textAlign: 'center', 
                color: 'text.secondary',
                border: '1px dashed #ccc',
                borderRadius: 1,
                display: component.type === 'Button' || component.type === 'Typography' || component.type === 'Image' ? 'none' : 'block',
              }}>
                <Typography variant="caption">
                  Drop components here
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      );
    };
    
    // Render the specific component type with the common wrapper
    switch (component.type) {
      case 'Section':
        return (
          <ComponentWrapper>
            <Box
              sx={{
                padding: component.props?.padding || 2,
                backgroundColor: component.props?.backgroundColor || '#f9f9f9',
                borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : 0,
                border: component.props?.border || '1px solid #eee',
                position: 'relative',
                borderLeft: `3px solid ${getComponentColor(component.type)}`
              }}
            />
          </ComponentWrapper>
        );
        
      case 'Typography':
        return (
          <ComponentWrapper>
            <Typography 
              variant={component.props?.variant || 'body1'}
              align={component.props?.align || 'left'}
              sx={{ 
                color: component.props?.color || '#153447',
                fontSize: component.props?.fontSize ? `${component.props.fontSize}px` : 'inherit',
                fontWeight: component.props?.fontWeight || 'normal',
                fontStyle: component.props?.fontStyle || 'normal',
                textDecoration: component.props?.textDecoration || 'none',
                letterSpacing: component.props?.letterSpacing || 'normal',
                lineHeight: component.props?.lineHeight || 'normal',
                textTransform: component.props?.textTransform || 'none',
                padding: 1,
                '&::before': selectedComponent?.id === component.id ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: getComponentColor(component.type),
                } : {},
              }}
            >
              {component.props?.children || 'Text Content'}
            </Typography>
            
            {selectedComponent?.id === component.id && (
              <Box sx={{ 
                mt: 1, 
                pt: 1, 
                borderTop: '1px dashed #ccc',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
              }}>
                {component.props?.fontWeight && component.props.fontWeight !== 'normal' && (
                  <Chip size="small" label={`Weight: ${component.props.fontWeight}`} sx={{ fontSize: '10px' }} />
                )}
                {component.props?.fontStyle && component.props.fontStyle !== 'normal' && (
                  <Chip size="small" label={`Style: ${component.props.fontStyle}`} sx={{ fontSize: '10px' }} />
                )}
                {component.props?.fontSize && (
                  <Chip size="small" label={`Size: ${component.props.fontSize}px`} sx={{ fontSize: '10px' }} />
                )}
                {component.props?.textTransform && component.props.textTransform !== 'none' && (
                  <Chip size="small" label={`Transform: ${component.props.textTransform}`} sx={{ fontSize: '10px' }} />
                )}
              </Box>
            )}
          </ComponentWrapper>
        );
      
      case 'Image':
        return (
          <ComponentWrapper>
            <Avatar 
              src={component.props?.src || 'https://placehold.co/150'}
              alt={component.props?.alt}
              sx={{ 
                width: component.props?.width || 150, 
                height: component.props?.height || 150,
                borderRadius: component.props?.borderRadius || '50%',
                objectFit: component.props?.objectFit || 'cover',
                border: component.props?.border || 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </ComponentWrapper>
        );
      
      case 'Card':
        return (
          <ComponentWrapper>
            <Card 
              sx={{ 
                maxWidth: component.props?.maxWidth || 345,
                backgroundColor: component.props?.backgroundColor || '#fff',
                borderRadius: `${component.props?.borderRadius || 4}px`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                borderTop: `3px solid ${getComponentColor(component.type)}`,
                position: 'relative'
              }}
              elevation={component.props?.elevation || 1}
              variant={component.props?.variant || 'elevation'}
            >
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  position: 'absolute', 
                  top: 5, 
                  right: 5, 
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getComponentColor(component.type) }} />
                  Card
                </Typography>
              </CardContent>
            </Card>
          </ComponentWrapper>
        );
      
      case 'Button':
        return (
          <ComponentWrapper>
            <Button 
              variant={component.props?.variant || 'contained'}
              color="primary"
              size={component.props?.size || 'medium'}
              disabled={component.props?.disabled === 'true' || component.props?.disabled === true}
              sx={{
                borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : undefined,
                backgroundColor: component.props?.color === 'primary' ? '#6caba8' : 
                               component.props?.color === 'secondary' ? '#6d597a' :
                               component.props?.color === 'error' ? '#e66e73' :
                               component.props?.color === 'warning' ? '#e6a456' :
                               component.props?.color === 'success' ? '#b7bf96' : '#6caba8',
                '&:hover': {
                  backgroundColor: component.props?.color === 'primary' ? '#5a9996' : 
                                 component.props?.color === 'secondary' ? '#5d4a68' :
                                 component.props?.color === 'error' ? '#d25a5e' :
                                 component.props?.color === 'warning' ? '#d09145' :
                                 component.props?.color === 'success' ? '#9ba77c' : '#5a9996'
                },
                position: 'relative',
                boxShadow: component.props?.variant === 'contained' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                border: component.props?.variant === 'outlined' ? 
                  `1px solid ${
                    component.props?.color === 'primary' ? '#6caba8' : 
                    component.props?.color === 'secondary' ? '#6d597a' :
                    component.props?.color === 'error' ? '#e66e73' :
                    component.props?.color === 'warning' ? '#e6a456' :
                    component.props?.color === 'success' ? '#b7bf96' : '#6caba8'
                  }` : 'none',
                color: component.props?.variant === 'contained' ? '#fff' : 
                      component.props?.color === 'primary' ? '#6caba8' : 
                      component.props?.color === 'secondary' ? '#6d597a' :
                      component.props?.color === 'error' ? '#e66e73' :
                      component.props?.color === 'warning' ? '#e6a456' :
                      component.props?.color === 'success' ? '#b7bf96' : '#6caba8'
              }}
            >
              {component.props?.children || 'Button'}
            </Button>
          </ComponentWrapper>
        );
      
      case 'Flexbox':
        return (
          <ComponentWrapper>
            <Box
              sx={{
                display: 'flex',
                flexDirection: component.props?.flexDirection || 'row',
                justifyContent: component.props?.justifyContent || 'flex-start',
                alignItems: component.props?.alignItems || 'center',
                flexWrap: component.props?.flexWrap || 'nowrap',
                gap: component.props?.gap || 2,
                padding: component.props?.padding || 2,
                backgroundColor: component.props?.backgroundColor || 'transparent',
                borderLeft: `3px solid ${getComponentColor(component.type)}`,
                minHeight: 50,
              }}
            />
          </ComponentWrapper>
        );
      
      case 'Stack':
        return (
          <ComponentWrapper>
            <Stack
              direction={component.props?.direction || 'column'}
              spacing={component.props?.spacing || 2}
              alignItems={component.props?.alignItems || 'flex-start'}
              justifyContent={component.props?.justifyContent || 'flex-start'}
              sx={{
                padding: component.props?.padding || 2,
                backgroundColor: component.props?.backgroundColor || 'transparent',
                borderLeft: `3px solid ${getComponentColor(component.type)}`,
                minHeight: 50,
                width: '100%',
              }}
            />
          </ComponentWrapper>
        );

      case 'ScrollableContainer':
        return (
          <ComponentWrapper>
            <Box
              sx={{
                height: component.props?.height || 200,
                width: component.props?.width || '100%',
                overflow: 'auto',
                padding: component.props?.padding || 2,
                backgroundColor: component.props?.backgroundColor || 'transparent',
                borderRadius: component.props?.borderRadius || 1,
                border: component.props?.border || '1px solid #e0e0e0',
                borderLeft: `3px solid ${getComponentColor(component.type)}`,
                position: 'relative',
              }}
            />
          </ComponentWrapper>
        );
      
      default:
        return null;
    }
  };

  const generateCode = async () => {
    // Create a new ZIP file
    const zip = new JSZip();
    
    // Use the enhanced exportPlayground function to generate all necessary files
    const { techStack } = state;
    const { 
      code: componentCode, 
      css: componentCss, 
      fileSuffix,
      packageJson,
      readme,
      appJs,
      indexHtml
    } = exportPlayground(components, techStack);
    
    // Create folder structure based on tech stack
    switch(techStack) {
      case 'react':
      case 'react-typescript':
        // Add component and related files
        zip.file(`src/components/MyComponent${fileSuffix}`, componentCode);
        zip.file('src/styles/app.css', componentCss);
        
        // Update App file with correct import path
        const correctAppJs = appJs.replace(
          "import MyComponent from './MyComponent';", 
          "import MyComponent from './components/MyComponent';"
        );
        
        zip.file(`src/App${fileSuffix}`, correctAppJs);
        
        // Add index file based on tech stack
        const indexExtension = techStack === 'react-typescript' ? '.tsx' : '.jsx';
        zip.file(`src/index${indexExtension}`, `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/app.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`);

        // Add package.json and README
        zip.file('package.json', packageJson);
        zip.file('README.md', readme);
        zip.file('public/index.html', indexHtml);
        
        // Add tsconfig.json for TypeScript projects
        if (techStack === 'react-typescript') {
          zip.file('tsconfig.json', `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}`);
        }
        break;
        
      case 'vue':
        // Vue uses a different structure with single file components
        zip.file('src/components/MyComponent.vue', componentCode);
        zip.file('src/App.vue', `<template>
  <div class="app">
    <MyComponent />
  </div>
</template>

<script>
import MyComponent from './components/MyComponent.vue';

export default {
  name: 'App',
  components: {
    MyComponent
  }
};
</script>

<style>
${componentCss}
</style>`);
        
        // Add main.js and index.html
        zip.file('src/main.js', `import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');`);
        
        zip.file('package.json', packageJson);
        zip.file('README.md', readme);
        zip.file('public/index.html', indexHtml);
        break;
        
      case 'angular':
        // Angular uses a module-based structure
        const componentName = 'MyComponent';
        const dashedName = 'my-component';
        
        // Component files
        zip.file(`src/app/components/${dashedName}/${dashedName}.component.ts`, componentCode);
        zip.file(`src/app/components/${dashedName}/${dashedName}.component.css`, componentCss);
        
        // Add app module
        zip.file('src/app/app.module.ts', `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { ${componentName}Component } from './components/${dashedName}/${dashedName}.component';

@NgModule({
  declarations: [
    AppComponent,
    ${componentName}Component
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }`);
        
        // Add app component
        zip.file('src/app/app.component.ts', `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div class="app-container">
      <app-${dashedName}></app-${dashedName}>
    </div>
  \`,
  styles: [\`
    .app-container {
      font-family: Arial, sans-serif;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
  \`]
})
export class AppComponent {
  title = 'Generated App';
}`);
        
        // Add main.ts
        zip.file('src/main.ts', `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`);
        
        zip.file('package.json', packageJson);
        zip.file('README.md', readme);
        zip.file('src/index.html', indexHtml);
        break;
    }
    
    // Generate and download the ZIP file
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${techStack}-project.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Show success message
    setSnackbarMessage(`${techStack} code generated successfully!`);
    setSnackbarOpen(true);
  };

  // Helper to export component tree as JSON
  const exportComponentTree = () => {
    // Extract API configurations
    const apiConfigs = components
      .filter(comp => comp.apiConfig?.enabled)
      .map(comp => ({
        id: comp.id,
        url: comp.apiConfig?.url,
        method: comp.apiConfig?.method,
        headers: comp.apiConfig?.headers,
        payload: comp.apiConfig?.payload,
        dataPath: comp.props.dataPath || ''
      }));
    
    // Create a more structured export
    const exportData = {
      version: '1.0',
      metadata: {
        exportedAt: new Date().toISOString(),
        componentCount: components.length
      },
      techStack: state.techStack,
      components,
      apiConfigs: apiConfigs.length > 0 ? apiConfigs : undefined
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'component-tree.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSnackbarMessage('Component tree exported as JSON');
    setSnackbarOpen(true);
  };

  // Helper to import component tree from JSON
  const importComponentTree = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          
          // Handle either the new structured format or the old format
          const components = importedData.components || importedData;
          const techStack = importedData.techStack || state.techStack;
          
          if (Array.isArray(components)) {
            // Process components to ensure IDs are unique
            const processedComponents = components.map(comp => ({
              ...comp,
              id: comp.id.includes(Date.now().toString()) 
                ? comp.id 
                : `${comp.id}-${Date.now()}`
            }));
            
            dispatch({ 
              type: 'IMPORT_PLAYGROUND_DATA', 
              payload: {
                components: processedComponents,
                techStack
              } 
            });
            
            setSnackbarMessage('Component tree imported successfully');
            setSnackbarOpen(true);
          } else {
            throw new Error('Invalid JSON format: components array not found');
          }
        } catch (error) {
          console.error('Error importing JSON:', error);
          setSnackbarMessage('Error importing JSON: Invalid format');
          setSnackbarOpen(true);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Get component configuration for the selected component
  const getComponentConfig = (type: string) => {
    return availableComponents.find(c => c.type === type);
  };

  // Add support for dropping components inside container components
  const handleDrop = (e: React.DragEvent, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedComponentId = e.dataTransfer.getData('text/plain');
    if (!draggedComponentId) return;
    
    // Find the component that's being dragged
    const draggedComponentType = availableComponents.find(
      c => c.id === draggedComponentId.split('-')[0]
    );
    
    if (!draggedComponentType) return;
    
    // Create a new component
    const newComponent: ComponentConfig = {
      id: `${draggedComponentType.id}-${Date.now()}`,
      type: draggedComponentType.type,
      props: { ...draggedComponentType.defaultProps },
      children: draggedComponentType.type === 'Section' || draggedComponentType.type === 'Card' ? [] : undefined,
    };
    
    // Find the target component where we're dropping
    const targetComponent = findComponentById(components, componentId);
    if (!targetComponent) return;
    
    if (dropTarget?.position === 'inside' && 
        (targetComponent.type === 'Section' || targetComponent.type === 'Card')) {
      // Add the component as a child of the target
      dispatch({
        type: 'UPDATE_COMPONENT',
        payload: {
          id: targetComponent.id,
          props: {
            children: [...(targetComponent.children || []), newComponent]
          },
        },
      });
    }
    
    // Clear the drop target
    dispatch({ type: 'SET_DROP_TARGET', payload: null });
    
    // Show success message
    setSnackbarMessage(`Added ${newComponent.type} to ${targetComponent.type}`);
    setSnackbarOpen(true);
  };

  // Helper function to fix the type error in recursive function calls
  const findAndUpdateComponent = (comps: ComponentConfig[], targetId: string): boolean => {
    for (let i = 0; i < comps.length; i++) {
      if (comps[i].id === targetId) {
        // Found the component
        return true;
      }
      
      // Try to find in children (with type safety)
      const children = comps[i].children;
      if (children && children.length > 0 && findAndUpdateComponent(children, targetId)) {
        return true;
      }
    }
    return false;
  };

  // Update existing findComponentById to handle children safely
  const findComponentById = (components: ComponentConfig[], id: string): ComponentConfig | null => {
    for (const comp of components) {
      if (comp.id === id) return comp;
      
      const children = comp.children;
      if (children && children.length > 0) {
        const found = findComponentById(children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Update deleteComponentById to handle children safely
  const deleteComponentById = (components: ComponentConfig[], id: string): ComponentConfig[] => {
    return components.filter(comp => {
      if (comp.id === id) return false;
      
      const children = comp.children;
      if (children && children.length > 0) {
        comp.children = deleteComponentById(children, id);
      }
      
      return true;
    });
  };

  // Update findAndUpdateNestedComponent to handle children safely
  const findAndUpdateNestedComponent = (
    components: ComponentConfig[],
    targetId: string,
    updateFn: (component: ComponentConfig) => ComponentConfig
  ): ComponentConfig[] => {
    return components.map(comp => {
      if (comp.id === targetId) {
        return updateFn(comp);
      }
      
      const children = comp.children;
      if (children && children.length > 0) {
        return {
          ...comp,
          children: findAndUpdateNestedComponent(children, targetId, updateFn)
        };
      }
      
      return comp;
    });
  };

  return (
    <Box id="root" sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
        {/* Top App Bar */}
        <AppBar position="static" sx={{ backgroundColor: '#153447' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, color: '#fff' }}>
              Low-Code Playground
            </Typography>
            
            {/* Tech Stack Selector */}
            <FormControl size="small" sx={{ minWidth: 150, mr: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1 }}>
              <InputLabel id="tech-stack-select-label" sx={{ color: 'rgba(255,255,255,0.8)' }}>Tech Stack</InputLabel>
              <Select
                labelId="tech-stack-select-label"
                id="tech-stack-select"
                value={state.techStack}
                label="Tech Stack"
                onChange={(e) => dispatch({ type: 'SET_TECH_STACK', payload: e.target.value as TechStack })}
                sx={{ 
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '.MuiSvgIcon-root': {
                    color: 'rgba(255,255,255,0.8)',
                  }
                }}
                data-test-id="tech-stack-select"
              >
                <MenuItem value="react">React</MenuItem>
                <MenuItem value="react-typescript">React (TypeScript)</MenuItem>
                <MenuItem value="vue">Vue</MenuItem>
                <MenuItem value="angular">Angular</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              onClick={exportComponentTree}
              startIcon={<FileDownloadIcon />}
              sx={{ mr: 1, color: '#fff', borderColor: 'rgba(255, 255, 255, 0.5)' }}
            >
              Export JSON
            </Button>
            <Button
              variant="outlined"
              onClick={importComponentTree}
              startIcon={<FileUploadIcon />}
              sx={{ mr: 1, color: '#fff', borderColor: 'rgba(255, 255, 255, 0.5)' }}
            >
              Import JSON
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={generateCode}
              sx={{ backgroundColor: '#e66e73', '&:hover': { backgroundColor: '#d25a5e' } }}
            >
              Generate {state.techStack.charAt(0).toUpperCase() + state.techStack.slice(1)} Project
            </Button>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%', backgroundColor: '#f0f3f5' }}>
          {/* Components Panel - 20% Width */}
          <Box sx={{ width: '20%', minWidth: '200px', flexShrink: 0 }}>
            <ComponentsPanel searchText={searchText} />
          </Box>

          {/* Playground Area - 60% Width */}
          <Box sx={{ width: '60%', flex: 1, minWidth: 0 }}>
            <PlaygroundArea />
          </Box>

          {/* Properties Panel - 20% Width */}
          <Box sx={{ width: '20%', minWidth: '200px', flexShrink: 0 }}>
            <PropertiesPanel />
          </Box>
        </Box>
      </Box>
      
      {/* Notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={2000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSnackbarOpen(false)}
          sx={{ 
            minWidth: '250px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backgroundColor: '#6caba8',
            color: 'white',
            '& .MuiAlert-icon': {
              fontSize: '1.2rem',
              color: 'white'
            }
          }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
} 