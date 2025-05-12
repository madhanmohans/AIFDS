import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FilterListIcon from '@mui/icons-material/FilterList';
import DataArrayIcon from '@mui/icons-material/DataArray';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ApiIcon from '@mui/icons-material/Api';
import DataObjectIcon from '@mui/icons-material/DataObject';
import AddIcon from '@mui/icons-material/Add';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { usePlayground } from '../../context/PlaygroundContext';
import type { ComponentConfig } from '../../types/playground';

interface MapComponentProps {
  component: ComponentConfig;
  parentContext?: any;
  renderComponent?: (itemComponent: ComponentConfig, itemData: any, index: number) => React.ReactNode;
}

export const MapComponent: React.FC<MapComponentProps> = ({ component, parentContext, renderComponent }) => {
  const { dispatch, state } = usePlayground();
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [transformCode, setTransformCode] = useState(component.contextTransform || '');
  const [dataPathDialogOpen, setDataPathDialogOpen] = useState(false);
  const [dataPath, setDataPath] = useState(component.props.dataPath || '');
  const [availablePaths, setAvailablePaths] = useState<string[]>([]);
  const [selectedChildTemplate, setSelectedChildTemplate] = useState<string | null>(null);
  const [activeConditionTab, setActiveConditionTab] = useState('basic');
  const [conditionTemplate, setConditionTemplate] = useState('');
  const [conditionTemplateDialogOpen, setConditionTemplateDialogOpen] = useState(false);
  const [conditionTestResults, setConditionTestResults] = useState<any[]>([]);
  const [conditionTestDialogOpen, setConditionTestDialogOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [pathExamples, setPathExamples] = useState<{path: string, description: string}[]>([]);
  const [apiConfig, setApiConfig] = useState({
    url: '',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    enabled: false
  });
  
  // Get context data from the component or parent
  const contextData = component.contextData || parentContext;
  
  // Effect to extract available paths from context data
  useEffect(() => {
    if (contextData) {
      const paths: string[] = [];
      const extractPaths = (obj: any, currentPath = '') => {
        if (Array.isArray(obj)) {
          paths.push(currentPath);
          if (obj.length > 0 && typeof obj[0] === 'object') {
            // Extract keys from the first item as sample
            Object.keys(obj[0]).forEach(key => {
              extractPaths(obj[0][key], currentPath ? `${currentPath}.0.${key}` : `0.${key}`);
            });
          }
        } else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            if (Array.isArray(obj[key])) {
              paths.push(newPath);
            }
            extractPaths(obj[key], newPath);
          });
        }
      };
      
      extractPaths(contextData);
      setAvailablePaths(paths.filter(p => p));
    }
  }, [contextData]);
  
  const handleCodeDialogOpen = () => {
    setCodeDialogOpen(true);
  };
  
  const handleCodeDialogClose = () => {
    setCodeDialogOpen(false);
  };
  
  const handleDataPathDialogOpen = () => {
    setDataPathDialogOpen(true);
    
    // Provide examples for the data path based on the current context data
    if (contextData) {
      setPathExamples(generatePathExamples(contextData));
    }
  };
  
  const handleDataPathDialogClose = () => {
    setDataPathDialogOpen(false);
  };
  
  const handleDataPathSave = () => {
    // Update the component's data path
    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: {
        id: component.id,
        props: {
          ...component.props,
          dataPath,
        }
      }
    });
    setDataPathDialogOpen(false);
  };
  
  const handleCodeSave = () => {
    // Update the component's context transform code
    dispatch({
      type: 'UPDATE_CONTEXT_TRANSFORM',
      payload: {
        id: component.id,
        contextTransform: transformCode,
      },
    });
    
    // Close the dialog
    setCodeDialogOpen(false);
  };
  
  // Execute the transform code on the context data
  const transformData = (data: any) => {
    if (!data || !component.contextTransform) return data;
    
    try {
      // Create a function from the code string
      const transformFn = new Function('data', component.contextTransform);
      return transformFn(data);
    } catch (error) {
      console.error('Error executing context transform code:', error);
      return data;
    }
  };
  
  // Get the data to map over
  const getDataToMap = () => {
    if (!contextData) return null;
    
    // Transform the data if needed
    const data = transformData(contextData);
    
    // Get the data path from props
    const dataPath = component.props.dataPath || '';
    
    // Get the string processing method
    const stringProcessing = component.props.stringProcessing || 'none';
    
    // Navigate to the data path
    let result;
    
    // Enhanced path parsing to handle array notations like "abilities[].ability.name"
    if (dataPath) {
      // Check if using array notation with field selection
      if (dataPath.includes('[]')) {
        // Handle array field extraction pattern (e.g., "abilities[].ability.name")
        const [arrayPath, fieldPath] = dataPath.split('[].');
        
        // Get the array first
        const arrayData = arrayPath.split('.').reduce<any>((obj: any, path: string) => 
          obj && obj[path], data);
          
        // If we have an array, map through it and extract the fields
        if (Array.isArray(arrayData)) {
          result = arrayData.map(item => 
            fieldPath.split('.').reduce<any>((obj: any, path: string) => 
              obj && obj[path], item));
        }
      } else {
        // Regular path navigation (like "user.name")
        result = dataPath.split('.').reduce<any>((obj: any, path: string) => 
          obj && obj[path], data);
      }
    } else {
      // No path specified, use the whole data
      result = data;
    }
    
    return result;
  };
  
  const dataToMap = getDataToMap();
  const isArrayData = Array.isArray(dataToMap);
  
  // Enhance the cloneComponentWithData function to better handle different data types
  const cloneComponentWithData = (childComponent: ComponentConfig, itemData: any, index: number): ComponentConfig => {
    // Clone the component to avoid modifying the original
    const clone = JSON.parse(JSON.stringify(childComponent));
    
    // Set the item index and data in the context
    clone.contextItemIndex = index;
    
    // Here's where we set the item data as the context for the child component
    // Now we only pass the specific item data instead of the entire parent context
    clone.contextData = itemData;
    
    // Process props to inject data values if needed
    clone.props = processProps(clone.props, itemData);
    
    // Also process any nested child components recursively
    if (clone.children && clone.children.length > 0) {
      clone.children = clone.children.map(child => 
        cloneComponentWithData(child, itemData, index)
      );
    }
    
    return clone;
  };
  
  // Process props to replace dynamic values with actual data
  const processProps = (props: Record<string, any>, data: any): Record<string, any> => {
    // Create a new props object to avoid modifying the original
    const newProps = { ...props };
    
    // Go through all prop keys
    Object.keys(newProps).forEach(key => {
      const value = newProps[key];
      
      // If it's a string, check if it references data fields
      if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
        // Extract the data path from the string
        const matches = value.match(/{{([^}]+)}}/g);
        
        if (matches) {
          let processedValue = value;
          
          // Replace each match with the actual data value
          matches.forEach(match => {
            const path = match.substring(2, match.length - 2).trim();
            let replacement = '';
            
            // Navigate to the specified path in the data
            try {
              // This handles direct property access (e.g., {{name.title}})
              replacement = path.split('.').reduce((obj, key) => 
                obj ? obj[key] : undefined, data);
                
              // If we couldn't find the value, try to see if it's a custom context path
              if (replacement === undefined) {
                // Check if using path notation with specific property (user-defined context path)
                const propPath = path.trim();
                replacement = propPath.split('.').reduce((obj, key) => 
                  obj ? obj[key] : undefined, data);
              }
            } catch (error) {
              console.error(`Error accessing path ${path} in data:`, error);
            }
            
            // Replace the match with the actual value
            processedValue = processedValue.replace(match, replacement !== undefined ? String(replacement) : '');
          });
          
          newProps[key] = processedValue;
        }
      }
    });
    
    return newProps;
  };
  
  // Handle selecting a child as template for mapping
  const handleSelectChildTemplate = (childId: string) => {
    setSelectedChildTemplate(childId === selectedChildTemplate ? null : childId);
  };
  
  // Add this function after getDataToMap
  const getItemPropertyExamples = () => {
    const dataItem = Array.isArray(dataToMap) && dataToMap.length > 0 ? dataToMap[0] : null;
    if (!dataItem) return [];
    
    const examples = [];
    const addPropertyExamples = (obj: any, path = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          examples.push({
            path: currentPath,
            example: `item.${currentPath} === 'somevalue'`,
            type: 'string',
            value
          });
        } else if (typeof value === 'number') {
          examples.push({
            path: currentPath,
            example: `item.${currentPath} > 10`,
            type: 'number',
            value
          });
        } else if (typeof value === 'boolean') {
          examples.push({
            path: currentPath,
            example: `item.${currentPath} === true`,
            type: 'boolean',
            value
          });
        } else if (Array.isArray(value)) {
          examples.push({
            path: currentPath,
            example: `item.${currentPath}.includes('somevalue')`,
            type: 'array',
            value
          });
        } else if (value && typeof value === 'object') {
          addPropertyExamples(value, currentPath);
        }
      });
    };
    
    addPropertyExamples(dataItem);
    return examples;
  };
  
  // Condition examples that can be used
  const conditionExamples = [
    { label: 'Equal to', template: '{prop} === "{value}"', description: 'Check if a property equals a value' },
    { label: 'Contains text', template: '{prop}.includes("{value}")', description: 'Check if text contains a substring' },
    { label: 'Greater than', template: '{prop} > {value}', description: 'Check if a number is greater than a value' },
    { label: 'Less than', template: '{prop} < {value}', description: 'Check if a number is less than a value' },
    { label: 'Starts with', template: '{prop}.startsWith("{value}")', description: 'Check if text starts with a value' },
    { label: 'Ends with', template: '{prop}.endsWith("{value}")', description: 'Check if text ends with a value' },
    { label: 'Is not empty', template: '{prop} && {prop}.length > 0', description: 'Check if a value exists and has content' },
    { label: 'Between range', template: '{prop} >= {min} && {prop} <= {max}', description: 'Check if a number is in a range' },
    { label: 'One of values', template: '[{values}].includes({prop})', description: 'Check if value is in a list' },
  ];
  
  // Add this function after getItemPropertyExamples
  const generatePathExamples = (data: any) => {
    const examples: {path: string, description: string}[] = [];
    
    const findArrays = (obj: any, currentPath = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        
        if (Array.isArray(value) && value.length > 0) {
          examples.push({
            path: newPath,
            description: `Array with ${value.length} items`
          });
          
          // Check for nested objects in array items
          if (typeof value[0] === 'object' && value[0] !== null) {
            // Find common fields in the first few items
            const sampleObj = value[0];
            Object.entries(sampleObj).forEach(([fieldKey, fieldValue]) => {
              if (typeof fieldValue === 'object' && fieldValue !== null) {
                // Add example for accessing nested object properties
                Object.keys(fieldValue as object).forEach(nestedKey => {
                  examples.push({
                    path: `${newPath}[].${fieldKey}.${nestedKey}`,
                    description: `Extract '${nestedKey}' from each item's '${fieldKey}'`
                  });
                });
              } else {
                examples.push({
                  path: `${newPath}[].${fieldKey}`,
                  description: `Extract '${fieldKey}' from each item`
                });
              }
            });
          }
        }
        
        // Continue recursion for objects and array items
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value) && value.length > 0) {
            findArrays(value[0], `${newPath}[0]`);
          } else {
            findArrays(value, newPath);
          }
        }
      });
    };
    
    findArrays(data);
    return examples;
  };
  
  // Add this function after the generatePathExamples
  const predefinedApiTemplates = [
    {
      name: "PokeAPI - Pokemon Abilities",
      url: "https://pokeapi.co/api/v2/pokemon/ditto",
      dataPath: "abilities[].ability.name",
      description: "Extract ability names from a Pokemon",
      sample: `{
  "abilities": [
    {
      "ability": {
        "name": "limber",
        "url": "https://pokeapi.co/api/v2/ability/7/"
      },
      "is_hidden": false,
      "slot": 1
    },
    {
      "ability": {
        "name": "imposter",
        "url": "https://pokeapi.co/api/v2/ability/150/"
      },
      "is_hidden": true,
      "slot": 3
    }
  ],
  "name": "ditto",
  "rank": "200"
}`
    },
    {
      name: "PokeAPI - Pokemon Types",
      url: "https://pokeapi.co/api/v2/pokemon/pikachu",
      dataPath: "types[].type.name",
      description: "Extract type names from a Pokemon"
    },
    {
      name: "PokeAPI - Pokemon Moves",
      url: "https://pokeapi.co/api/v2/pokemon/charizard",
      dataPath: "moves[].move.name",
      description: "Extract move names from a Pokemon"
    }
  ];
  
  // Update the Data Path Dialog content to include examples
  const pathExamplesSection = (
    pathExamples.length > 0 && (
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Suggested Data Paths:
        </Typography>
        <Paper variant="outlined" sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
          <List dense>
            {pathExamples.map((example, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  onClick={() => setDataPath(example.path)}
                  selected={dataPath === example.path}
                  dense
                >
                  <ListItemText
                    primary={example.path}
                    secondary={example.description}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    )
  );
  
  // Add a function to directly create a Button child
  const addButtonChild = () => {
    if (component.children?.some(child => child.type === 'Button')) {
      alert('A Button component has already been added. You can customize it in the properties panel.');
      return;
    }
    
    // Create a new Button component as a child
    const buttonComponent: ComponentConfig = {
      id: `button-${Date.now()}`,
      type: 'Button',
      props: {
        variant: 'contained',
        color: 'primary',
        size: 'small',
        // Leave children empty - it will be filled with the data item
      },
      children: [],
    };
    
    // Add the Button as a child
    dispatch({
      type: 'ADD_CHILD_COMPONENT',
      payload: {
        parentId: component.id,
        component: buttonComponent,
      },
    });
    
    // Select the new Button to edit properties
    setTimeout(() => {
      dispatch({ type: 'SELECT_COMPONENT', payload: buttonComponent });
    }, 100);
  };

  // Enhance renderItemPreview to provide a better visualization and "Add Button" functionality
  const renderItemPreview = () => {
    if (!isArrayData || !dataToMap || dataToMap.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No data available to display. Configure the data path or API endpoint.
        </Alert>
      );
    }

    // Log the data for debugging
    console.log("MapComponent data to render:", dataToMap);

    return (
      <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2">
            Preview of Ability Buttons
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<AddCircleOutlineIcon />}
            onClick={addButtonChild}
          >
            Add Button Child
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {dataToMap.map((item, index) => {
            // Use the item directly if it's a string
            const displayValue = typeof item === 'string' ? item : JSON.stringify(item);
            
            return (
              <Button
                key={index}
                variant="contained"
                size="small"
                color="primary"
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 'medium',
                  minWidth: '80px',
                  justifyContent: 'center'
                }}
              >
                {displayValue}
              </Button>
            );
          })}
        </Box>
        
        <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            Current data from API path <code>{component.props.dataPath}</code>: 
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(dataToMap, null, 2)}
          </Typography>
        </Box>
      </Box>
    );
  };
  
  if (!isArrayData) {
    return (
      <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, mt: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          No array data available to map over. Configure the data path or parent component's API.
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={handleDataPathDialogOpen}
          >
            Configure Data Path
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<CodeIcon />}
            onClick={handleCodeDialogOpen}
          >
            Edit Transform Code
          </Button>
        </Box>
        
        {/* Data Path Dialog */}
        <Dialog
          open={dataPathDialogOpen}
          onClose={handleDataPathDialogClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Configure Data Path</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Specify the path to the array data within the context. 
              Leave empty to use the root context (if it's an array).
            </Alert>
            
            <TextField
              fullWidth
              margin="normal"
              label="Data Path"
              value={dataPath}
              onChange={(e) => setDataPath(e.target.value)}
              placeholder="E.g. data.items"
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Filter Condition (JavaScript)"
              value={component.props.condition || ''}
              onChange={(e) => {
                dispatch({
                  type: 'UPDATE_COMPONENT',
                  payload: {
                    id: component.id,
                    props: {
                      ...component.props,
                      condition: e.target.value,
                    }
                  }
                });
              }}
              placeholder="E.g. tag.startsWith('C') || tag === 'SVT'"
              helperText="JavaScript expression to filter items. Use 'item' as the variable name."
            />
            
            {availablePaths.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Available Array Paths:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {availablePaths.map(path => (
                    <Chip 
                      key={path} 
                      label={path} 
                      onClick={() => setDataPath(path)}
                      color={dataPath === path ? "primary" : "default"}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Special String Processing
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel id="string-processing-label">String Processing</InputLabel>
                <Select
                  labelId="string-processing-label"
                  value={component.props.stringProcessing || 'none'}
                  label="String Processing"
                  onChange={(e) => {
                    dispatch({
                      type: 'UPDATE_COMPONENT',
                      payload: {
                        id: component.id,
                        props: {
                          ...component.props,
                          stringProcessing: e.target.value,
                        }
                      }
                    });
                  }}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="split">Split string to array</MenuItem>
                  <MenuItem value="lines">Split by lines</MenuItem>
                  <MenuItem value="json">Parse JSON</MenuItem>
                </Select>
              </FormControl>
              
              {component.props.stringProcessing === 'split' && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Separator"
                  value={component.props.separator || ','}
                  onChange={(e) => {
                    dispatch({
                      type: 'UPDATE_COMPONENT',
                      payload: {
                        id: component.id,
                        props: {
                          ...component.props,
                          separator: e.target.value,
                        }
                      }
                    });
                  }}
                  placeholder=","
                  helperText="Character(s) to split the string by"
                />
              )}
            </Box>
            
            {pathExamplesSection}
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Context Data:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: 200, overflow: 'auto' }}>
                <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(contextData, null, 2)}
                </Typography>
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDataPathDialogClose}>Cancel</Button>
            <Button onClick={handleDataPathSave} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Code Editor Dialog */}
        <Dialog
          open={codeDialogOpen}
          onClose={handleCodeDialogClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Transform Context Data</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Write JavaScript code to transform the context data. The input data is available as the 'data' parameter.
              Return the transformed data.
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={transformCode}
              onChange={(e) => setTransformCode(e.target.value)}
              placeholder="// Example: Transform data before mapping\nreturn data.items || [];"
              InputProps={{
                style: { fontFamily: 'monospace' }
              }}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCodeDialogClose}>Cancel</Button>
            <Button onClick={handleCodeSave} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Mapping over {dataToMap.length} items
          </Typography>
          <Typography variant="caption" color="text.secondary">
            From: {component.props.dataPath || 'root context'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Configure data path">
            <IconButton size="small" onClick={handleDataPathDialogOpen}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Edit transform code">
            <IconButton size="small" onClick={handleCodeDialogOpen}>
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Child components to use as templates */}
      {component.children && component.children.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Child Templates:
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {component.children.map(child => (
              <Chip
                key={child.id}
                label={`${child.type} ${child.id.slice(-5)}`}
                onClick={() => handleSelectChildTemplate(child.id)}
                color={selectedChildTemplate === child.id ? "primary" : "default"}
                size="small"
              />
            ))}
          </Box>
          
          {/* Item preview with template */}
          {selectedChildTemplate && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Template Preview</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Use {{ propertyName }} to insert dynamic data from items
                </Typography>
                
                {dataToMap.slice(0, 1).map((item, index) => {
                  const selectedChild = component.children?.find(c => c.id === selectedChildTemplate);
                  if (!selectedChild) return null;
                  
                  return (
                    <Box key={index} sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Preview with item {index + 1} data:
                      </Typography>
                      <Paper sx={{ p: 2, mt: 1 }}>
                        {renderComponent ? 
                          renderComponent(cloneComponentWithData(selectedChild, item, index), item, index) :
                          <pre>{JSON.stringify(item, null, 2)}</pre>
                        }
                      </Paper>
                    </Box>
                  );
                })}
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption">Available item properties:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {dataToMap[0] && Object.keys(dataToMap[0]).map(key => (
                      <Chip 
                        key={key} 
                        label={`{{${key}}}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        onClick={() => {
                          // Copy to clipboard
                          navigator.clipboard.writeText(`{{${key}}}`);
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Add child components to use as templates for each item in the array
        </Alert>
      )}
      
      {/* Items preview */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Items Preview ({dataToMap.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {dataToMap.slice(0, 5).map((item, index) => (
              <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Item {index + 1}
                </Typography>
                
                {selectedChildTemplate && component.children ? (
                  <Box>
                    {(() => {
                      const selectedChild = component.children.find(c => c.id === selectedChildTemplate);
                      if (!selectedChild) return null;
                      
                      return renderComponent ? 
                        renderComponent(cloneComponentWithData(selectedChild, item, index), item, index) :
                        <pre>{JSON.stringify(item, null, 2)}</pre>;
                    })()}
                  </Box>
                ) : (
                  <Typography variant="body2" component="pre" sx={{ 
                    fontFamily: 'monospace', 
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.75rem',
                    maxHeight: 150,
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(item, null, 2)}
                  </Typography>
                )}
              </Paper>
            ))}
            
            {dataToMap.length > 5 && (
              <Alert severity="info">
                Showing 5 of {dataToMap.length} items
              </Alert>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
      
      {/* Code Editor Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={handleCodeDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Transform Context Data</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Write JavaScript code to transform the context data. The input data is available as the 'data' parameter.
            Return the transformed data.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={transformCode}
            onChange={(e) => setTransformCode(e.target.value)}
            placeholder="// Example: Transform data before mapping\nreturn data.items || [];"
            InputProps={{
              style: { fontFamily: 'monospace' }
            }}
            sx={{ mt: 2 }}
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Context Data:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: 200, overflow: 'auto' }}>
              <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(contextData, null, 2)}
              </Typography>
            </Paper>
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PlayArrowIcon />}
              onClick={() => {
                try {
                  const transformFn = new Function('data', transformCode);
                  const result = transformFn(contextData);
                  alert(JSON.stringify(result, null, 2).slice(0, 500) + (JSON.stringify(result).length > 500 ? '...' : ''));
                } catch (error) {
                  alert(`Error: ${error}`);
                }
              }}
            >
              Test Transform
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCodeDialogClose}>Cancel</Button>
          <Button onClick={handleCodeSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Data Path Dialog */}
      <Dialog
        open={dataPathDialogOpen}
        onClose={handleDataPathDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Configure Data Path</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Specify the path to the array data within the context. 
            Leave empty to use the root context (if it's an array).
          </Alert>
          
          <TextField
            fullWidth
            margin="normal"
            label="Data Path"
            value={dataPath}
            onChange={(e) => setDataPath(e.target.value)}
            placeholder="E.g. data.items"
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Filter Condition (JavaScript)"
            value={component.props.condition || ''}
            onChange={(e) => {
              dispatch({
                type: 'UPDATE_COMPONENT',
                payload: {
                  id: component.id,
                  props: {
                    ...component.props,
                    condition: e.target.value,
                  }
                }
              });
            }}
            placeholder="E.g. tag.startsWith('C') || tag === 'SVT'"
            helperText="JavaScript expression to filter items. Use 'item' as the variable name."
          />
          
          {availablePaths.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Available Array Paths:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {availablePaths.map(path => (
                  <Chip 
                    key={path} 
                    label={path} 
                    onClick={() => setDataPath(path)}
                    color={dataPath === path ? "primary" : "default"}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Special String Processing
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel id="string-processing-label">String Processing</InputLabel>
              <Select
                labelId="string-processing-label"
                value={component.props.stringProcessing || 'none'}
                label="String Processing"
                onChange={(e) => {
                  dispatch({
                    type: 'UPDATE_COMPONENT',
                    payload: {
                      id: component.id,
                      props: {
                        ...component.props,
                        stringProcessing: e.target.value,
                      }
                    }
                  });
                }}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="split">Split string to array</MenuItem>
                <MenuItem value="lines">Split by lines</MenuItem>
                <MenuItem value="json">Parse JSON</MenuItem>
              </Select>
            </FormControl>
            
            {component.props.stringProcessing === 'split' && (
              <TextField
                fullWidth
                margin="normal"
                label="Separator"
                value={component.props.separator || ','}
                onChange={(e) => {
                  dispatch({
                    type: 'UPDATE_COMPONENT',
                    payload: {
                      id: component.id,
                      props: {
                        ...component.props,
                        separator: e.target.value,
                      }
                    }
                  });
                }}
                placeholder=","
                helperText="Character(s) to split the string by"
              />
            )}
          </Box>
          
          {pathExamplesSection}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Context Data:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: 200, overflow: 'auto' }}>
              <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(contextData, null, 2)}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDataPathDialogClose}>Cancel</Button>
          <Button onClick={handleDataPathSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Condition Dialog */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Filter Condition
        </Typography>
        
        <Tabs
          value={activeConditionTab}
          onChange={(e, newValue) => setActiveConditionTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Basic" value="basic" />
          <Tab label="Code" value="code" />
          <Tab label="Templates" value="templates" />
        </Tabs>
        
        {activeConditionTab === 'basic' ? (
          <Box>
            <TextField
              fullWidth
              margin="normal"
              label="Condition Expression"
              value={component.props.condition || ''}
              onChange={(e) => {
                dispatch({
                  type: 'UPDATE_COMPONENT',
                  payload: {
                    id: component.id,
                    props: {
                      ...component.props,
                      condition: e.target.value,
                    }
                  }
                });
              }}
              placeholder="E.g. item.tag === 'SVT'"
              helperText="JavaScript expression that returns true/false. Use 'item' to refer to each data item."
            />
            
            {/* Available properties from data */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Available Properties:
              </Typography>
              
              <Paper variant="outlined" sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                  {getItemPropertyExamples().map((example, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemButton 
                        onClick={() => {
                          dispatch({
                            type: 'UPDATE_COMPONENT',
                            payload: {
                              id: component.id,
                              props: {
                                ...component.props,
                                condition: example.example,
                              }
                            }
                          });
                        }}
                        dense
                      >
                        <ListItemText
                          primary={`item.${example.path}`}
                          secondary={`Example: ${example.example} (${example.type})`}
                        />
                        <Chip 
                          label={typeof example.value === 'object' ? JSON.stringify(example.value).substring(0, 15) + '...' : String(example.value)}
                          size="small"
                          variant="outlined"
                          color={example.type === 'string' ? 'primary' : example.type === 'number' ? 'secondary' : 'default'}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          </Box>
        ) : activeConditionTab === 'code' ? (
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Advanced Condition (JavaScript)"
            value={component.props.condition || ''}
            onChange={(e) => {
              dispatch({
                type: 'UPDATE_COMPONENT',
                payload: {
                  id: component.id,
                  props: {
                    ...component.props,
                    condition: e.target.value,
                  }
                }
              });
            }}
            placeholder="return item.type === 'important' && item.priority > 5;"
            helperText="Write JavaScript code that returns true or false. The 'item' variable contains each data element."
            InputProps={{
              style: { fontFamily: 'monospace' }
            }}
          />
        ) : (
          <Grid container spacing={2}>
            {conditionExamples.map((example, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper 
                  elevation={0} 
                  variant="outlined" 
                  sx={{ 
                    p: 1.5,
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.03)' },
                  }}
                  onClick={() => {
                    // Open a dialog to customize this template
                    setConditionTemplate(example.template);
                    setConditionTemplateDialogOpen(true);
                  }}
                >
                  <Typography variant="subtitle2">{example.label}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {example.description}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, fontFamily: 'monospace' }}>
                    {example.template}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="small"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={() => {
              // Test the condition against the first few items
              if (!Array.isArray(dataToMap) || dataToMap.length === 0) {
                alert('No data available to test condition');
                return;
              }
              
              try {
                const condition = component.props.condition;
                if (!condition) {
                  alert('No condition specified');
                  return;
                }
                
                const filterFn = new Function('item', `return ${condition}`);
                const results = dataToMap.slice(0, 5).map((item, index) => {
                  try {
                    return { 
                      item, 
                      result: filterFn(item), 
                      error: null,
                      index
                    };
                  } catch (e) {
                    return { 
                      item, 
                      result: false, 
                      error: e instanceof Error ? e.message : String(e),
                      index
                    };
                  }
                });
                
                setConditionTestResults(results);
                setConditionTestDialogOpen(true);
              } catch (e) {
                alert(`Error in condition: ${e instanceof Error ? e.message : String(e)}`);
              }
            }}
          >
            Test Condition
          </Button>
        </Box>
      </Box>
      
      {/* SpeedDial for quick actions */}
      <SpeedDial
        ariaLabel="Map component quick actions"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
      >
        <SpeedDialAction
          icon={<FilterListIcon />}
          tooltipTitle="Set Condition"
          onClick={() => {
            setSpeedDialOpen(false);
            handleDataPathDialogOpen();
            setActiveConditionTab('basic');
          }}
        />
        <SpeedDialAction
          icon={<DataObjectIcon />}
          tooltipTitle="Transform Data"
          onClick={() => {
            setSpeedDialOpen(false);
            handleCodeDialogOpen();
          }}
        />
        <SpeedDialAction
          icon={<ApiIcon />}
          tooltipTitle="API Reference"
          onClick={() => {
            setSpeedDialOpen(false);
            // Open documentation or help dialog
            setHelpDialogOpen(true);
          }}
        />
        <SpeedDialAction
          icon={<AddIcon />}
          tooltipTitle="Add Template Item"
          onClick={() => {
            setSpeedDialOpen(false);
            // Logic to add a template item
          }}
        />
        <SpeedDialAction
          icon={<DataArrayIcon />}
          tooltipTitle="Use PokeAPI Template"
          onClick={() => {
            setSpeedDialOpen(false);
            const template = predefinedApiTemplates[0];
            setApiConfig({
              ...apiConfig,
              url: template.url,
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              enabled: true
            });
            setDataPath(template.dataPath);
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
            dispatch({
              type: 'UPDATE_API_CONFIG',
              payload: {
                id: component.id,
                apiConfig: {
                  url: template.url,
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                  enabled: true
                },
              },
            });
            // Execute the API call automatically
            executeApiCall();
          }}
        />
      </SpeedDial>
      
      {/* Condition Template Dialog */}
      <Dialog
        open={conditionTemplateDialogOpen}
        onClose={() => setConditionTemplateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Customize Condition Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Template"
            value={conditionTemplate}
            onChange={(e) => setConditionTemplate(e.target.value)}
            InputProps={{
              style: { fontFamily: 'monospace' }
            }}
          />
          
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Property Values:
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {getItemPropertyExamples().slice(0, 6).map((example, index) => (
              <Grid item xs={6} key={index}>
                <Chip
                  label={`item.${example.path}`}
                  onClick={() => {
                    // Insert this property at cursor position
                    setConditionTemplate(prev => {
                      return prev.replace(/{prop}/g, `item.${example.path}`);
                    });
                  }}
                  color="primary"
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConditionTemplateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              dispatch({
                type: 'UPDATE_COMPONENT',
                payload: {
                  id: component.id,
                  props: {
                    ...component.props,
                    condition: conditionTemplate,
                  }
                }
              });
              setConditionTemplateDialogOpen(false);
            }}
            variant="contained"
          >
            Apply Condition
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Condition Test Dialog */}
      <Dialog
        open={conditionTestDialogOpen}
        onClose={() => setConditionTestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Condition Test Results</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Testing condition: <code>{component.props.condition}</code>
          </Typography>
          
          {conditionTestResults.map((result, index) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{ 
                p: 1.5, 
                mb: 1.5,
                borderLeft: result.error 
                  ? '4px solid #f44336' 
                  : result.result 
                    ? '4px solid #4caf50' 
                    : '4px solid #9e9e9e'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">
                  Item {result.index + 1}
                </Typography>
                {result.error ? (
                  <Chip label="Error" color="error" size="small" />
                ) : (
                  <Chip 
                    label={result.result ? "Matched" : "Not Matched"} 
                    color={result.result ? "success" : "default"} 
                    size="small"
                  />
                )}
              </Box>
              
              {result.error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {result.error}
                </Alert>
              )}
              
              <Box sx={{ mt: 1, maxHeight: 100, overflow: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                  {JSON.stringify(result.item, null, 2)}
                </pre>
              </Box>
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConditionTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Map Component Help</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            How to Use the Map Component
          </Typography>
          
          <Typography variant="body1" paragraph>
            The Map component iterates over an array of data and renders child components for each item.
          </Typography>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Data Source Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                1. <strong>Data Path</strong>: Specify the path to the array in your context data
              </Typography>
              <Typography paragraph>
                2. <strong>String Processing</strong>: Process string data into arrays (split by comma, lines, or parse JSON)
              </Typography>
              <Typography paragraph>
                3. <strong>Transform Code</strong>: Write JavaScript to transform your data before mapping
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Creating Child Templates</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Add child components that will be rendered for each item in your array data.
              </Typography>
              <Typography paragraph>
                Use <code>{'{{propertyName}}'}</code> in text fields to insert dynamic data from each item.
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Filtering Data</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Use the Filter Condition to show only certain items based on their properties.
              </Typography>
              <Typography paragraph>
                Examples:
              </Typography>
              <ul>
                <li><code>item.status === 'active'</code> - Show only active items</li>
                <li><code>item.price > 100</code> - Show items with price greater than 100</li>
                <li><code>item.name.includes('test')</code> - Show items with 'test' in their name</li>
              </ul>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Handling Nested Data</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                For nested arrays, use the special notation <code>arrayPath[].fieldPath</code> to extract specific fields.
              </Typography>
              <Typography paragraph>
                Example: <code>abilities[].ability.name</code> will extract the name field from each ability's object.
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`// For this data structure:
{
  "abilities": [
    {
      "ability": {
        "name": "limber",
        "url": "..."
      },
      "is_hidden": false
    },
    {
      "ability": {
        "name": "imposter",
        "url": "..."
      },
      "is_hidden": true
    }
  ]
}

// Use data path: abilities[].ability.name
// Result: ["limber", "imposter"]
`}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Box sx={{ mt: 3, bgcolor: '#f5f9ff', borderRadius: 1, p: 2, border: '1px solid #e3f2fd' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Example: Working with a Pokémon API Response
            </Typography>
            
            <Typography variant="body2" paragraph>
              For this JSON response:
            </Typography>
            
            <Paper
              variant="outlined"
              sx={{ 
                p: 2, 
                backgroundColor: '#002b36', 
                color: '#93a1a1',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                maxHeight: 250,
                overflow: 'auto'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`{
  "abilities": [
    {
      "ability": {
        "name": "limber",
        "url": "https://pokeapi.co/api/v2/ability/7/"
      },
      "is_hidden": false,
      "slot": 1
    },
    {
      "ability": {
        "name": "imposter",
        "url": "https://pokeapi.co/api/v2/ability/150/"
      },
      "is_hidden": true,
      "slot": 3
    }
  ],
  "name": "ditto",
  "rank": "200"
}`}
              </pre>
            </Paper>
            
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2">Configuration steps:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="1" color="primary" size="small" />
                <Typography variant="body2">
                  Set API URL to <code>https://pokeapi.co/api/v2/pokemon/ditto</code>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="2" color="primary" size="small" />
                <Typography variant="body2">
                  Set Data Path to <code>abilities[].ability.name</code>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="3" color="primary" size="small" />
                <Typography variant="body2">
                  Result will be <code>["limber", "imposter"]</code>
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Add the button preview to the main return function, before the SpeedDial */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              How to Render Buttons with the Data:
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                To render buttons for each value, add a Button component as a child of this MapComponent:
              </Typography>
              <Box sx={{ p: 1, bgcolor: '#eeeeee', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`// Step 1: Click the "+" button to add a child component
// Step 2: Select "Button" from the menu
// Step 3: The Button will automatically display each value`}
                </Typography>
              </Box>
            </Box>
            
            {renderItemPreview()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 