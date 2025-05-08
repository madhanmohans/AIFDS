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
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';
import { CodeGenerator } from '../services/codeGenerator';
import JSZip from 'jszip';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { usePlayground } from '../context/PlaygroundContext';
import { availableComponents } from '../config/components';
import type { ComponentConfig } from '../context/PlaygroundContext';

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
  const [localValue, setLocalValue] = useState(value || prop.default);
  const debouncedValue = useDebounce(localValue, 500);
  
  useEffect(() => {
    if (debouncedValue !== value) {
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
  const [localValue, setLocalValue] = useState(value || prop.default);
  const debouncedValue = useDebounce(localValue, 500);
  
  useEffect(() => {
    if (debouncedValue !== value) {
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
  const [localValue, setLocalValue] = useState(value || prop.default);
  const debouncedValue = useDebounce(localValue, 500);
  
  useEffect(() => {
    if (debouncedValue !== value) {
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
  const [localValue, setLocalValue] = useState(Number(value) || prop.default);
  const debouncedValue = useDebounce(localValue, 500);
  
  useEffect(() => {
    if (debouncedValue !== value) {
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
        onChange={(_, newValue) => setLocalValue(newValue)}
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
  const debouncedValue = useDebounce(localValue, 500);
  
  useEffect(() => {
    if (debouncedValue !== value) {
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

export default function Playground() {
  const { state, dispatch } = usePlayground();
  const { components, selectedComponent, selectedAvailableComponent, dropTarget } = state;
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  useEffect(() => {
    // Log the component tree for debugging
    console.log('Component Tree Structure:', JSON.stringify(components, null, 2));
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
      const newComponent: ComponentConfig = {
        id: `${componentType.id}-${Date.now()}`,
        type: componentType.type,
        props: { ...componentType.defaultProps },
        children: componentType.type === 'Section' || componentType.type === 'Card' ? [] : undefined,
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
    dispatch({ type: 'SELECT_COMPONENT', payload: component });
  };

  const handleDeleteComponent = (id: string) => {
    dispatch({ type: 'DELETE_COMPONENT', payload: id });
    setSnackbarMessage('Component deleted');
    setSnackbarOpen(true);
  };

  // Now let's replace the renderPropertyField function with one that doesn't use hooks directly
  const renderPropertyField = (key: string, prop: any, value: any, onChange: (newValue: any) => void) => {
    const handleChange = (newValue: any) => {
      onChange(newValue);
      if (selectedComponent) {
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
    const commonProps = {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        handleComponentSelect(component);
        console.log('Selected nested component:', component);
      },
      sx: {
        position: 'relative',
        padding: component.props?.padding || 2,
        margin: component.props?.margin || 1,
        backgroundColor: component.props?.backgroundColor || 'transparent',
        borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : 0,
        border: component.props?.border || 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          outline: '1px dashed #6caba8',
        },
        ...(selectedComponent?.id === component.id && {
          outline: '2px solid #6caba8',
          boxShadow: '0 0 8px rgba(108, 171, 168, 0.3)'
        })
      },
    };

    const isSelected = selectedComponent?.id === component.id;
    
    // Get a color associated with the component type for visualization
    const getComponentColor = (type: string) => {
      switch(type) {
        case 'Section': return '#6caba8';
        case 'Typography': return '#e66e73';
        case 'Button': return '#6d597a';
        case 'Card': return '#b7bf96';
        case 'Image': return '#e6a456';
        default: return '#6caba8';
      }
    };
    
    const componentColor = getComponentColor(component.type);
    
    switch (component.type) {
      case 'Section':
        return (
          <Box {...commonProps}>
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
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: componentColor }} />
              Section
            </Typography>
            <Box
              sx={{
                padding: component.props?.padding || 2,
                backgroundColor: component.props?.backgroundColor || '#f9f9f9',
                borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : 0,
                border: component.props?.border || '1px solid #eee',
                position: 'relative',
                borderLeft: `3px solid ${componentColor}`
              }}
            >
              {component.children?.map((child: ComponentConfig, childIndex) => (
                <Box 
                  key={child.id} 
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData('nestedReorderComponent', JSON.stringify({
                      id: child.id,
                      parentId: component.id,
                      index: childIndex
                    }));
                    e.currentTarget.style.opacity = '0.5';
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const height = rect.height;
                    
                    // Clear previous styles
                    e.currentTarget.style.borderTop = '';
                    e.currentTarget.style.borderBottom = '';
                    e.currentTarget.style.backgroundColor = '';
                    
                    if (y < height * 0.5) {
                      e.currentTarget.style.borderTop = '2px dashed #6caba8';
                    } else {
                      e.currentTarget.style.borderBottom = '2px dashed #6caba8';
                    }
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderTop = '';
                    e.currentTarget.style.borderBottom = '';
                    e.currentTarget.style.backgroundColor = '';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Clear styles
                    e.currentTarget.style.borderTop = '';
                    e.currentTarget.style.borderBottom = '';
                    e.currentTarget.style.backgroundColor = '';
                    
                    try {
                      // Check if this is a new component being added
                      const newComponentData = e.dataTransfer.getData('component');
                      if (newComponentData) {
                        const componentData = JSON.parse(newComponentData);
                        const newComponent: ComponentConfig = {
                          id: `${componentData.id}-${Date.now()}`,
                          type: componentData.type,
                          props: { ...componentData.defaultProps },
                          children: componentData.type === 'Section' || componentData.type === 'Card' ? [] : undefined,
                        };
                        
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const height = rect.height;
                        
                        // Find the parent component to update
                        const updatedComponents = [...components];
                        const parentIndex = updatedComponents.findIndex(c => c.id === component.id);
                        
                        if (parentIndex !== -1) {
                          // Create a copy of the parent with modified children
                          const updatedParent = { ...updatedComponents[parentIndex] };
                          const updatedChildren = [...(updatedParent.children || [])];
                          
                          if (y < height * 0.5) {
                            // Add before this child
                            updatedChildren.splice(childIndex, 0, newComponent);
                          } else {
                            // Add after this child
                            updatedChildren.splice(childIndex + 1, 0, newComponent);
                          }
                          
                          updatedParent.children = updatedChildren;
                          updatedComponents[parentIndex] = updatedParent;
                          
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
                        return;
                      }
                      
                      // Check if this is a nested component being reordered
                      const nestedReorderData = e.dataTransfer.getData('nestedReorderComponent');
                      if (nestedReorderData) {
                        const { id, parentId, index: draggedIndex } = JSON.parse(nestedReorderData);
                        if (draggedIndex === childIndex && parentId === component.id) return; // No change if dropping on itself
                        
                        // Find the parent component to update
                        const updatedComponents = [...components];
                        const parentIndex = updatedComponents.findIndex(c => c.id === component.id);
                        
                        if (parentIndex !== -1) {
                          // Create a copy of the parent
                          const updatedParent = { ...updatedComponents[parentIndex] };
                          const updatedChildren = [...(updatedParent.children || [])];
                          
                          // If from the same parent, rearrange the children
                          if (parentId === component.id) {
                            const draggedChild = updatedChildren[draggedIndex];
                            
                            // Remove from old position
                            updatedChildren.splice(draggedIndex, 1);
                            
                            const rect = e.currentTarget.getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            const height = rect.height;
                            
                            // Insert at new position
                            if (y < height * 0.5) {
                              // Insert before this component
                              const insertPosition = draggedIndex < childIndex ? childIndex - 1 : childIndex;
                              updatedChildren.splice(insertPosition, 0, draggedChild);
                            } else {
                              // Insert after this component
                              const insertPosition = draggedIndex < childIndex ? childIndex : childIndex + 1;
                              updatedChildren.splice(insertPosition, 0, draggedChild);
                            }
                            
                            updatedParent.children = updatedChildren;
                            updatedComponents[parentIndex] = updatedParent;
                            
                            dispatch({ 
                              type: 'REORDER_COMPONENTS', 
                              payload: updatedComponents
                            });
                            
                            setSnackbarMessage(`Reordered component inside ${component.type}`);
                            setSnackbarOpen(true);
                          }
                        }
                      }
                    } catch (err) {
                      console.error('Error handling nested drop:', err);
                    }
                  }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleComponentSelect(child);
                  }}
                  sx={{ 
                    position: 'relative',
                    mb: childIndex < (component.children?.length || 0) - 1 ? 2 : 0,
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
                    ...(selectedComponent?.id === child.id && {
                      outline: '2px solid #6caba8',
                      boxShadow: '0 0 8px rgba(108, 171, 168, 0.3)'
                    })
                  }}
                >
                  {renderComponent(child)}
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
                    <Tooltip title={`Delete ${child.type}`}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteComponent(child.id);
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
                </Box>
              ))}
              {(!component.children || component.children.length === 0) && (
                <Box sx={{ 
                  padding: 2, 
                  textAlign: 'center', 
                  color: 'text.secondary',
                  border: '1px dashed #ccc',
                  borderRadius: 1,
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(2px)'
                }}>
                  <Typography variant="caption">
                    Drop components here
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );
        
      case 'Typography':
        return (
          <Box {...commonProps}>
            <Typography 
              variant={component.props?.variant || 'body1'}
              align={component.props?.align || 'left'}
              sx={{ 
                color: component.props?.color || '#153447',
                fontSize: component.props?.fontSize ? `${component.props.fontSize}px` : 'inherit',
                fontWeight: component.props?.fontWeight || 'normal',
                padding: component.props?.padding || 0,
                margin: component.props?.margin || 0,
                backgroundColor: component.props?.backgroundColor || 'transparent',
                borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : 0,
                border: component.props?.border || 'none',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: -6,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  backgroundColor: componentColor,
                  opacity: isSelected ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  borderRadius: '2px'
                }
              }}
            >
              {component.props?.children || 'Text Content'}
            </Typography>
          </Box>
        );
      
      case 'Image':
        return (
          <Box {...commonProps} sx={{ position: 'relative' }}>
            {isSelected && (
              <Box sx={{ 
                position: 'absolute', 
                top: -2, 
                left: -2, 
                right: -2, 
                bottom: -2, 
                border: `2px solid ${componentColor}`, 
                borderRadius: '4px',
                pointerEvents: 'none',
                zIndex: 1
              }} />
            )}
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
          </Box>
        );
      
      case 'Card':
        return (
          <Box {...commonProps}>
            <Card 
              sx={{ 
                maxWidth: component.props?.maxWidth || 345,
                backgroundColor: component.props?.backgroundColor || '#fff',
                borderRadius: `${component.props?.borderRadius || 4}px`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                borderTop: `3px solid ${componentColor}`,
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
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: componentColor }} />
                  Card
                </Typography>
                {component.children?.map((child: ComponentConfig, childIndex) => (
                  <Box 
                    key={child.id} 
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData('nestedReorderComponent', JSON.stringify({
                        id: child.id,
                        parentId: component.id,
                        index: childIndex
                      }));
                      e.currentTarget.style.opacity = '0.5';
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const height = rect.height;
                      
                      // Clear previous styles
                      e.currentTarget.style.borderTop = '';
                      e.currentTarget.style.borderBottom = '';
                      e.currentTarget.style.backgroundColor = '';
                      
                      if (y < height * 0.5) {
                        e.currentTarget.style.borderTop = '2px dashed #6caba8';
                      } else {
                        e.currentTarget.style.borderBottom = '2px dashed #6caba8';
                      }
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderTop = '';
                      e.currentTarget.style.borderBottom = '';
                      e.currentTarget.style.backgroundColor = '';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Clear styles
                      e.currentTarget.style.borderTop = '';
                      e.currentTarget.style.borderBottom = '';
                      e.currentTarget.style.backgroundColor = '';
                      
                      try {
                        // Check if this is a new component being added
                        const newComponentData = e.dataTransfer.getData('component');
                        if (newComponentData) {
                          const componentData = JSON.parse(newComponentData);
                          const newComponent: ComponentConfig = {
                            id: `${componentData.id}-${Date.now()}`,
                            type: componentData.type,
                            props: { ...componentData.defaultProps },
                            children: componentData.type === 'Section' || componentData.type === 'Card' ? [] : undefined,
                          };
                          
                          const rect = e.currentTarget.getBoundingClientRect();
                          const y = e.clientY - rect.top;
                          const height = rect.height;
                          
                          // Find the parent component to update
                          const updatedComponents = [...components];
                          const parentIndex = updatedComponents.findIndex(c => c.id === component.id);
                          
                          if (parentIndex !== -1) {
                            // Create a copy of the parent with modified children
                            const updatedParent = { ...updatedComponents[parentIndex] };
                            const updatedChildren = [...(updatedParent.children || [])];
                            
                            if (y < height * 0.5) {
                              // Add before this child
                              updatedChildren.splice(childIndex, 0, newComponent);
                            } else {
                              // Add after this child
                              updatedChildren.splice(childIndex + 1, 0, newComponent);
                            }
                            
                            updatedParent.children = updatedChildren;
                            updatedComponents[parentIndex] = updatedParent;
                            
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
                          return;
                        }
                        
                        // Check if this is a nested component being reordered
                        const nestedReorderData = e.dataTransfer.getData('nestedReorderComponent');
                        if (nestedReorderData) {
                          const { id, parentId, index: draggedIndex } = JSON.parse(nestedReorderData);
                          if (draggedIndex === childIndex && parentId === component.id) return; // No change if dropping on itself
                          
                          // Find the parent component to update
                          const updatedComponents = [...components];
                          const parentIndex = updatedComponents.findIndex(c => c.id === component.id);
                          
                          if (parentIndex !== -1) {
                            // Create a copy of the parent
                            const updatedParent = { ...updatedComponents[parentIndex] };
                            const updatedChildren = [...(updatedParent.children || [])];
                            
                            // If from the same parent, rearrange the children
                            if (parentId === component.id) {
                              const draggedChild = updatedChildren[draggedIndex];
                              
                              // Remove from old position
                              updatedChildren.splice(draggedIndex, 1);
                              
                              const rect = e.currentTarget.getBoundingClientRect();
                              const y = e.clientY - rect.top;
                              const height = rect.height;
                              
                              // Insert at new position
                              if (y < height * 0.5) {
                                // Insert before this component
                                const insertPosition = draggedIndex < childIndex ? childIndex - 1 : childIndex;
                                updatedChildren.splice(insertPosition, 0, draggedChild);
                              } else {
                                // Insert after this component
                                const insertPosition = draggedIndex < childIndex ? childIndex : childIndex + 1;
                                updatedChildren.splice(insertPosition, 0, draggedChild);
                              }
                              
                              updatedParent.children = updatedChildren;
                              updatedComponents[parentIndex] = updatedParent;
                              
                              dispatch({ 
                                type: 'REORDER_COMPONENTS', 
                                payload: updatedComponents
                              });
                              
                              setSnackbarMessage(`Reordered component inside ${component.type}`);
                              setSnackbarOpen(true);
                            }
                          }
                        }
                      } catch (err) {
                        console.error('Error handling nested drop:', err);
                      }
                    }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleComponentSelect(child);
                    }}
                    sx={{ 
                      position: 'relative',
                      mb: childIndex < (component.children?.length || 0) - 1 ? 2 : 0,
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
                      ...(selectedComponent?.id === child.id && {
                        outline: '2px solid #6caba8',
                        boxShadow: '0 0 8px rgba(108, 171, 168, 0.3)'
                      })
                    }}
                  >
                    {renderComponent(child)}
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
                      <Tooltip title={`Delete ${child.type}`}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComponent(child.id);
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
                  </Box>
                ))}
                {(!component.children || component.children.length === 0) && (
                  <Box sx={{ 
                    padding: 2, 
                    textAlign: 'center', 
                    color: 'text.secondary',
                    border: '1px dashed #ccc',
                    borderRadius: 1,
                    mt: 1,
                    backgroundColor: 'rgba(245, 245, 245, 0.5)'
                  }}>
                    <Typography variant="caption">
                      Drop components here
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );
      
      case 'Button':
        return (
          <Box {...commonProps}>
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
          </Box>
        );
      
      default:
        return null;
    }
  };

  const generateCode = async () => {
    // Create a new ZIP file
    const zip = new JSZip();
    
    // Create simplified code representation
    // This uses a simplified approach since we can't access the private method
    const componentCode = JSON.stringify(components, null, 2);
    zip.file('component-data.json', componentCode);
    
    // Generate project files with a placeholder
    // In a real implementation, we would need to make the method public or provide a public wrapper
    
    // Add a README file
    zip.file('README.md', `# Generated Low-Code Project\n\nThis project was generated from the Low-Code Playground.\n\nComponent structure:\n\`\`\`json\n${componentCode}\n\`\`\``);
    
    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'generated-app.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    // Show a success message
    setSnackbarMessage('Project exported successfully');
    setSnackbarOpen(true);
  };

  // Helper to export component tree as JSON
  const exportComponentTree = () => {
    const jsonString = JSON.stringify(components, null, 2);
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

  // Helper function to find a component by ID in the nested structure
  const findComponentById = (components: ComponentConfig[], id: string): ComponentConfig | null => {
    for (const comp of components) {
      if (comp.id === id) return comp;
      if (comp.children && comp.children.length > 0) {
        const found = findComponentById(comp.children, id);
        if (found) return found;
      }
    }
    return null;
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
            <Button
              variant="outlined"
              onClick={exportComponentTree}
              sx={{ mr: 1, color: '#fff', borderColor: 'rgba(255, 255, 255, 0.5)' }}
            >
              Export JSON
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={generateCode}
              sx={{ backgroundColor: '#e66e73', '&:hover': { backgroundColor: '#d25a5e' } }}
            >
              Generate Project
            </Button>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%', backgroundColor: '#f0f3f5' }}>
          {/* Components Panel - 20% Width */}
          <Paper 
            sx={{ 
              width: '20%',
              minWidth: '200px',
              flexShrink: 0,
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fff'
            }}
          >
            <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', backgroundColor: '#153447', color: '#fff' }}>
              Components
            </Typography>
            <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {availableComponents.map((component, index) => (
                  <Card
                    key={component.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('component', JSON.stringify({
                        type: component.type,
                        id: component.id,
                        defaultProps: component.defaultProps
                      }));
                      document.body.style.cursor = 'grabbing';
                    }}
                    onDragEnd={() => {
                      document.body.style.cursor = 'default';
                    }}
                    onClick={() => dispatch({ type: 'SELECT_AVAILABLE_COMPONENT', payload: component.id })}
                    sx={{ 
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      },
                      ...(selectedAvailableComponent === component.id && {
                        backgroundColor: 'rgba(21, 52, 71, 0.08)',
                        border: '2px solid #153447',
                      })
                    }}
                  >
                    <CardContent sx={{ py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {component.type === 'Section' && <Box sx={{ width: 16, height: 16, bgcolor: '#6caba8', borderRadius: '50%' }} />}
                      {component.type === 'Typography' && <Box sx={{ width: 16, height: 16, bgcolor: '#e66e73', borderRadius: '50%' }} />}
                      {component.type === 'Button' && <Box sx={{ width: 16, height: 16, bgcolor: '#6d597a', borderRadius: '50%' }} />}
                      {component.type === 'Card' && <Box sx={{ width: 16, height: 16, bgcolor: '#b7bf96', borderRadius: '50%' }} />}
                      {component.type === 'Image' && <Box sx={{ width: 16, height: 16, bgcolor: '#e6a456', borderRadius: '50%' }} />}
                      <Box>
                        <Typography fontWeight="medium">{component.type}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Drag to add
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Paper>

          {/* Playground Area - 60% Width */}
          <Paper 
            sx={{ 
              width: '60%',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: '#f0f3f5',
              minWidth: 0
            }}
          >
            <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', backgroundColor: '#153447', color: '#fff' }}>
              Playground - Drag & Drop Components Here
            </Typography>
            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              <Box
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  if (components.length === 0 || y < rect.height * 0.2) {
                    e.currentTarget.style.borderTop = '2px dashed #6caba8';
                    e.currentTarget.style.borderBottom = '';
                  } else {
                    e.currentTarget.style.borderBottom = '2px dashed #6caba8';
                    e.currentTarget.style.borderTop = '';
                  }
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderTop = '';
                  e.currentTarget.style.borderBottom = '';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.style.borderTop = '';
                  e.currentTarget.style.borderBottom = '';
                  
                  try {
                    const data = e.dataTransfer.getData('component');
                    if (data) {
                      const componentData = JSON.parse(data);
                      const newComponent: ComponentConfig = {
                        id: `${componentData.id}-${Date.now()}`,
                        type: componentData.type,
                        props: { ...componentData.defaultProps },
                        children: componentData.type === 'Section' || componentData.type === 'Card' ? [] : undefined,
                      };
                      
                      // Add to beginning or end based on drop position
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      
                      if (components.length === 0 || y < rect.height * 0.5) {
                        // Add to beginning
                        dispatch({ 
                          type: 'REORDER_COMPONENTS', 
                          payload: [newComponent, ...components] 
                        });
                      } else {
                        // Add to end
                        dispatch({ 
                          type: 'REORDER_COMPONENTS', 
                          payload: [...components, newComponent] 
                        });
                      }
                      
                      // Select the new component
                      setTimeout(() => {
                        dispatch({ type: 'SELECT_COMPONENT', payload: newComponent });
                      }, 100);
                      
                      setSnackbarMessage(`Added ${componentData.type} component`);
                      setSnackbarOpen(true);
                    }
                  } catch (err) {
                    console.error('Error adding component:', err);
                  }
                }}
                sx={{
                  minHeight: '100%',
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  p: 2,
                  backgroundColor: '#fff',
                  backgroundImage: components.length === 0 ? 'radial-gradient(#6caba8 8px, transparent 8px), radial-gradient(#e66e73 8px, transparent 8px), radial-gradient(#6d597a 8px, transparent 8px), radial-gradient(#b7bf96 8px, transparent 8px), radial-gradient(#e6a456 8px, transparent 8px)' : 'none',
                  backgroundSize: components.length === 0 ? '100px 100px' : '0',
                  backgroundPosition: components.length === 0 ? '0 0, 30px 30px, 60px 15px, 15px 45px, 45px 70px' : '0 0',
                  backgroundRepeat: 'repeat',
                  backgroundBlendMode: 'screen',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                {components.length === 0 && (
                  <Box 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center',
                      color: '#153447',
                      padding: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      borderRadius: 2,
                      backdropFilter: 'blur(5px)'
                    }}
                  >
                    <Typography variant="h6" align="center" fontWeight="bold" sx={{ color: '#153447' }}>
                      Start Building
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                      Drag components from the left panel and drop them here
                    </Typography>
                    <Typography variant="body2" align="center" sx={{ mt: 1, color: 'text.secondary' }}>
                      You can drop components before, after, or inside other components
                    </Typography>
                  </Box>
                )}
                
                {components.map((component, index) => (
                  <Box
                    key={component.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData('reorderComponent', JSON.stringify({
                        id: component.id,
                        index: index
                      }));
                      e.currentTarget.style.opacity = '0.5';
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComponentSelect(component);
                      console.log('Selected component:', component);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const height = rect.height;
                      
                      // Clear previous styles
                      e.currentTarget.style.borderTop = '';
                      e.currentTarget.style.borderBottom = '';
                      e.currentTarget.style.backgroundColor = '';
                      
                      if (y < height * 0.3) {
                        e.currentTarget.style.borderTop = '2px dashed #6caba8';
                      } else if (y > height * 0.7) {
                        e.currentTarget.style.borderBottom = '2px dashed #6caba8';
                      } else if (component.type === 'Section' || component.type === 'Card') {
                        e.currentTarget.style.backgroundColor = 'rgba(108, 171, 168, 0.1)';
                      }
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderTop = '';
                      e.currentTarget.style.borderBottom = '';
                      e.currentTarget.style.backgroundColor = '';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Clear styles
                      e.currentTarget.style.borderTop = '';
                      e.currentTarget.style.borderBottom = '';
                      e.currentTarget.style.backgroundColor = '';
                      
                      try {
                        // Check if this is a new component being added
                        const newComponentData = e.dataTransfer.getData('component');
                        if (newComponentData) {
                          const componentData = JSON.parse(newComponentData);
                          const newComponent: ComponentConfig = {
                            id: `${componentData.id}-${Date.now()}`,
                            type: componentData.type,
                            props: { ...componentData.defaultProps },
                            children: componentData.type === 'Section' || componentData.type === 'Card' ? [] : undefined,
                          };
                          
                          const rect = e.currentTarget.getBoundingClientRect();
                          const y = e.clientY - rect.top;
                          const height = rect.height;
                          
                          // Determine where to add the component
                          if (y < height * 0.3) {
                            // Add before this component
                            const newComponents = [...components];
                            newComponents.splice(index, 0, newComponent);
                            dispatch({ 
                              type: 'REORDER_COMPONENTS', 
                              payload: newComponents
                            });
                            setSnackbarMessage(`Added ${componentData.type} before ${component.type}`);
                          } else if (y > height * 0.7) {
                            // Add after this component
                            const newComponents = [...components];
                            newComponents.splice(index + 1, 0, newComponent);
                            dispatch({ 
                              type: 'REORDER_COMPONENTS', 
                              payload: newComponents
                            });
                            setSnackbarMessage(`Added ${componentData.type} after ${component.type}`);
                          } else if (component.type === 'Section' || component.type === 'Card') {
                            // Add inside this component
                            const updatedComponent = {
                              ...component,
                              children: [...(component.children || []), newComponent]
                            };
                            
                            const newComponents = [...components];
                            newComponents[index] = updatedComponent;
                            
                            dispatch({ 
                              type: 'REORDER_COMPONENTS', 
                              payload: newComponents
                            });
                            setSnackbarMessage(`Added ${componentData.type} inside ${component.type}`);
                          }
                          
                          // Select the new component
                          setTimeout(() => {
                            dispatch({ type: 'SELECT_COMPONENT', payload: newComponent });
                          }, 100);
                          
                          setSnackbarOpen(true);
                          return;
                        }
                        
                        // Check if this is a component being reordered
                        const reorderData = e.dataTransfer.getData('reorderComponent');
                        if (reorderData) {
                          const { id, index: draggedIndex } = JSON.parse(reorderData);
                          if (draggedIndex === index) return; // No change if dropping on itself
                          
                          const draggedComponent = components[draggedIndex];
                          const newComponents = [...components];
                          
                          // Remove the dragged component
                          newComponents.splice(draggedIndex, 1);
                          
                          const rect = e.currentTarget.getBoundingClientRect();
                          const y = e.clientY - rect.top;
                          const height = rect.height;
                          
                          if (y < height * 0.3) {
                            // Insert before this component
                            const targetIndex = draggedIndex < index ? index - 1 : index;
                            newComponents.splice(targetIndex, 0, draggedComponent);
                            setSnackbarMessage(`Moved ${draggedComponent.type} before ${component.type}`);
                          } else if (y > height * 0.7) {
                            // Insert after this component
                            const targetIndex = draggedIndex < index ? index : index + 1;
                            newComponents.splice(targetIndex, 0, draggedComponent);
                            setSnackbarMessage(`Moved ${draggedComponent.type} after ${component.type}`);
                          } else if (component.type === 'Section' || component.type === 'Card') {
                            // Move into this component
                            const updatedComponent = {
                              ...component,
                              children: [...(component.children || []), draggedComponent]
                            };
                            
                            // Remove the dragged component and update the target
                            newComponents[index] = updatedComponent;
                            setSnackbarMessage(`Moved ${draggedComponent.type} inside ${component.type}`);
                          } else {
                            // Default to after if not a container
                            const targetIndex = draggedIndex < index ? index : index + 1;
                            newComponents.splice(targetIndex, 0, draggedComponent);
                          }
                          
                          dispatch({ 
                            type: 'REORDER_COMPONENTS', 
                            payload: newComponents
                          });
                          setSnackbarOpen(true);
                        }
                      } catch (err) {
                        console.error('Error handling drop:', err);
                      }
                    }}
                    sx={{ 
                      mb: 2,
                      position: 'relative',
                      borderRadius: 1,
                      overflow: 'visible',
                      '&:hover': {
                        outline: '2px solid #6caba8',
                        '& .delete-btn': {
                          opacity: 1,
                          transform: 'translateX(0)',
                        },
                        '& .drag-handle': {
                          opacity: 1,
                          transform: 'translateX(0)',
                        }
                      },
                      ...(selectedComponent?.id === component.id && {
                        outline: '2px solid #6caba8',
                        boxShadow: '0 0 12px rgba(108, 171, 168, 0.3)'
                      })
                    }}
                  >
                    {renderComponent(component)}
                    <Box 
                      className="delete-btn"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        zIndex: 10,
                        opacity: 0.1,
                        transform: 'translateX(10px)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
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
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            '&:hover': {
                              backgroundColor: '#d25a5e',
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box 
                      className="drag-handle"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        left: -10,
                        zIndex: 10,
                        opacity: 0.1,
                        transform: 'translateX(-10px)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <Tooltip title={`Drag to reorder`}>
                        <IconButton
                          size="small"
                          sx={{
                            backgroundColor: '#6caba8',
                            color: 'white',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            cursor: 'grab',
                            '&:hover': {
                              backgroundColor: '#5a9996',
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                          </svg>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>

          {/* Properties Panel - 20% Width */}
          <Paper 
            sx={{ 
              width: '20%',
              minWidth: '200px',
              flexShrink: 0,
              borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fff'
            }}
          >
            <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)', backgroundColor: '#153447', color: '#fff' }}>
              Properties
            </Typography>
            <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
              {selectedComponent ? (
                <Box>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      backgroundColor: 'rgba(108, 171, 168, 0.1)',
                      p: 1,
                      borderRadius: 1,
                      mb: 2,
                      borderLeft: '4px solid #6caba8'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1, color: '#153447' }}>
                      {selectedComponent.type} Properties
                    </Typography>
                    <Tooltip title="Component ID">
                      <Typography variant="caption" color="text.secondary">
                        {selectedComponent.id}
                      </Typography>
                    </Tooltip>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {Object.entries(selectedComponent.props || {}).map(([key, value]) => {
                    if (key === 'children' && typeof value !== 'string') return null;
                    
                    const componentConfig = getComponentConfig(selectedComponent.type);
                    const propConfig = componentConfig?.configurableProps[key];
                    
                    if (propConfig) {
                      return (
                        <Box key={key} sx={{ mt: 1, mb: 2 }}>
                          {renderPropertyField(key, propConfig, value, (newValue) => {
                            dispatch({
                              type: 'UPDATE_COMPONENT',
                              payload: {
                                id: selectedComponent.id,
                                props: { [key]: newValue },
                              },
                            });
                          })}
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Box>
              ) : selectedAvailableComponent ? (
                <Box>
                  <Box 
                    sx={{ 
                      backgroundColor: 'rgba(108, 171, 168, 0.1)',
                      p: 1,
                      borderRadius: 1,
                      mb: 2,
                      borderLeft: '4px solid #6caba8'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#153447' }}>
                      Component Preview
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Properties will be editable after adding to playground
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {Object.entries(
                    availableComponents.find(c => c.id === selectedAvailableComponent)?.configurableProps || {}
                  ).map(([key, prop]) => (
                    <Box key={key} sx={{ mt: 1, mb: 2 }}>
                      {renderPropertyField(key, prop, prop.default, () => {})}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'text.secondary',
                    p: 2
                  }}
                >
                  <Typography align="center">
                    Select a component to edit its properties
                  </Typography>
                  <Typography variant="caption" align="center" sx={{ mt: 1 }}>
                    Changes made here will be reflected in real-time
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
      
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