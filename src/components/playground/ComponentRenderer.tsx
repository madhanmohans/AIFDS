import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Stack,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Backdrop,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ApiIcon from '@mui/icons-material/Api';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { usePlayground } from '../../context/PlaygroundContext';
import type { ComponentConfig } from '../../types/playground';
import { TagList, renderTagListPreview } from './TagList';
import ContextDebugger from './ContextDebugger';

// Props for the component renderer
interface ComponentRendererProps {
  component: ComponentConfig; // Now using the imported ComponentConfig
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

// Available component types to add as children
const AVAILABLE_COMPONENTS = [
  { id: 'map', type: 'MapComponent', defaultProps: { dataPath: 'items', emptyText: 'No items to display', condition: '' } }, // Moved to top for prominence
  { id: 'taglist', type: 'TagList', defaultProps: { 
    tags: 'CS,SVT,DMT', 
    separator: ',', 
    variant: 'contained', 
    color: 'primary', 
    size: 'small',
    shape: 'rounded'
  }}, // New TagList component
  { id: 'section', type: 'Section', defaultProps: { height: 200, width: '100%' } },
  { id: 'typography', type: 'Typography', defaultProps: { variant: 'body1', text: 'Text content', align: 'left' } },
  { id: 'button', type: 'Button', defaultProps: { variant: 'contained', text: 'Button', color: 'primary' } },
  { id: 'card', type: 'Card', defaultProps: { elevation: 1, width: '100%' } },
  { id: 'image', type: 'Image', defaultProps: { src: 'https://picsum.photos/200', alt: 'Image', width: 200, height: 200 } },
  { id: 'flexbox', type: 'Flexbox', defaultProps: { direction: 'row', justify: 'flex-start', align: 'stretch', gap: 2 } },
  { id: 'stack', type: 'Stack', defaultProps: { direction: 'column', spacing: 2 } },
  { id: 'scrollable', type: 'ScrollableContainer', defaultProps: { height: 200, width: '100%' } },
];

// Color helper for each component type
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
    case 'MapComponent': return '#8e44ad'; // Map component color
    case 'TagList': return '#f39c12'; // Tag list component color
    default: return '#6caba8';
  }
};

// Add predefined API templates after the getComponentColor function
const predefinedApiTemplates = [
  {
    name: "PokeAPI - Pokemon Abilities",
    url: "https://pokeapi.co/api/v2/pokemon/ditto",
    dataPath: "abilities[].ability.name",
    description: "Extract ability names from a Pokemon",
    method: "GET",
    payload: ""
  },
  {
    name: "PokeAPI - Pokemon Types",
    url: "https://pokeapi.co/api/v2/pokemon/pikachu",
    dataPath: "types[].type.name",
    description: "Extract type names from a Pokemon",
    method: "GET",
    payload: ""
  },
  {
    name: "PokeAPI - Pokemon Moves",
    url: "https://pokeapi.co/api/v2/pokemon/charizard",
    dataPath: "moves[].move.name",
    description: "Extract move names from a Pokemon",
    method: "GET",
    payload: ""
  }
];

// Extract specific context data if contextPath is specified
const getSpecificContextData = (component: ComponentConfig) => {
  // If component has no context data, return undefined
  if (!component.contextData) {
    console.log(`💭 ${component.type}:${component.id} has no context data`);
    return undefined;
  }
  
  // If component has a contextPath, extract that specific part
  if (component.props && component.props.contextPath) {
    const path = component.props.contextPath;
    try {
      // Handle empty path
      if (!path.trim()) {
        console.log(`📄 ${component.type}:${component.id} using full context (empty path)`);
        return component.contextData;
      }
      
      // Navigate to the specified context path
      const result = path.split('.').reduce((obj: any, key: string) => {
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
      
      console.log(`🔍 Context path ${path} for ${component.type}:${component.id} resolved to:`, result);
      return result;
    } catch (error) {
      console.error(`⚠️ Error accessing context path ${path}:`, error);
      return undefined;
    }
  }
  
  // Special handling for components that have been passed context data from parent
  // but don't have their own contextPath specified
  if (component.props && component.props.inheritedContext === true && component.contextData) {
    console.log(`🌟 ${component.type}:${component.id} using inherited context`);
    return component.contextData;
  }
  
  // Otherwise return the full context data
  console.log(`📦 ${component.type}:${component.id} using full context (no path specified)`);
  return component.contextData;
};

// Log information about child components rendering for better debugging
const logChildrenRendering = (component: ComponentConfig) => {
  if (component.children && component.children.length > 0) {
    console.log(`📋 Rendering ${component.children.length} children for ${component.type}:${component.id}`);
    component.children.forEach((child, index) => {
      console.log(`Child ${index+1}: ${child.type}:${child.id}, contextPath: ${child.props?.contextPath || 'none'}, has context: ${!!child.contextData}`);
    });
  }
};

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  isSelected,
  onSelect,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const { state, dispatch } = usePlayground();
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  const [apiConfig, setApiConfig] = useState(component.apiConfig || {
    url: '',
    method: 'GET',
    headers: {},
    payload: '',
    enabled: false
  });

  // Helper function to toggle preview mode
  const togglePreviewMode = () => {
    dispatch({ type: 'TOGGLE_PREVIEW_MODE', payload: !state.previewMode });
  };

  // Handle adding a new child component
  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAddMenuAnchorEl(event.currentTarget);
  };

  const handleAddMenuClose = () => {
    setAddMenuAnchorEl(null);
  };

  const handleAddComponent = (componentType: string) => {
    // Find the component definition
    const componentDef = AVAILABLE_COMPONENTS.find(c => c.type === componentType);
    if (!componentDef) return;

    // Create a new component
    const newComponent: ComponentConfig = {
      id: `${componentDef.id}-${Date.now()}`,
      type: componentDef.type,
      props: { ...componentDef.defaultProps },
      children: [],
    };

    // Add it as a child to the current component
    dispatch({
      type: 'ADD_CHILD_COMPONENT',
      payload: {
        parentId: component.id,
        component: newComponent,
      },
    });

    // Close the menu
    handleAddMenuClose();
  };

  // Handle API configuration
  const handleApiConfigOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setApiDialogOpen(true);
  };

  const handleApiConfigClose = () => {
    setApiDialogOpen(false);
  };

  const handleApiConfigSave = () => {
    // Ensure method is one of the allowed values
    const validMethod = (apiConfig.method === 'GET' || 
                        apiConfig.method === 'POST' || 
                        apiConfig.method === 'PUT' || 
                        apiConfig.method === 'DELETE') 
                        ? apiConfig.method : 'GET';
    
    // Update the component's API config with validated values
    dispatch({
      type: 'UPDATE_API_CONFIG',
      payload: {
        id: component.id,
        apiConfig: {
          ...apiConfig,
          method: validMethod
        },
      },
    });
    
    // Close the dialog
    setApiDialogOpen(false);
  };

  // Execute API call
  const executeApiCall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!component.apiConfig?.url || !component.apiConfig.enabled) return;

    try {
      const response = await fetch(component.apiConfig.url, {
        method: component.apiConfig.method,
        headers: component.apiConfig.headers || {},
        body: component.apiConfig.method !== 'GET' && component.apiConfig.payload
          ? component.apiConfig.payload
          : undefined,
      });

      const data = await response.json();

      // Update the component's context data
      dispatch({
        type: 'UPDATE_CONTEXT_DATA',
        payload: {
          id: component.id,
          contextData: data,
        },
      });
    } catch (error) {
      console.error('API call failed:', error);
      // Store error in context
      dispatch({
        type: 'UPDATE_CONTEXT_DATA',
        payload: {
          id: component.id,
          contextData: { error: 'API call failed' },
        },
      });
    }
  };

  // Wrapper for all rendered components
  const ComponentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Add this code to indicate that specific context data is being used
    const hasContextPath = component.props && component.props.contextPath;
    
    // Log children rendering when component mounts
    React.useEffect(() => {
      logChildrenRendering(component);
    }, []);
    
    return (
      <Box
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-test-id={`${component.type.toLowerCase()}-${component.id}`}
        data-component-id={component.id}
        data-component-type={component.type}
        data-selected={isSelected ? 'true' : 'false'}
        sx={{
          position: 'relative',
          padding: 1,
          mb: 1,
          borderRadius: 1,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderLeft: `3px solid ${getComponentColor(component.type)}`,
          backgroundColor: isSelected ? 'rgba(108, 171, 168, 0.1)' : 'transparent',
          outline: isSelected ? `2px solid ${getComponentColor(component.type)}` : 'none',
          '&:hover': {
            backgroundColor: isSelected ? 'rgba(108, 171, 168, 0.15)' : 'rgba(245, 245, 245, 0.7)',
            '& .component-actions': {
              opacity: 1,
              visibility: 'visible',
            },
          },
        }}
      >
        {/* Component type indicator */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            backgroundColor: 'rgba(255,255,255,0.8)', 
            px: 0.5, 
            borderRadius: '0 0 4px 0',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            zIndex: 1
          }}
        >
          <Box 
            sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: getComponentColor(component.type) 
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {component.type}
          </Typography>
          
          {/* Context path indicator */}
          {hasContextPath && (
            <Chip
              label={component.props.contextPath}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ 
                height: 16, 
                fontSize: '9px',
                '& .MuiChip-label': { px: 0.5 }
              }}
            />
          )}
          
          {/* API indicator if configured */}
          {component.apiConfig?.enabled && (
            <Tooltip title="API configured">
              <ApiIcon fontSize="small" color="primary" sx={{ width: 14, height: 14 }} />
            </Tooltip>
          )}
          
          {/* Context data indicator */}
          {component.contextData && (
            <Tooltip title="Has context data">
              <CodeIcon fontSize="small" color="secondary" sx={{ width: 14, height: 14 }} />
            </Tooltip>
          )}
        </Box>
        
        {/* Component actions (delete, add child, etc.) - visible on hover or select */}
        <Box
          className="component-actions"
          sx={{
            position: 'absolute',
            top: 4,
            right: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            opacity: isSelected ? 1 : 0,
            visibility: isSelected ? 'visible' : 'hidden',
            transition: 'opacity 0.2s ease, visibility 0.2s ease',
            zIndex: 10,
          }}
        >
          <Tooltip title="Add child component">
            <IconButton
              size="small"
              onClick={handleAddClick}
              sx={{ 
                p: 0.5, 
                bgcolor: '#4caf50', 
                color: 'white',
                '&:hover': { bgcolor: '#388e3c' },
              }}
            >
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="API configuration">
            <IconButton
              size="small"
              onClick={handleApiConfigOpen}
              sx={{ 
                p: 0.5, 
                bgcolor: '#2196f3', 
                color: 'white',
                '&:hover': { bgcolor: '#1976d2' },
              }}
            >
              <ApiIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Add execute API call button outside the config dialog */}
          {component.apiConfig?.enabled && (
            <Tooltip title="Execute API Call">
              <IconButton
                size="small"
                onClick={executeApiCall}
                sx={{ 
                  p: 0.5, 
                  bgcolor: '#ff9800', 
                  color: 'white',
                  '&:hover': { bgcolor: '#f57c00' },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Toggle preview mode">
            <IconButton
              size="small"
              onClick={togglePreviewMode}
              sx={{ 
                p: 0.5, 
                bgcolor: '#ff9800', 
                color: 'white',
                '&:hover': { bgcolor: '#f57c00' },
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Drag to reposition">
            <IconButton
              size="small"
              sx={{ 
                p: 0.5, 
                bgcolor: getComponentColor(component.type), 
                color: 'white',
                '&:hover': { bgcolor: getComponentColor(component.type) },
                cursor: 'grab',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete component">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              sx={{ 
                p: 0.5, 
                bgcolor: '#e66e73', 
                color: 'white',
                '&:hover': { bgcolor: '#d25a5e' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        {children}
        
        {/* Add component menu */}
        <Menu
          anchorEl={addMenuAnchorEl}
          open={Boolean(addMenuAnchorEl)}
          onClose={handleAddMenuClose}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            style: {
              maxHeight: 400,
              width: 320,
            },
          }}
          transformOrigin={{
            vertical: 'center',
            horizontal: 'center',
          }}
          anchorReference="anchorPosition"
          anchorPosition={
            addMenuAnchorEl
              ? { top: window.innerHeight / 2, left: window.innerWidth / 2 }
              : undefined
          }
          slotProps={{
            backdrop: {
              style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
              onClick: handleAddMenuClose
            }
          }}
          sx={{ zIndex: 1500 }}
          BackdropProps={{
            open: Boolean(addMenuAnchorEl),
            onClick: handleAddMenuClose,
          }}
        >
          {AVAILABLE_COMPONENTS.map((comp) => (
            <MenuItem 
              key={comp.id}
              onClick={() => handleAddComponent(comp.type)}
              sx={{ 
                borderLeft: `4px solid ${getComponentColor(comp.type)}`,
                '&:hover': { 
                  backgroundColor: 'rgba(108, 171, 168, 0.1)' 
                }
              }}
            >
              <ListItemIcon>
                <Box 
                  sx={{ 
                    width: 16, 
                    height: 16, 
                    borderRadius: '50%', 
                    bgcolor: getComponentColor(comp.type) 
                  }}
                />
              </ListItemIcon>
              <ListItemText primary={comp.type} />
            </MenuItem>
          ))}
        </Menu>
        
        {/* API Configuration Dialog - fix the dialog and inputs to prevent flickering */}
        <Dialog
          open={apiDialogOpen}
          onClose={handleApiConfigClose}
          onClick={(e) => e.stopPropagation()}
          maxWidth="sm"
          fullWidth
          keepMounted
        >
          <DialogTitle>API Configuration</DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel id="api-method-label">Method</InputLabel>
              <Select
                labelId="api-method-label"
                value={apiConfig.method || 'GET'}
                label="Method"
                onChange={(e) => setApiConfig((prev) => ({ ...prev, method: e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE' }))}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              label="URL"
              value={apiConfig.url || ''}
              onChange={(e) => setApiConfig((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://api.example.com/data"
            />
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                API Templates:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {predefinedApiTemplates.map((template, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.03)' },
                    }}
                    onClick={() => {
                      // Apply this template
                      setApiConfig({
                        ...apiConfig,
                        url: template.url,
                        method: template.method,
                        headers: { 'Content-Type': 'application/json' },
                        enabled: true,
                        payload: template.payload
                      });
                      
                      // Update the data path in the component props
                      dispatch({
                        type: 'UPDATE_COMPONENT',
                        payload: {
                          id: component.id,
                          props: {
                            ...component.props,
                            dataPath: template.dataPath,
                          }
                        }
                      });
                    }}
                  >
                    <Typography variant="subtitle2">{template.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      URL: <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{template.url}</span>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Data Path: <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{template.dataPath}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {template.description}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
            
            {(apiConfig.method === 'POST' || apiConfig.method === 'PUT') && (
              <TextField
                fullWidth
                margin="normal"
                label="Payload"
                multiline
                rows={4}
                value={apiConfig.payload || ''}
                onChange={(e) => setApiConfig((prev) => ({ ...prev, payload: e.target.value }))}
                placeholder='{"key": "value"}'
              />
            )}
            
            <TextField
              fullWidth
              margin="normal"
              label="Headers (JSON)"
              multiline
              rows={2}
              value={JSON.stringify(apiConfig.headers || {}, null, 2)}
              onChange={(e) => {
                try {
                  const headers = JSON.parse(e.target.value);
                  setApiConfig((prev) => ({ ...prev, headers }));
                } catch (error) {
                  // Don't update on invalid JSON
                }
              }}
              placeholder='{"Content-Type": "application/json"}'
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="api-enabled-label">Enabled</InputLabel>
              <Select
                labelId="api-enabled-label"
                value={apiConfig.enabled ? 'true' : 'false'}
                label="Enabled"
                onChange={(e) => setApiConfig((prev) => ({ ...prev, enabled: e.target.value === 'true' }))}
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleApiConfigClose}>Cancel</Button>
            <Button onClick={handleApiConfigSave} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Children rendering for components with children */}
        {component.children && component.children.length > 0 && (
          <Box
            sx={{
              mt: 2,
              pl: 2,
              pt: 1,
              pb: 1,
              borderLeft: `2px dashed ${getComponentColor(component.type)}`,
              borderRadius: '0 0 0 4px',
            }}
          >
            {component.children.map(child => (
              <NestedComponentRenderer 
                key={child.id} 
                component={child}
                parentType={component.type}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  };
  
  // Nested component renderer (simpler version for children)
  const NestedComponentRenderer = ({ 
    component, 
    parentType 
  }: { 
    component: ComponentConfig,
    parentType: string
  }) => {
    // Check if this nested component is selected
    const isChildSelected = state.selectedComponent?.id === component.id;
    const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<null | HTMLElement>(null);
    const isDropTarget = state.dropTarget?.id === component.id;

    // Get the specific context data for this component
    const specificContextData = getSpecificContextData(component);

    // Handler to select a nested component
    const handleNestedComponentSelect = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Dispatch action to select this component
      dispatch({ 
        type: 'SELECT_COMPONENT', 
        payload: component 
      });
    };
    
    // Handler to delete a nested component
    const handleNestedComponentDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // If this component is selected, clear selection first
      if (state.selectedComponent?.id === component.id) {
        dispatch({ type: 'SELECT_COMPONENT', payload: null });
      }
      
      // Delete the component
      dispatch({ type: 'DELETE_COMPONENT', payload: component.id });
    };
    
    // Handle adding a new child component
    const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setAddMenuAnchorEl(event.currentTarget);
    };

    const handleAddMenuClose = () => {
      setAddMenuAnchorEl(null);
    };

    const handleAddNestedComponent = (componentType: string) => {
      // Find the component definition
      const componentDef = AVAILABLE_COMPONENTS.find(c => c.type === componentType);
      if (!componentDef) return;

      // Create a new component
      const newComponent: ComponentConfig = {
        id: `${componentDef.id}-${Date.now()}`,
        type: componentDef.type,
        props: { ...componentDef.defaultProps },
        children: [],
      };

      // Add it as a child to the nested component
      dispatch({
        type: 'ADD_CHILD_COMPONENT',
        payload: {
          parentId: component.id,
          component: newComponent,
        },
      });

      // Close the menu
      handleAddMenuClose();
    };
    
    // Handle nested drag start
    const handleNestedDragStart = (e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.setData('componentId', component.id);
      document.body.style.cursor = 'grabbing';
    };
    
    const renderNestedComponent = () => {
      switch (component.type) {
        case 'Typography':
          // Use specific context data if available, otherwise use component props directly
          const textContent = (() => {
            const contextData = getSpecificContextData(component);
            
            if (contextData !== undefined) {
              if (typeof contextData === 'string') {
                return contextData;
              } else if (Array.isArray(contextData)) {
                return contextData.join(', ');
              } else {
                return JSON.stringify(contextData);
              }
            }
            
            return component.props?.children || component.props?.text || 'Text Content';
          })();
            
          return (
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
              }}
              data-test-id={`nested-typography-${component.id}`}
              data-component-type="Typography"
              data-component-id={component.id}
              data-context-used={getSpecificContextData(component) !== undefined ? 'true' : 'false'}
            >
              {textContent}
              {getSpecificContextData(component) && !state.previewMode && (
                <Chip
                  label="Using context"
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ 
                    ml: 1,
                    height: 16, 
                    fontSize: '9px',
                    '& .MuiChip-label': { px: 0.5 }
                  }}
                />
              )}
            </Typography>
          );
        case 'Button':
          // Similarly for Button, use specific context if available
          const buttonText = (() => {
            const contextData = getSpecificContextData(component);
            
            if (contextData !== undefined) {
              if (typeof contextData === 'string') {
                return contextData;
              } else if (Array.isArray(contextData)) {
                return contextData.join(', ');
              } else {
                return JSON.stringify(contextData);
              }
            }
            
            return component.props?.children || 'Button';
          })();
            
          return (
            <Button
              variant={component.props?.variant as any || 'contained'}
              color={component.props?.color as any || 'primary'}
              size={component.props?.size as any || 'medium'}
              disabled={component.props?.disabled === 'true' || component.props?.disabled === true}
              sx={{
                backgroundColor: 
                  component.props?.variant === 'contained' ?
                    (component.props?.color === 'primary' ? '#6caba8' : 
                     component.props?.color === 'secondary' ? '#6d597a' :
                     component.props?.color === 'error' ? '#e66e73' :
                     component.props?.color === 'warning' ? '#e6a456' :
                     component.props?.color === 'success' ? '#b7bf96' : '#6caba8') : undefined,
              }}
              data-test-id={`nested-button-${component.id}`}
              data-component-type="Button"
              data-component-id={component.id}
              data-context-used={getSpecificContextData(component) !== undefined ? 'true' : 'false'}
            >
              {buttonText}
            </Button>
          );
        case 'Image':
          // If we have context data for image URL, use it
          const imageSrc = (() => {
            const contextData = getSpecificContextData(component);
            
            if (contextData !== undefined && typeof contextData === 'string') {
              return contextData;
            }
            
            return component.props?.src || 'https://picsum.photos/200';
          })();
            
          return (
            <Box
              component="img"
              src={imageSrc}
              alt={component.props?.alt || 'Image'}
              sx={{
                width: component.props?.width || 200,
                height: component.props?.height || 200,
                objectFit: component.props?.objectFit || 'cover',
                borderRadius: component.props?.borderRadius || 0,
                position: 'relative',
              }}
              data-test-id={`nested-image-${component.id}`}
              data-component-type="Image"
              data-component-id={component.id}
              data-context-used={getSpecificContextData(component) !== undefined ? 'true' : 'false'}
            />
          );
        case 'MapComponent':
          // Get the context data for this component
          const mapComponentContextData = getSpecificContextData(component);
          const dataPath = component.props.dataPath || '';
          
          // Check if we have valid mapping data
          const hasValidMappingData = mapComponentContextData && 
            (Array.isArray(mapComponentContextData) || 
             (dataPath && typeof mapComponentContextData === 'object' && dataPath.split('.').reduce((obj: any, key: string) => 
               obj && typeof obj === 'object' ? obj[key] : undefined, mapComponentContextData)));
          
          return (
            <Box sx={{ 
              p: 2, 
              border: '1px dashed #ccc', 
              borderRadius: 1,
              backgroundColor: 'rgba(142, 68, 173, 0.05)',
              position: 'relative'
            }}>
              {/* Simple badge to show it has context */}
              {component.contextData && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: -6, 
                    right: 10, 
                    backgroundColor: '#8e44ad', 
                    color: 'white',
                    borderRadius: '10px',
                    px: 1,
                    py: 0.2,
                    fontSize: '10px',
                    fontWeight: 'bold',
                    zIndex: 5
                  }}
                >
                  Context Data
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: '#8e44ad' }}>
                  Map Component
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {component.props.dataPath ? `Data path: ${component.props.dataPath}` : 'No data path set'}
                </Typography>
              </Box>
              
              {component.props.condition && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Filter condition: <code>{component.props.condition}</code>
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 1, mb: 1, p: 1, backgroundColor: component.contextData ? 'rgba(142, 68, 173, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 'bold' }}>
                  {component.contextData 
                    ? 'Context data available for mapping' 
                    : 'No context data available for mapping'}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                {component.children?.length 
                  ? `Will iterate over items and render ${component.children.length} child component(s)` 
                  : 'Add child components to render for each item'}
              </Typography>
            </Box>
          );
        default:
          return (
            <Box 
              sx={{ 
                p: 1, 
                borderLeft: `2px solid ${getComponentColor(component.type)}`,
                position: 'relative'
              }}
              data-test-id={`nested-component-${component.type.toLowerCase()}-${component.id}`}
              data-component-type={component.type}
              data-component-id={component.id}
              data-parent-type={parentType}
            >
              <Typography variant="caption" sx={{ 
                display: 'block', 
                color: 'text.secondary',
              }}>
                {component.type} {getSpecificContextData(component) 
                  ? `(${typeof getSpecificContextData(component) === 'string' 
                      ? getSpecificContextData(component) 
                      : JSON.stringify(getSpecificContextData(component)).substring(0, 20) + '...'})`
                  : ''}
              </Typography>
            </Box>
          );
      }
    };
    
    return (
      <Box 
        sx={{ 
          mb: 1, 
          position: 'relative',
          p: 1,
          borderRadius: 1,
          cursor: 'pointer',
          border: isChildSelected ? `1px solid ${getComponentColor(component.type)}` : '1px solid transparent',
          backgroundColor: isChildSelected ? 'rgba(108, 171, 168, 0.1)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(245, 245, 245, 0.7)',
            '& .nested-actions': {
              opacity: 1,
              visibility: 'visible',
            },
          }
        }}
        onClick={handleNestedComponentSelect}
        draggable
        onDragStart={handleNestedDragStart}
        data-test-id={`nested-container-${component.id}`}
        data-component-id={component.id}
        data-component-type={component.type}
        data-selected={isChildSelected ? 'true' : 'false'}
      >
        {/* Drop indicator */}
        {isDropTarget && state.dropTarget && (
          <Box 
            sx={{
              position: 'absolute',
              top: state.dropTarget.position === 'before' ? -2 : (state.dropTarget.position === 'inside' ? 0 : 'auto'),
              bottom: state.dropTarget.position === 'after' ? -2 : 'auto',
              left: 0,
              right: 0,
              height: state.dropTarget.position === 'inside' ? '100%' : '4px',
              border: state.dropTarget.position === 'inside' ? '2px dashed #ff9800' : 'none',
              backgroundColor: state.dropTarget.position !== 'inside' ? 
                (state.dropTarget.position === 'before' ? '#2196f3' : '#4caf50') : 'rgba(255, 152, 0, 0.1)',
              zIndex: state.dropTarget.position === 'inside' ? 0 : 10,
              pointerEvents: 'none'
            }}
          />
        )}
        
        {/* Context path indicator */}
        {component.props.contextPath && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: 10,
              backgroundColor: '#f5f5f5',
              fontSize: '10px',
              padding: '1px 4px',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
              color: '#757575',
              zIndex: 5
            }}
          >
            {component.props.contextPath}
          </Box>
        )}
        
        {/* Nested component actions */}
        <Box
          className="nested-actions"
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            opacity: isChildSelected ? 1 : 0,
            visibility: isChildSelected ? 'visible' : 'hidden',
            display: 'flex',
            gap: 0.5,
            zIndex: 10,
          }}
        >
          <IconButton
            size="small"
            onClick={handleAddClick}
            sx={{ 
              p: 0.3, 
              bgcolor: '#4caf50', 
              color: 'white',
              '&:hover': { bgcolor: '#388e3c' },
              fontSize: '12px',
              minWidth: '20px',
              minHeight: '20px',
            }}
          >
            <AddCircleOutlineIcon fontSize="inherit" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleNestedComponentDelete}
            sx={{ 
              p: 0.3, 
              bgcolor: '#e66e73', 
              color: 'white',
              '&:hover': { bgcolor: '#d25a5e' },
              fontSize: '12px',
              minWidth: '20px',
              minHeight: '20px',
            }}
          >
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </Box>
        
        {/* Component ID display */}
        <Typography
          sx={{
            position: 'absolute',
            top: '50%', 
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '7px',
            color: 'rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            zIndex: 0,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '80%'
          }}
        >
          {component.id}
        </Typography>
        
        {renderNestedComponent()}
        
        {/* Add component menu for nested components */}
        <Menu
          anchorEl={addMenuAnchorEl}
          open={Boolean(addMenuAnchorEl)}
          onClose={handleAddMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          {AVAILABLE_COMPONENTS.map((comp) => (
            <MenuItem 
              key={comp.id}
              onClick={() => handleAddNestedComponent(comp.type)}
              sx={{ 
                borderLeft: `4px solid ${getComponentColor(comp.type)}`,
                '&:hover': { 
                  backgroundColor: 'rgba(108, 171, 168, 0.1)' 
                }
              }}
            >
              <ListItemIcon>
                <Box 
                  sx={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: getComponentColor(comp.type) 
                  }}
                />
              </ListItemIcon>
              <ListItemText primary={comp.type} />
            </MenuItem>
          ))}
        </Menu>
        
        {/* Show children if any */}
        {component.children && component.children.length > 0 && (
          <Box
            sx={{
              mt: 1,
              pl: 1,
              borderLeft: `1px dashed ${getComponentColor(component.type)}`,
            }}
          >
            {component.children.map((child, index) => (
              <NestedComponentRenderer 
                key={`${child.id}-${index}`} 
                component={child}
                parentType={component.type}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  };
  
  // Render specific component types
  switch (component.type) {
    case 'Section':
      return (
        <ComponentWrapper>
          <Box
            sx={{
              padding: component.props?.padding || 2,
              margin: component.props?.margin || 0,
              backgroundColor: component.props?.backgroundColor || '#f9f9f9',
              borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : 0,
              border: component.props?.border || '1px solid #eee',
              minHeight: 50,
            }}
            data-test-id={`section-content-${component.id}`}
            data-component-id={component.id}
          />
        </ComponentWrapper>
      );
      
    case 'Typography':
      const textContent = (() => {
        // First priority: contextPath data if available
        const contextData = getSpecificContextData(component);
        if (contextData !== undefined) {
          if (typeof contextData === 'string') {
            return contextData;
          } else if (Array.isArray(contextData)) {
            return contextData.join(', ');
          } else {
            return JSON.stringify(contextData);
          }
        }
        // Second priority: text property or children
        return component.props?.children || component.props?.text || 'Text Content';
      })();
      
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
            }}
            data-test-id={`typography-content-${component.id}`}
            data-component-id={component.id}
            data-variant={component.props?.variant || 'body1'}
            data-context-used={getSpecificContextData(component) !== undefined ? 'true' : 'false'}
          >
            {textContent}
          </Typography>
        </ComponentWrapper>
      );
    
    case 'Image':
      // If we have context data for image URL, use it
      const imageSrc = (() => {
        // First priority: contextPath data if available
        const contextData = getSpecificContextData(component);
        if (contextData !== undefined && typeof contextData === 'string') {
          return contextData;
        }
        // Second priority: src property
        return component.props?.src || 'https://picsum.photos/200';
      })();
            
      return (
        <ComponentWrapper>
          <Box
            component="img"
            src={imageSrc}
            alt={component.props?.alt || 'Image'}
            sx={{
              width: component.props?.width || 200,
              height: component.props?.height || 200,
              objectFit: component.props?.objectFit || 'cover',
              borderRadius: component.props?.borderRadius || 0,
            }}
            data-test-id={`image-content-${component.id}`}
            data-component-id={component.id}
            data-context-used={getSpecificContextData(component) !== undefined ? 'true' : 'false'}
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
            }}
            elevation={component.props?.elevation || 1}
            variant={component.props?.variant as any || 'elevation'}
            data-test-id={`card-content-${component.id}`}
            data-component-id={component.id}
          >
            <CardContent>
              {/* Debug context data that is available in this Card */}
              {component.contextData && !state.previewMode && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: 0, 
                    bgcolor: 'rgba(0,0,0,0.05)', 
                    px: 0.5, 
                    py: 0.2, 
                    fontSize: '9px',
                    color: 'text.secondary',
                    borderRadius: '0 0 0 4px',
                    display: 'flex',
                    gap: 0.5
                  }}
                >
                  <span>Context: {component.props?.contextPath || 'none'}</span>
                  <span>✓</span>
                </Box>
              )}
              {!component.contextData && !state.previewMode && (
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: 0, 
                    bgcolor: 'rgba(0,0,0,0.05)', 
                    px: 0.5, 
                    py: 0.2, 
                    fontSize: '9px',
                    color: 'error.main',
                    borderRadius: '0 0 0 4px',
                  }}
                >
                  Missing context
                </Box>
              )}
              
              {/* Add ContextDebugger for developers */}
              {!state.previewMode && (
                <Box sx={{ mb: 2 }}>
                  <ContextDebugger component={component} />
                </Box>
              )}
              
              <Typography variant="body2" color="text.secondary">
                Card Content
              </Typography>
            </CardContent>
          </Card>
        </ComponentWrapper>
      );
    
    case 'Button':
      const buttonContent = (() => {
        // Get the context data for this component
        const contextData = getSpecificContextData(component);
        
        if (contextData !== undefined) {
          if (typeof contextData === 'string') {
            return contextData;
          } else if (Array.isArray(contextData)) {
            return contextData.join(', ');
          } else {
            return JSON.stringify(contextData);
          }
        }
        
        return component.props?.children || 'Button';
      })();
      
      return (
        <ComponentWrapper>
          <Button 
            variant={component.props?.variant as any || 'contained'}
            color={component.props?.color as any || 'primary'}
            size={component.props?.size as any || 'medium'}
            disabled={component.props?.disabled === 'true' || component.props?.disabled === true}
            sx={{
              borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : undefined,
              backgroundColor: 
                component.props?.variant === 'contained' ?
                (component.props?.color === 'primary' ? '#6caba8' : 
                 component.props?.color === 'secondary' ? '#6d597a' :
                 component.props?.color === 'error' ? '#e66e73' :
                 component.props?.color === 'warning' ? '#e6a456' :
                 component.props?.color === 'success' ? '#b7bf96' : '#6caba8') : undefined,
            }}
            data-test-id={`button-content-${component.id}`}
            data-component-id={component.id}
          >
            {buttonContent}
          </Button>
        </ComponentWrapper>
      );
    
    case 'MapComponent':
      return (
        <ComponentWrapper>
          <Box sx={{ 
            p: 2, 
            border: '1px dashed #ccc', 
            borderRadius: 1,
            backgroundColor: 'rgba(142, 68, 173, 0.05)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#8e44ad' }}>
                Map Component
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {component.props?.dataPath ? `Data path: ${component.props.dataPath}` : 'No data path set'}
              </Typography>
            </Box>
            
            {component.props?.condition && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Filter condition: <code>{component.props.condition}</code>
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 1, mb: 1, p: 1, backgroundColor: component.contextData ? 'rgba(142, 68, 173, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 'bold' }}>
                {component.contextData 
                  ? 'Context data available for mapping' 
                  : 'No context data available for mapping'}
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {component.children?.length 
                ? `Will iterate over items and render ${component.children.length} child component(s)` 
                : 'Add child components to render for each item'}
            </Typography>
          </Box>
        </ComponentWrapper>
      );
    
    default:
      return (
        <ComponentWrapper>
          <Box 
            sx={{ 
              p: 2, 
              border: '1px dashed #ccc', 
              borderRadius: 1,
              backgroundColor: 'rgba(200, 200, 200, 0.1)'
            }}
            data-test-id={`default-component-${component.type.toLowerCase()}-${component.id}`}
            data-component-type={component.type}
            data-component-id={component.id}
          >
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              {component.type} Component
            </Typography>
          </Box>
        </ComponentWrapper>
      );
  }
};