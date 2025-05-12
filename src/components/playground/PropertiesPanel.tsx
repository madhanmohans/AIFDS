import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { usePlayground } from '../../context/PlaygroundContext';
import { availableComponents } from '../../config/components';

// Utility function for debouncing property changes
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

// Component for text field properties
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
      data-test-id={`prop-text-field-${prop.label}`}
      inputProps={{
        "data-test-id": `prop-text-input-${prop.label}`
      }}
    />
  );
};

// Component for select field properties
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
  
  // Update when prop value changes
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
    <FormControl fullWidth margin="normal" size="small" data-test-id={`prop-select-field-${prop.label}`}>
      <InputLabel>{prop.label}</InputLabel>
      <Select
        value={localValue}
        label={prop.label}
        onChange={(e) => setLocalValue(e.target.value)}
        data-test-id={`prop-select-${prop.label}`}
      >
        {prop.options.map((option: string) => (
          <MenuItem key={option} value={option} data-test-id={`prop-option-${option}`}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

// Component for color field properties
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
  
  // Update when prop value changes
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

// Component for number field properties
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
  
  // Update when prop value changes
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
  
  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === '' ? 0 : Number(e.target.value);
    // Ensure it's within bounds
    const min = prop.min !== undefined ? prop.min : 0;
    const max = prop.max !== undefined ? prop.max : 100;
    const boundedValue = Math.max(min, Math.min(max, newValue));
    
    setLocalValue(boundedValue);
  };
  
  return (
    <Box sx={{ my: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ flex: 1 }}>
          {prop.label}
        </Typography>
        <TextField
          value={localValue}
          onChange={handleTextInputChange}
          onBlur={() => onChange(localValue)}
          size="small"
          type="number"
          InputProps={{
            inputProps: {
              min: prop.min || 0,
              max: prop.max || 100,
              step: prop.step || 1,
            },
            sx: { maxWidth: '80px' }
          }}
        />
      </Box>
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

// Component for boolean field properties
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
  
  // Update when prop value changes
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

// Helper function to get component color
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

// Get component configuration for a type
const getComponentConfig = (type: string) => {
  return availableComponents.find(c => c.type === type);
};

export default function PropertiesPanel() {
  const { state, dispatch } = usePlayground();
  const { selectedComponent } = state;
  
  // Keep track of property update status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Get component configuration for the selected component
  const componentConfig = selectedComponent ? getComponentConfig(selectedComponent.type) : null;
  
  // Reset save status when component changes
  useEffect(() => {
    setSaveStatus('idle');
  }, [selectedComponent?.id]);

  // Helper function to find and update a nested component
  const findAndUpdateNestedComponent = (
    components: any[],
    targetId: string,
    updateFn: (component: any) => any
  ): any[] => {
    return components.map(comp => {
      if (comp.id === targetId) {
        return updateFn(comp);
      }
      if (comp.children && comp.children.length > 0) {
        return {
          ...comp,
          children: findAndUpdateNestedComponent(comp.children, targetId, updateFn),
        };
      }
      return comp;
    });
  };

  // Generate the property fields for the selected component
  const renderPropertyField = (key: string, prop: any, value: any) => {
    const handleChange = (newValue: any) => {
      if (!selectedComponent) return;
      
      // Set saving status
      setSaveStatus('saving');
      
      // Update the component in the global state
      const updatedComponents = findAndUpdateNestedComponent(
        state.components,
        selectedComponent.id,
        (comp) => ({
          ...comp,
          props: {
            ...comp.props,
            [key]: newValue,
          },
        })
      );
      
      // Update the entire component tree
      dispatch({
        type: 'REORDER_COMPONENTS',
        payload: updatedComponents,
      });
      
      // Also update the selected component with the new value
      dispatch({
        type: 'UPDATE_COMPONENT',
        payload: {
          id: selectedComponent.id,
          props: { [key]: newValue },
        },
      });
      
      // Set saved status with a delay
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      }, 300);
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

  // Add a contextPath field for context usage configuration
  const handlePropertyChange = (key: string, newValue: any) => {
    if (!selectedComponent) return;
    
    // Set saving status
    setSaveStatus('saving');
    
    // Update the component in the global state
    const updatedComponents = findAndUpdateNestedComponent(
      state.components,
      selectedComponent.id,
      (comp) => ({
        ...comp,
        props: {
          ...comp.props,
          [key]: newValue,
        },
      })
    );
    
    // Update the entire component tree
    dispatch({
      type: 'REORDER_COMPONENTS',
      payload: updatedComponents,
    });
    
    // Also update the selected component with the new value
    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: {
        id: selectedComponent.id,
        props: { [key]: newValue },
      },
    });
    
    // Set saved status with a delay
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 300);
  };

  // Helper function to generate available context paths
  const generateContextPaths = (data: any, basePath = ''): string[] => {
    if (!data || typeof data !== 'object') return [];
    
    const paths: string[] = [];
    
    // Add the base path itself if it's not empty
    if (basePath) {
      paths.push(basePath);
    }
    
    Object.keys(data).forEach(key => {
      const newPath = basePath ? `${basePath}.${key}` : key;
      paths.push(newPath);
      
      // Recursively add paths for nested objects
      if (data[key] && typeof data[key] === 'object') {
        if (Array.isArray(data[key])) {
          // For arrays, add paths with array indices for the first few items
          const arr = data[key];
          if (arr.length > 0) {
            // Add array[0] notation for the first item
            paths.push(`${newPath}[0]`);
            
            // If it's an array of objects, explore deeper into the first item
            if (typeof arr[0] === 'object' && arr[0] !== null) {
              paths.push(...generateContextPaths(arr[0], `${newPath}[0]`));
            }
            
            // Add a few more array indices if available
            if (arr.length > 1) {
              paths.push(`${newPath}[1]`);
            }
            if (arr.length > 2) {
              paths.push(`${newPath}[2]`);
            }
          }
        } else {
          // Regular object, recursively explore
          paths.push(...generateContextPaths(data[key], newPath));
        }
      }
    });
    
    return paths;
  };
  
  // Component for context path selection
  const ContextPathSelector = ({ 
    contextData, 
    value, 
    onChange 
  }: { 
    contextData: any; 
    value: string; 
    onChange: (val: string) => void 
  }) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const anchorRef = React.useRef<HTMLDivElement>(null);
    
    // Generate available paths
    const availablePaths = useMemo(() => {
      if (!contextData) return [];
      return generateContextPaths(contextData);
    }, [contextData]);
    
    // Filter available paths based on search query
    const filteredPaths = useMemo(() => {
      if (!searchQuery.trim()) return availablePaths;
      return availablePaths.filter((path: string) => 
        path.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [availablePaths, searchQuery]);
    
    const handleToggle = () => {
      setOpen(prevOpen => !prevOpen);
    };
    
    const handleClose = (event: React.MouseEvent | React.TouchEvent) => {
      if (
        anchorRef.current &&
        anchorRef.current.contains(event.target as HTMLElement)
      ) {
        return;
      }
      setOpen(false);
    };
    
    const handleSelect = (path: string) => {
      onChange(path);
      setOpen(false);
      setSearchQuery('');
    };
    
    const handleClear = () => {
      onChange('');
    };
    
    return (
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Box 
          ref={anchorRef}
          onClick={handleToggle}
          sx={{ 
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '40px',
            backgroundColor: 'white',
            mt: 1,
            mb: 1
          }}
        >
          {value ? (
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip 
                label={value} 
                size="small" 
                onDelete={handleClear}
                color="primary"
              />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select a context path...
            </Typography>
          )}
        </Box>
        
        {open && (
          <Paper 
            sx={{ 
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 100,
              mt: 0.5,
              maxHeight: '300px',
              overflow: 'auto',
              boxShadow: 3
            }}
          >
            <Box sx={{ p: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                variant="outlined"
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />
            </Box>
            <Divider />
            {filteredPaths.length > 0 ? (
              <Box sx={{ p: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {filteredPaths.map((path: string) => (
                  <Chip 
                    key={path} 
                    label={path} 
                    size="small"
                    variant={value === path ? "filled" : "outlined"}
                    color={value === path ? "primary" : "default"}
                    onClick={() => handleSelect(path)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery ? 'No matching paths found' : 'No context paths available'}
                </Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    );
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%', 
        overflow: 'auto',
        p: 2,
        backgroundColor: '#f8f9fa',
        borderRadius: 1,
        border: '1px solid #e0e0e0',
        position: 'relative',
      }}
      id="properties-panel"
      data-test-id="properties-panel"
    >
      <Typography variant="h6" align="center" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
        Properties
      </Typography>
      
      {/* Status indicator */}
      {saveStatus === 'saving' && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            bgcolor: '#6caba8', 
            color: 'white',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            fontSize: '12px',
          }}
        >
          Saving...
        </Box>
      )}
      
      {saveStatus === 'saved' && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            bgcolor: '#b7bf96', 
            color: 'white',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            fontSize: '12px',
          }}
        >
          Saved
        </Box>
      )}

      {selectedComponent && componentConfig ? (
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
            {componentConfig.type} 
            <Typography 
              component="span" 
              variant="caption" 
              sx={{ 
                ml: 1, 
                color: 'text.secondary',
                bgcolor: 'rgba(0,0,0,0.05)',
                px: 0.5,
                py: 0.2,
                borderRadius: 0.5
              }}
            >
              ID: {selectedComponent.id.split('-')[0]}
            </Typography>
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {componentConfig.description}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Context Configuration - MOVED TO TOP */}
          {selectedComponent && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Context Configuration
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Context Path</Typography>
                <ContextPathSelector
                  contextData={selectedComponent.contextData}
                  value={selectedComponent.props?.contextPath || ''}
                  onChange={(val) => handlePropertyChange('contextPath', val)}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Select path to extract data from available context
                </Typography>
              </Box>
              
              {/* Display available context data if the component has any */}
              {selectedComponent.contextData && (
                <Box sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Available Context Data
                  </Typography>
                  
                  <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    {typeof selectedComponent.contextData === 'string' ? (
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                        {selectedComponent.contextData}
                      </Typography>
                    ) : (
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '12px', 
                        maxHeight: '120px', 
                        overflow: 'auto',
                        fontFamily: 'monospace'
                      }}>
                        {JSON.stringify(selectedComponent.contextData, null, 2)}
                      </pre>
                    )}
                  </Paper>
                </Box>
              )}
              
              {/* If parent has context data but this component doesn't */}
              {!selectedComponent.contextData && selectedComponent.id && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No context data available for this component.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    To use context data:
                    <ol style={{ margin: '4px 0 0 20px', padding: 0 }}>
                      <li>Set up API config on a parent component</li>
                      <li>Execute the API call to fetch data</li>
                      <li>Select a context path from the dropdown</li>
                    </ol>
                  </Typography>
                </Box>
              )}
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Properties
          </Typography>
          
          {Object.entries(componentConfig.configurableProps).map(([key, prop]) => (
            <Box key={key} sx={{ mb: 2 }} data-test-id={`property-field-${key}`}>
              {renderPropertyField(key, prop, selectedComponent.props[key])}
            </Box>
          ))}
        </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '200px',
            border: '2px dashed #e0e0e0',
            borderRadius: 2,
            p: 4,
            mt: 4
          }}
        >
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 1 }}>
            No component selected
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Select a component to edit its properties
          </Typography>
        </Box>
      )}
    </Paper>
  );
} 