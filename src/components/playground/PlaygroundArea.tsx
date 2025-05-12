import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Alert,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CodeIcon from '@mui/icons-material/Code';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { usePlayground } from '../../context/PlaygroundContext';
// Fixed import for ComponentRenderer
import { ComponentRenderer } from './ComponentRenderer';
import type { ComponentConfig, DropPosition } from '../../types/playground';
import { v4 as uuidv4 } from 'uuid';
import { availableComponents } from '../../config/components';

export default function PlaygroundArea() {
  const { state, dispatch } = usePlayground();
  const { components, selectedComponent, dropTarget, previewMode } = state;
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [dragOverEmptyArea, setDragOverEmptyArea] = useState(false);
  const [activeTab, setActiveTab] = useState<'structure' | 'preview'>('structure');
  const [componentsMenuAnchor, setComponentsMenuAnchor] = useState<null | HTMLElement>(null);
  
  useEffect(() => {
    // When toggling preview mode, also update the tab
    setActiveTab(previewMode ? 'preview' : 'structure');
  }, [previewMode]);

  // Toggle preview mode
  const handleTogglePreview = () => {
    dispatch({ type: 'TOGGLE_PREVIEW_MODE', payload: !previewMode });
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'structure' | 'preview') => {
    setActiveTab(newValue);
    dispatch({ type: 'TOGGLE_PREVIEW_MODE', payload: newValue === 'preview' });
  };

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
      case 'MapComponent': return '#8e44ad';
      default: return '#6caba8';
    }
  };

  // Helper function to find a component by ID
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

  // Helper function to handle component selection
  const handleComponentSelect = (component: ComponentConfig) => {
    console.log('Selecting component:', component.type, component.id);
    
    // Get the latest version of the component with all current properties
    const freshComponent = findComponentById(components, component.id);
    
    if (freshComponent) {
      console.log('Found fresh component:', freshComponent);
      // Only update if we found a valid component
      dispatch({ 
        type: 'SELECT_COMPONENT', 
        payload: {
          ...freshComponent,
          // Ensure we have the latest props
          props: {
            ...freshComponent.props
          }
        }
      });
      
      // Scroll to the properties panel to make it more obvious that properties are available
      const propertiesPanel = document.getElementById('properties-panel');
      if (propertiesPanel) {
        propertiesPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      console.warn('Component not found in component tree:', component.id);
    }
  };

  // Helper function to handle component deletion
  const handleDeleteComponent = (id: string) => {
    // If deleting the selected component, clear selection
    if (selectedComponent?.id === id) {
      dispatch({ type: 'SELECT_COMPONENT', payload: null });
    }
    
    // Delete the component
    dispatch({ type: 'DELETE_COMPONENT', payload: id });
  };

  // Add or update handleDragOver for better visual feedback
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, componentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get the component's dimensions
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const threshold = 0.25; // 25% threshold for top/bottom zones
    
    // Determine drop position based on cursor location
    let position: DropPosition;
    if (y < height * threshold) {
      position = 'before';
    } else if (y > height * (1 - threshold)) {
      position = 'after';
    } else {
      // Allow all components to have children
      position = 'inside';
    }
    
    // Set the current drop target
    dispatch({ 
      type: 'SET_DROP_TARGET', 
      payload: { id: componentId, position } 
    });
    
    // Highlight the component being dragged over
    setHoveredComponent(componentId);
    setDragOverEmptyArea(false);
    
    // Set visual indicator for drag operation
    e.dataTransfer.dropEffect = 'move';
  };

  // Clear drop target on drag leave
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear if we're truly leaving the element (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      dispatch({ type: 'SET_DROP_TARGET', payload: null });
      setHoveredComponent(null);
    }
  };

  // Handle dragging start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setData('componentId', id);
    // Add effect to indicate we're moving, not copying or deleting
    e.dataTransfer.effectAllowed = 'move';
    document.body.style.cursor = 'grabbing';
  };

  // Render a drop indicator based on the position
  const renderDropIndicator = (position: DropPosition) => {
    const styles = {
      before: {
        position: 'absolute',
        top: -4,
        left: 0,
        right: 0,
        height: '6px',
        backgroundColor: '#2196f3',
        zIndex: 10,
        borderRadius: '2px',
        boxShadow: '0 0 6px rgba(33, 150, 243, 0.6)',
        animation: 'pulse 1.5s infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&::before': {
          content: '"Insert Before"',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: -20,
          backgroundColor: 'rgba(33, 150, 243, 0.9)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
        }
      },
      after: {
        position: 'absolute',
        bottom: -4,
        left: 0,
        right: 0,
        height: '6px',
        backgroundColor: '#4caf50',
        zIndex: 10,
        borderRadius: '2px',
        boxShadow: '0 0 6px rgba(76, 175, 80, 0.6)',
        animation: 'pulse 1.5s infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&::before': {
          content: '"Insert After"',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: -20,
          backgroundColor: 'rgba(76, 175, 80, 0.9)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
        }
      },
      inside: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        border: '3px dashed #ff9800',
        zIndex: 5,
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&::before': {
          content: '"Insert Inside"',
          backgroundColor: 'rgba(255, 152, 0, 0.9)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
        }
      }
    };

    return (
      <Box 
        sx={{
          ...styles[position],
          pointerEvents: 'none', // Ensure the indicator doesn't interfere with drag events
        }}
      />
    );
  };
  
  // Update handleDrop to improve reliability 
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetComponentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Component drop detected on target:', targetComponentId);
    
    if (!dropTarget) {
      console.log('No drop target set, ignoring drop');
      return;
    }
    
    // Get the dragged component ID
    const draggedComponentId = e.dataTransfer.getData('componentId');
    const newComponentData = e.dataTransfer.getData('component');
    
    console.log('Drop data:', { draggedComponentId, newComponentData });
    
    try {
      // Handle dropping a new component from available components
      if (newComponentData) {
        const componentData = JSON.parse(newComponentData);
        console.log('Parsed component data for drop:', componentData);
        
        // Create new component with unique ID
        const newComponent: ComponentConfig = {
          id: `${componentData.id}-${Date.now()}`,
          type: componentData.type,
          props: { ...componentData.defaultProps },
          children: [], // All components can have children
        };
        
        console.log('Adding new component:', newComponent);
        
        // First add the new component
        dispatch({ type: 'ADD_COMPONENT', payload: newComponent });
        
        // Then move it to the right position
        setTimeout(() => {
          console.log('Moving to correct position:', {
            sourceId: newComponent.id,
            targetId: targetComponentId,
            position: dropTarget.position,
          });
          
          dispatch({
            type: 'MOVE_COMPONENT',
            payload: {
              sourceId: newComponent.id,
              targetId: targetComponentId,
              position: dropTarget.position,
            },
          });
          
          // Select the new component with a slight delay
          setTimeout(() => {
            dispatch({ 
              type: 'SELECT_COMPONENT', 
              payload: findComponentById(state.components, newComponent.id) 
            });
          }, 50);
        }, 10);
      }
      // Handle reordering existing components
      else if (draggedComponentId) {
        // Safety check - don't allow dropping on itself or its descendants
        const targetComponent = findComponentById(components, targetComponentId);
        if (!targetComponent) return;
        
        const isDescendant = (parent: ComponentConfig, childId: string): boolean => {
          if (parent.id === childId) return true;
          if (parent.children && parent.children.length > 0) {
            return parent.children.some(child => isDescendant(child, childId));
          }
          return false;
        };
        
        // If dragging onto itself or descendant, do nothing
        const sourceComponent = findComponentById(components, draggedComponentId);
        if (!sourceComponent || draggedComponentId === targetComponentId || 
            isDescendant(sourceComponent, targetComponentId)) {
          console.log('Cannot drop on itself or a descendant');
          return;
        }
        
        console.log('Moving existing component:', {
          sourceId: draggedComponentId,
          targetId: targetComponentId,
          position: dropTarget.position
        });
        
        // Move component - never delete it
        dispatch({
          type: 'MOVE_COMPONENT',
          payload: {
            sourceId: draggedComponentId,
            targetId: targetComponentId,
            position: dropTarget.position
          }
        });
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
    
    // Reset state
    dispatch({ type: 'SET_DROP_TARGET', payload: null });
    setHoveredComponent(null);
    document.body.style.cursor = 'default';
  };
  
  // Handle drop on empty playground area
  const handleEmptyAreaDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newComponentData = e.dataTransfer.getData('component');
    const draggedComponentId = e.dataTransfer.getData('componentId');
    setDragOverEmptyArea(false);
    
    console.log('Empty area drop detected');
    console.log('newComponentData:', newComponentData);
    console.log('draggedComponentId:', draggedComponentId);
    
    try {
      // Handle new component from palette
      if (newComponentData) {
        const componentData = JSON.parse(newComponentData);
        console.log('Parsed component data:', componentData);
        
        // Create new component
        const newComponent: ComponentConfig = {
          id: `${componentData.id}-${Date.now()}`,
          type: componentData.type,
          props: { ...componentData.defaultProps },
          children: [], // All components can have children
        };
        
        console.log('Adding new component to root:', newComponent);
        
        // Add component to the root level
        dispatch({ type: 'ADD_COMPONENT', payload: newComponent });
        
        // Select the new component
        setTimeout(() => {
          dispatch({ type: 'SELECT_COMPONENT', payload: newComponent });
        }, 50);
      }
      // Handle existing component reordering to root level
      else if (draggedComponentId) {
        const sourceComponent = findComponentById(components, draggedComponentId);
        if (!sourceComponent) return;
        
        console.log('Moving existing component to root:', sourceComponent);
        
        // Move to the end of the root level components
        dispatch({
          type: 'MOVE_COMPONENT',
          payload: {
            sourceId: draggedComponentId,
            targetId: components.length > 0 ? components[components.length - 1].id : '',
            position: 'after'
          }
        });
      }
    } catch (err) {
      console.error('Error handling drop on empty area:', err);
    }
  };
  
  // Handle drag over empty area
  const handleEmptyAreaDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverEmptyArea(true);
    
    // Clear any existing drop target
    dispatch({ type: 'SET_DROP_TARGET', payload: null });
    
    // Log that we're hovering over empty area
    console.log('Dragging over empty area');
  };
  
  // Handle drag leave from empty area
  const handleEmptyAreaDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only set to false if we're truly leaving the element
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverEmptyArea(false);
    }
  };

  // Render the preview of the components
  const renderPreview = () => {
    // Find components with API data that could be used
    const findComponentWithContextData = (comps: ComponentConfig[]): ComponentConfig | null => {
      for (const comp of comps) {
        if (comp.contextData) {
          console.log(`Found API data in component: ${comp.type} (${comp.id})`, comp.contextData);
          return comp;
        }
        if (comp.children?.length) {
          const childWithData = findComponentWithContextData(comp.children);
          if (childWithData) return childWithData;
        }
      }
      return null;
    };

    // Get API data from any component that has it
    const componentWithData = findComponentWithContextData(components);
    console.log("Found component with API data:", componentWithData?.id);

    // Function to recursively add contextData to all components
    const addDataToComponents = (comps: ComponentConfig[], data: any): ComponentConfig[] => {
      return comps.map(comp => {
        // Deep clone to avoid mutations
        const newComp = JSON.parse(JSON.stringify(comp));
        
        // Only add context data if it doesn't already have it
        if (!newComp.contextData && data) {
          newComp.contextData = data;
        }
        
        // Process children recursively
        if (newComp.children?.length) {
          newComp.children = addDataToComponents(newComp.children, data);
        }
        
        return newComp;
      });
    };

    // Create enhanced components with shared API data
    let enhancedComponents = components;
    if (componentWithData?.contextData) {
      enhancedComponents = addDataToComponents(components, componentWithData.contextData);
      console.log("Enhanced all components with API data");
    }
    
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          height: '100%', 
          overflow: 'auto', 
          p: 2,
          backgroundColor: '#ffffff',
          borderRadius: 1,
          border: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom align="center">
            Preview
          </Typography>
          
          {components.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              No components to preview. Add components to see a preview.
            </Alert>
          ) : (
            // This would render the actual components, not the editor view
            <Box sx={{ mt: 2 }}>
              {enhancedComponents.map(component => {                
                return (
                  <RenderPreviewComponent 
                    key={component.id} 
                    component={component} 
                  />
                );
              })}
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  // Improved function to render MapComponent with proper context passing
  const renderMapComponent = (component: ComponentConfig, parentContext?: any) => {
    // Use component's own context data or inherit from parent
    const contextData = component.contextData || parentContext;
    
    if (!contextData) {
      console.warn(`MapComponent ${component.id} has no context data available`);
      return (
        <Box sx={{ my: component.props.marginY || 2 }}>
          <Typography color="text.secondary">
            {component.props.emptyText || 'No data to display'}
          </Typography>
        </Box>
      );
    }
    
    // Get the data to map over using the dataPath
    const dataPath = component.props.dataPath || '';
    let dataToMap: any[] = [];
    
    console.log(`🔄 MapComponent processing path: "${dataPath}" with contextData:`, contextData);
    
    try {
      // Extract using the dataPath if provided
      if (dataPath === '') {
        // If no dataPath is specified but contextData is an array, use it directly
        if (Array.isArray(contextData)) {
          dataToMap = contextData;
          console.log(`🔄 MapComponent using direct array context data with ${contextData.length} items`);
        } else {
          // If contextData is an object but not an array, wrap it in an array
          dataToMap = [contextData];
          console.log(`🔄 MapComponent wrapping single object in array`);
        }
      } else if (dataPath) {
        // Standard path traversal
        const data = dataPath.split('.').reduce((obj: any, path: string) => 
          obj && typeof obj === 'object' ? obj[path] : null, contextData);
        
        if (Array.isArray(data)) {
          dataToMap = data;
          console.log(`🔄 MapComponent found array at path "${dataPath}" with ${data.length} items`);
        } else if (data && typeof data === 'object') {
          // If it's an object, wrap it in an array to process it
          dataToMap = [data];
          console.log(`🔄 MapComponent found object at path "${dataPath}", wrapping in array`);
        } else if (data) {
          // If it's a primitive value, still wrap it
          dataToMap = [data];
          console.log(`🔄 MapComponent found primitive at path "${dataPath}", wrapping in array`);
        }
      } else if (Array.isArray(contextData)) {
        dataToMap = contextData;
        console.log(`🔄 MapComponent using array context data with ${contextData.length} items`);
      } else if (contextData && typeof contextData === 'object') {
        // If root context is an object, use it as a single item
        dataToMap = [contextData];
        console.log(`🔄 MapComponent using object context data, wrapping in array`);
      }
    } catch (error) {
      console.error(`❌ Error processing data path "${dataPath}":`, error);
    }
    
    console.log(`🔄 Preview MapComponent with dataPath:`, dataPath);
    console.log(`🔄 Data to map:`, dataToMap);
    
    // If no data, show empty text
    if (!dataToMap || !dataToMap.length) {
      return (
        <Box sx={{ my: component.props.marginY || 2 }}>
          <Typography color="text.secondary">
            {component.props.emptyText || 'No items to display'}
          </Typography>
        </Box>
      );
    }
    
    // Apply any filter condition if specified
    let filteredData = dataToMap;
    if (component.props.condition) {
      try {
        // Create a safe filtering function
        const filterFn = new Function('item', `return ${component.props.condition}`);
        filteredData = dataToMap.filter(item => {
          try {
            return filterFn(item);
          } catch (e) {
            console.error('Error in filter condition:', e);
            return true; // Include by default if filter errors
          }
        });
        console.log(`🔄 Applied filter: ${filteredData.length} of ${dataToMap.length} items passed`);
      } catch (err) {
        console.error('Invalid filter condition:', component.props.condition);
      }
    }
    
    // Render children for each data item
    return (
      <Box sx={{ my: component.props.marginY || 2 }}>
        {/* Show iteration count */}
        <Box 
          sx={{ 
            bgcolor: 'rgba(142, 68, 173, 0.1)', 
            p: 1, 
            mb: 2, 
            borderRadius: 1,
            border: '1px dashed rgba(142, 68, 173, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>MapComponent</strong> iterating over {filteredData.length} items
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            dataPath: {component.props.dataPath || 'none'}
          </Typography>
        </Box>
        
        {filteredData.map((item, index) => (
          <Box 
            key={index} 
            sx={{ 
              mb: 2,
              position: 'relative',
            }}
          >
            {/* Item index indicator */}
            <Box 
              sx={{ 
                position: 'absolute',
                top: -10,
                left: 10,
                bgcolor: 'rgba(142, 68, 173, 0.8)',
                color: 'white',
                px: 1,
                py: 0.2,
                borderRadius: '4px',
                fontSize: '10px',
                zIndex: 10
              }}
            >
              Item {index + 1}
            </Box>
            
            {component.children?.map(child => {
              // Create a copy of the child with data from the current item
              const childWithContext = { 
                ...child,
                contextData: item,  // Each child gets the item as its context
                props: {
                  ...child.props,
                  // Add a note that this is from iteration for debugging
                  _fromIterationIndex: index
                }
              };
              
              // Log what we're rendering and with what context
              console.log(`🔄 MapComponent rendering child ${child.type}:${child.id} with iteration ${index} data:`, item);
              
              // Recursively render each child with its new context
              return (
                <RenderPreviewComponent 
                  key={`${child.id}-${index}`} 
                  component={childWithContext}
                />
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  // Component to render the actual preview
  const RenderPreviewComponent = ({ component }: { component: ComponentConfig }) => {
    // Access context data from the component or parent components
    const getContextData = () => {
      return component.contextData || null;
    };

    const contextData = getContextData();
    
    // Debug all context data - this will help us track where the data is
    console.log(`RenderPreviewComponent - ${component.type} (${component.id}) - has contextData:`, !!contextData);
    
    // Improved handling for MapComponent in preview
    if (component.type === 'MapComponent') {
      return renderMapComponent(component, contextData);
    }

    // Helper to render a component based on its type
    const renderComponent = () => {
      // Get context data specific to this component for preview
      const getComponentData = () => {
        // For direct data access (used by non-map components)
        if (contextData && component.props.contextPath) {
          try {
            // Handle array notation in path like "results[0].user"
            const processPath = (path: string, data: any) => {
              // For debugging
              console.log(`Processing path: ${path} for ${component.type}:${component.id}`);
              
              // Special case for randomuser.me pictures
              if (path.startsWith('picture.') && data.picture) {
                const picType = path.split('.')[1]; // Get 'large', 'medium', etc.
                console.log(`Found picture path with type: ${picType}`, data.picture);
                
                // Get the raw URL
                const imageUrl = data.picture[picType];
                
                if (imageUrl && imageUrl.includes('randomuser.me/api/portraits')) {
                  // Fix the URL by removing the /api part which causes CORS issues
                  return imageUrl.replace('/api/portraits/', '/portraits/');
                }
                
                return imageUrl;
              }
              
              // Check for array index notation
              if (path.includes('[') && path.includes(']')) {
                const arrayName = path.substring(0, path.indexOf('['));
                const indexStr = path.substring(path.indexOf('[') + 1, path.indexOf(']'));
                const remaining = path.substring(path.indexOf(']') + 1);
                const index = parseInt(indexStr, 10);
                
                // Get the array
                const array = arrayName ? data[arrayName] : data;
                
                // If we have a valid array and index
                if (Array.isArray(array) && !isNaN(index) && index < array.length) {
                  const item = array[index];
                  
                  // Process remaining path if any (starts with '.')
                  if (remaining.startsWith('.')) {
                    return processPath(remaining.substring(1), item);
                  }
                  return item;
                }
                return null;
              }
              
              // Standard dot notation
              return path.split('.').reduce(
                (obj, key) => obj && typeof obj === 'object' ? obj[key] : null, 
                data
              );
            };
            
            return processPath(component.props.contextPath, contextData);
          } catch (err) {
            console.error(`Error accessing path ${component.props.contextPath}:`, err);
            return null;
          }
        }
        return contextData;
      };
      
      // Get specific data for this component
      const componentData = getComponentData();
      console.log(`Component ${component.type} (${component.id}) rendering with data:`, componentData);
      
      // Helper to apply data to text content with variable substitution
      const applyDataToText = (text: string) => {
        if (!contextData || !text || !text.includes('${')) return text;
        
        try {
          // Replace ${var} expressions with actual data values
          return text.replace(/\${([^}]+)}/g, (match, path) => {
            try {
              const value = path.split('.').reduce(
                (obj: any, key: string) => obj && typeof obj === 'object' ? obj[key] : null, 
                contextData
              );
              return value !== null && value !== undefined ? String(value) : match;
            } catch (err) {
              console.error(`Error resolving path ${path}:`, err);
              return match;
            }
          });
        } catch (err) {
          console.error('Error applying data to text:', err);
          return text;
        }
      };
      
      // Helper to format data for display
      const formatContextData = (data: any): string => {
        if (data === null || data === undefined) {
          return '';
        }
        if (typeof data === 'string') {
          return data;
        }
        if (typeof data === 'number' || typeof data === 'boolean') {
          return String(data);
        }
        if (Array.isArray(data)) {
          return data.map(item => formatContextData(item)).join(', ');
        }
        if (typeof data === 'object') {
          return JSON.stringify(data);
        }
        return String(data);
      };
      
      switch (component.type) {
        case 'Section':
          return (
            <Box
              sx={{
                height: component.props.height || 'auto',
                width: component.props.width || '100%',
                maxWidth: component.props.maxWidth || '100%',
                bgcolor: component.props.backgroundColor || 'transparent',
                p: component.props.padding || 2,
                px: component.props.paddingX || undefined,
                py: component.props.paddingY || undefined,
                mx: component.props.marginX || 0,
                my: component.props.marginY || 0,
                borderRadius: component.props.borderRadius || 1,
                border: component.props.border || 'none',
              }}
            >
              {component.children?.map(child => (
                <RenderPreviewComponent key={child.id} component={{
                  ...child,
                  contextData: contextData // Pass context data to children
                }} />
              ))}
            </Box>
          );
          
        case 'Typography':
          // Enhanced text content rendering with context data
          const textContent = (() => {
            // If we have explicit component data from contextPath, use that
            if (componentData !== undefined && componentData !== null) {
              return formatContextData(componentData);
            }
            
            // If the text has variables, process them
            if (component.props.text && component.props.text.includes('${')) {
              return applyDataToText(component.props.text);
            }
            
            // Fallback to regular text
            return component.props.text || 'Text content';
          })();
          
          return (
            <Typography
              variant={component.props.variant || 'body1'}
              align={component.props.align || 'left'}
              sx={{
                color: component.props.color || 'inherit',
                width: component.props.width || 'auto',
                mx: component.props.marginX || 0,
                my: component.props.marginY || 1,
                px: component.props.paddingX || 0,
                py: component.props.paddingY || 0,
                fontSize: component.props.fontSize ? `${component.props.fontSize}px` : undefined,
                fontWeight: component.props.fontWeight || undefined,
                fontStyle: component.props.fontStyle || undefined,
                textDecoration: component.props.textDecoration || undefined,
                letterSpacing: component.props.letterSpacing || undefined,
                lineHeight: component.props.lineHeight || undefined,
                textTransform: component.props.textTransform || undefined,
              }}
              data-has-context={componentData !== undefined ? 'true' : 'false'}
            >
              {textContent}
            </Typography>
          );
          
        case 'Button':
          // Enhanced button text rendering with context data
          const buttonText = (() => {
            // If we have explicit component data from contextPath, use that
            if (componentData !== undefined && componentData !== null) {
              return formatContextData(componentData);
            }
            
            // If the text has variables, process them
            if (component.props.text && component.props.text.includes('${')) {
              return applyDataToText(component.props.text);
            }
            
            // Fallback to regular text
            return component.props.text || 'Button';
          })();
          
          return (
            <Button
              variant={component.props.variant || 'contained'}
              color={component.props.color as any || 'primary'}
              size={component.props.size as any || 'medium'}
              disabled={component.props.disabled === 'true' || component.props.disabled === true}
              sx={{
                width: component.props.width || 'auto',
                mx: component.props.marginX || 0,
                my: component.props.marginY || 1,
                px: component.props.paddingX || undefined,
                py: component.props.paddingY || undefined,
                borderRadius: component.props.borderRadius ? `${component.props.borderRadius}px` : undefined,
                backgroundColor: 
                  component.props.variant === 'contained' ?
                  (component.props.color === 'primary' ? '#6caba8' : 
                   component.props.color === 'secondary' ? '#6d597a' :
                   component.props.color === 'error' ? '#e66e73' :
                   component.props.color === 'warning' ? '#e6a456' :
                   component.props.color === 'success' ? '#b7bf96' : '#6caba8') : undefined,
              }}
              data-has-context={componentData !== undefined ? 'true' : 'false'}
            >
              {buttonText}
            </Button>
          );
          
        case 'Card':
          // Log card context data
          console.log(`Card ${component.id} contextData:`, contextData);
          console.log(`Card ${component.id} has ${component.children?.length || 0} children`);
          
          return (
            <Paper
              elevation={component.props.elevation || 1}
              sx={{
                width: component.props.width || '100%',
                maxWidth: component.props.maxWidth || '100%',
                mx: component.props.marginX || 0,
                my: component.props.marginY || 0,
                borderRadius: component.props.borderRadius || 1,
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: component.props.backgroundColor || '#ffffff',
              }}
            >
              {/* Debug indicator for context */}
              {contextData && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    color: 'success.main',
                    px: 1,
                    py: 0.5,
                    fontSize: '10px',
                    borderRadius: '0 0 0 4px',
                    zIndex: 1,
                  }}
                >
                  Using context data
                </Box>
              )}
              
              <Box sx={{ p: component.props.padding || 2 }}>
                {component.children?.map(child => (
                  <RenderPreviewComponent 
                    key={child.id} 
                    component={{
                      ...child,
                      // Explicitly pass context data to children to ensure propagation
                      contextData: contextData
                    }} 
                  />
                ))}
              </Box>
            </Paper>
          );
          
        case 'Image':
          // Get src from context data if available
          const imageSrc = (() => {
            // If component has context data and a contextPath, use that for src
            if (componentData !== undefined && componentData !== null) {
              if (typeof componentData === 'string') {
                console.log(`Using context data for image src: ${componentData}`);
                
                // Handle randomuser.me URLs specifically
                if (componentData.includes('randomuser.me/api/portraits')) {
                  // Fix the URL format - the API path is causing CORS issues
                  // Convert from: https://randomuser.me/api/portraits/med/men/36.jpg
                  // To: https://randomuser.me/portraits/med/men/36.jpg (removing /api)
                  const fixedUrl = componentData.replace('/api/portraits/', '/portraits/');
                  console.log(`Fixing randomuser.me URL: ${fixedUrl}`);
                  
                  // Use a CORS proxy for randomuser images
                  // The corsAnywhere URL would be replaced with a real CORS proxy in production
                  const corsProxy = 'https://corsproxy.io/?';
                  return `${corsProxy}${encodeURIComponent(fixedUrl)}`;
                }
                
                // For other URLs, just return as is
                return componentData;
              } else if (componentData && typeof componentData === 'object') {
                // For nested objects like user.picture containing large, medium, etc.
                let imageUrl = null;
                
                if (componentData.large) imageUrl = componentData.large;
                else if (componentData.medium) imageUrl = componentData.medium;
                else if (componentData.thumbnail) imageUrl = componentData.thumbnail;
                
                if (imageUrl) {
                  // Fix randomuser.me URLs
                  if (imageUrl.includes('randomuser.me/api/portraits')) {
                    const fixedUrl = imageUrl.replace('/api/portraits/', '/portraits/');
                    console.log(`Fixing randomuser.me URL from object: ${fixedUrl}`);
                    
                    // Use a CORS proxy
                    const corsProxy = 'https://corsproxy.io/?';
                    return `${corsProxy}${encodeURIComponent(fixedUrl)}`;
                  }
                  return imageUrl;
                }
                
                console.warn(`Context data for image is an object but doesn't contain expected image URLs:`, componentData);
              } else {
                console.warn(`Context data for image is not a string or object:`, componentData);
              }
            }
            
            // Otherwise use src from props, with CORS proxy if it's a randomuser URL
            const propsSrc = component.props.src || 'https://picsum.photos/200';
            if (propsSrc.includes('randomuser.me/api/portraits')) {
              const fixedUrl = propsSrc.replace('/api/portraits/', '/portraits/');
              const corsProxy = 'https://corsproxy.io/?';
              return `${corsProxy}${encodeURIComponent(fixedUrl)}`;
            }
            
            return propsSrc;
          })();
          
          return (
            <Box
              component="img"
              src={imageSrc}
              alt={component.props.alt || 'Image'}
              sx={{
                width: component.props.width || 200,
                height: component.props.height || 200,
                objectFit: component.props.objectFit || 'cover',
                borderRadius: component.props.borderRadius || 1,
                mx: component.props.marginX || 0,
                my: component.props.marginY || 0,
                maxWidth: '100%', // Ensure image respects container width
                display: 'block', // Prevent extra space below image
              }}
              data-context-used={componentData !== undefined ? 'true' : 'false'}
              data-src-from-context={imageSrc !== component.props.src ? 'true' : 'false'}
              onError={(e) => {
                console.error(`Error loading image from: ${imageSrc}`);
                
                // Try alternative loading method if it's a randomuser URL
                const imgElement = e.target as HTMLImageElement;
                const currentSrc = imgElement.src;
                
                if (currentSrc.includes('randomuser.me') || currentSrc.includes('corsproxy')) {
                  try {
                    // Extract the original URL and try a different approach
                    let originalUrl = currentSrc;
                    if (currentSrc.includes('corsproxy.io')) {
                      // Extract the URL from the proxy
                      originalUrl = decodeURIComponent(currentSrc.split('?')[1]);
                    }
                    
                    // Try alternative methods: 
                    // 1. Try with a different CORS proxy
                    const alternativeProxy = 'https://api.allorigins.win/raw?url=';
                    imgElement.src = `${alternativeProxy}${encodeURIComponent(originalUrl)}`;
                    console.log(`Trying alternative proxy: ${imgElement.src}`);
                    return; // Exit early as we're trying a new approach
                  } catch (error) {
                    console.error('Failed to use alternative proxy:', error);
                  }
                }
                
                // Fallback to placeholder if all else fails
                imgElement.src = 'https://placehold.co/400?text=Image+Not+Found';
              }}
              crossOrigin="anonymous" 
              referrerPolicy="no-referrer"
            />
          );
          
        case 'Flexbox':
          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: component.props.flexDirection || component.props.direction || 'row',
                justifyContent: component.props.justifyContent || component.props.justify || 'flex-start',
                alignItems: component.props.alignItems || component.props.align || 'stretch',
                gap: component.props.gap || 2,
                flexWrap: component.props.flexWrap || component.props.wrap || 'nowrap',
                width: component.props.width || '100%',
                maxWidth: component.props.maxWidth || '100%',
                mx: component.props.marginX || 0,
                my: component.props.marginY || 0,
                p: component.props.padding || 2,
                px: component.props.paddingX || undefined,
                py: component.props.paddingY || undefined,
                backgroundColor: component.props.backgroundColor || 'transparent',
              }}
            >
              {component.children?.map(child => (
                <RenderPreviewComponent key={child.id} component={{
                  ...child,
                  contextData: contextData // Pass context data to children
                }} />
              ))}
            </Box>
          );
          
        case 'Stack':
          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: component.props.direction || 'column',
                gap: component.props.spacing || 2,
                width: component.props.width || '100%',
                maxWidth: component.props.maxWidth || '100%',
                mx: component.props.marginX || 0,
                my: component.props.marginY || 0,
                p: component.props.padding || 2,
                px: component.props.paddingX || undefined,
                py: component.props.paddingY || undefined,
                alignItems: component.props.alignItems || 'flex-start',
                justifyContent: component.props.justifyContent || 'flex-start',
                backgroundColor: component.props.backgroundColor || 'transparent',
              }}
            >
              {component.children?.map(child => (
                <RenderPreviewComponent key={child.id} component={{
                  ...child,
                  contextData: contextData // Pass context data to children
                }} />
              ))}
            </Box>
          );
          
        case 'ScrollableContainer':
          return (
            <Box
              sx={{
                height: component.props.height || 200,
                width: component.props.width || '100%',
                maxWidth: component.props.maxWidth || '100%',
                overflow: 'auto',
                border: component.props.border || '1px solid #e0e0e0',
                borderRadius: component.props.borderRadius || 1,
                p: component.props.padding || 2,
                px: component.props.paddingX || undefined,
                py: component.props.paddingY || undefined,
                mx: component.props.marginX || 0,
                my: component.props.marginY || 0,
                backgroundColor: component.props.backgroundColor || 'transparent',
              }}
            >
              {component.children?.map(child => (
                <RenderPreviewComponent key={child.id} component={{
                  ...child,
                  contextData: contextData // Pass context data to children
                }} />
              ))}
            </Box>
          );
        
        case 'TagList':
          // Use context data if available for tags
          const tagData = (() => {
            // If the component has context data from contextPath, use it
            if (componentData !== undefined && componentData !== null) {
              // Handle different types of context data
              if (typeof componentData === 'string') {
                return componentData; // Use the string directly
              } else if (Array.isArray(componentData)) {
                return componentData.join(','); // Join array items
              } else if (typeof componentData === 'object') {
                // Try to extract values that might be relevant tags
                if (componentData.state && componentData.city) {
                  return `${componentData.state},${componentData.city}`;
                } else if (componentData.tags) {
                  return componentData.tags;
                }
                // Extract all values from the object and join them
                return Object.values(componentData)
                  .filter(val => typeof val === 'string')
                  .join(',');
              }
            }
            
            // Fallback to props
            return component.props.tags || '';
          })();
          
          return (
            <Box
              sx={{
                my: component.props.marginY || 2,
                width: '100%',
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 0.5,
                justifyContent: component.props.justifyContent || 'flex-start',
                '& > *': { m: 0.5 }
              }}>
                {tagData.split(component.props.separator || ',').map((tag: string, index: number) => (
                  <Chip
                    key={index}
                    label={tag.trim()}
                    color={component.props.color as any || 'primary'}
                    variant={(component.props.variant === 'contained' ? 'filled' : 'outlined') as any}
                    size={component.props.size as any || 'small'}
                    sx={{
                      borderRadius: component.props.shape === 'rounded' ? '16px' : '4px',
                    }}
                  />
                ))}
              </Box>
              {/* Debug indicator for context */}
              {componentData && (
                <Box
                  sx={{
                    mt: 1,
                    display: 'inline-block',
                    fontSize: '10px',
                    color: 'success.main',
                    borderRadius: '4px',
                  }}
                >
                  Using context data
                </Box>
              )}
            </Box>
          );
        
        default:
          return (
            <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, my: 2 }}>
              <Typography>Unknown component: {component.type}</Typography>
            </Box>
          );
      }
    };
    
    return renderComponent();
  };

  // Handlers for root level component addition
  const handleOpenComponentsMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setComponentsMenuAnchor(event.currentTarget);
  };

  const handleCloseComponentsMenu = () => {
    setComponentsMenuAnchor(null);
  };

  const handleAddComponent = (type: string) => {
    // Find the component definition
    const componentDef = availableComponents.find((c) => c.type === type);
    
    if (!componentDef) {
      console.error(`Component type ${type} not found`);
      return;
    }
    
    // Create a new component with a unique ID
    const newComponent: ComponentConfig = {
      id: uuidv4(),
      type: componentDef.type,
      props: { ...componentDef.defaultProps },
      children: []
    };
    
    // Add to root level
    dispatch({ type: 'ADD_COMPONENT', payload: newComponent });
    handleCloseComponentsMenu();
  };

  // Handlers for drag-drop on empty area
  const handleDragOverEmptyArea = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverEmptyArea(true);
  };

  const handleDragLeaveEmptyArea = () => {
    setDragOverEmptyArea(false);
  };

  const handleDropOnEmptyArea = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverEmptyArea(false);
    
    // Get component data from drag event
    const componentType = e.dataTransfer.getData('component-type');
    
    if (componentType) {
      handleAddComponent(componentType);
    }
  };

  // Add this before the final return in the PlaygroundArea component 
  return (
    <Paper
      elevation={1}
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: '60vh',
        overflow: 'auto',
        bgcolor: '#f9f9f9',
      }}
      onDragOver={handleDragOverEmptyArea}
      onDragLeave={handleDragLeaveEmptyArea}
      onDrop={handleDropOnEmptyArea}
      data-test-id={dragOverEmptyArea ? 'empty-area-drag-over' : 'empty-area'}
    >
      {/* Preview mode toggle and tabs */}
      <Box sx={{ 
        mb: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: '#f8f9fa',
        padding: '8px',
        borderBottom: '1px solid #e0e0e0',
      }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ bgcolor: '#fff', borderRadius: 1 }}
        >
          <Tab 
            label="Structure" 
            value="structure" 
            icon={<CodeIcon fontSize="small" />} 
            iconPosition="start"
            sx={{ minHeight: '40px' }}
          />
          <Tab 
            label="Preview" 
            value="preview" 
            icon={<VisibilityIcon fontSize="small" />} 
            iconPosition="start"
            sx={{ minHeight: '40px' }}
          />
        </Tabs>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={previewMode ? "Edit Structure" : "Preview"}>
            <IconButton onClick={handleTogglePreview} color={previewMode ? "primary" : "default"}>
              {previewMode ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Floating Add Component Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: '25px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: !previewMode ? 'block' : 'none',
        }}
      >
        <Tooltip title="Add component at root level">
          <IconButton
            onClick={handleOpenComponentsMenu}
            sx={{
              backgroundColor: '#4caf50',
              color: 'white',
              boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
              '&:hover': {
                backgroundColor: '#388e3c',
              },
              width: 56,
              height: 56,
            }}
            data-test-id="add-root-component-button"
          >
            <AddCircleOutlineIcon fontSize="large" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={componentsMenuAnchor}
          open={Boolean(componentsMenuAnchor)}
          onClose={handleCloseComponentsMenu}
          sx={{ maxHeight: 300 }}
        >
          {availableComponents.map((comp) => (
            <MenuItem
              key={comp.id}
              onClick={() => handleAddComponent(comp.type)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getComponentColor(comp.type),
                }}
              />
              {comp.type}
            </MenuItem>
          ))}
        </Menu>
      </Box>
      
      {/* Content area - show structure or preview based on mode */}
      {!previewMode ? (
        <Box sx={{ p: 2 }}>
          {dragOverEmptyArea ? (
            <Box
              sx={{
                minHeight: '200px',
                border: '3px dashed #2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.05)',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="subtitle1" color="textSecondary">
                Drop component here
              </Typography>
            </Box>
          ) : (
            components.length === 0 ? (
              // Show message if no components
              <Box
                sx={{
                  minHeight: '200px',
                  border: '1px dashed #ccc',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Typography variant="subtitle1" color="textSecondary">
                  Drag and drop components from the panel on the left
                </Typography>
              </Box>
            ) : (
              // Render components
              components.map(component => (
                <ComponentRenderer
                  key={component.id}
                  component={component}
                  isSelected={selectedComponent?.id === component.id}
                  onSelect={() => handleComponentSelect(component)}
                  onDelete={() => handleDeleteComponent(component.id)}
                  onDragStart={(e) => handleDragStart(e, component.id)}
                  onDragOver={(e) => handleDragOver(e, component.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, component.id)}
                />
              ))
            )
          )}
        </Box>
      ) : (
        renderPreview()
      )}
    </Paper>
  );
} 