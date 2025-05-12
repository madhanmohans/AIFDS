import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Paper,
  Divider,
  Button,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { usePlayground } from '../../context/PlaygroundContext';
import ColorizeIcon from '@mui/icons-material/Colorize';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { ComponentConfig } from '../../types/playground';

interface PropertyEditorProps {
  component: ComponentConfig;
}

export default function PropertyEditor({ component }: PropertyEditorProps) {
  const { dispatch } = usePlayground();
  const [properties, setProperties] = useState<Record<string, any>>({});

  // Initialize properties from component
  useEffect(() => {
    if (component) {
      setProperties({ ...component.props });
    }
  }, [component]);

  // Handle change for any property
  const handlePropertyChange = (name: string, value: any) => {
    setProperties(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply the property changes to the component
  const applyChanges = () => {
    dispatch({
      type: 'UPDATE_COMPONENT',
      payload: {
        id: component.id,
        props: properties
      }
    });
  };

  // Reset to the component's current props
  const resetChanges = () => {
    setProperties({ ...component.props });
  };

  // Auto-apply changes when properties are updated
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyChanges();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [properties]);

  // Generate the appropriate input field based on property type
  const renderPropertyInput = (name: string, value: any) => {
    // Determine the property type based on the value and component type
    const getPropertyType = () => {
      if (typeof value === 'number') return 'number';
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'string') {
        // Check for color
        if (name.toLowerCase().includes('color') || value.match(/^#[0-9A-F]{6}$/i) || value.match(/^rgba?\(/)) {
          return 'color';
        }
        // Check for variants, aligns, etc.
        if (name === 'variant' || name === 'align' || name === 'justify' || name === 'direction' || name === 'objectFit') {
          return 'select';
        }
      }
      return 'text';
    };

    const propertyType = getPropertyType();

    // Get options for select inputs based on property name
    const getSelectOptions = (propName: string) => {
      switch (propName) {
        case 'variant':
          if (component.type === 'Button') {
            return ['text', 'outlined', 'contained'];
          } else if (component.type === 'Typography') {
            return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'overline'];
          }
          return [];
        case 'align':
          return ['left', 'center', 'right', 'justify'];
        case 'justify':
          return ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];
        case 'direction':
          return ['row', 'column', 'row-reverse', 'column-reverse'];
        case 'objectFit':
          return ['contain', 'cover', 'fill', 'none', 'scale-down'];
        default:
          return [];
      }
    };

    // Render the appropriate input
    switch (propertyType) {
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={name}
            value={value}
            onChange={(e) => handlePropertyChange(name, Number(e.target.value))}
            size="small"
            margin="dense"
            InputProps={{
              endAdornment: name.toLowerCase().includes('height') || name.toLowerCase().includes('width') ? (
                <InputAdornment position="end">px</InputAdornment>
              ) : null
            }}
          />
        );
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={value}
                onChange={(e) => handlePropertyChange(name, e.target.checked)}
                size="small"
              />
            }
            label={name}
          />
        );
      case 'color':
        return (
          <TextField
            fullWidth
            label={name}
            value={value}
            onChange={(e) => handlePropertyChange(name, e.target.value)}
            size="small"
            margin="dense"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Pick color">
                    <IconButton size="small" edge="end">
                      <input
                        type="color"
                        value={value || '#ffffff'}
                        onChange={(e) => handlePropertyChange(name, e.target.value)}
                        style={{
                          opacity: 0,
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer'
                        }}
                      />
                      <ColorizeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />
        );
      case 'select':
        const options = getSelectOptions(name);
        return (
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel id={`${name}-label`}>{name}</InputLabel>
            <Select
              labelId={`${name}-label`}
              value={value || ''}
              label={name}
              onChange={(e) => handlePropertyChange(name, e.target.value)}
            >
              {options.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      default:
        return (
          <TextField
            fullWidth
            label={name}
            value={value || ''}
            onChange={(e) => handlePropertyChange(name, e.target.value)}
            size="small"
            margin="dense"
          />
        );
    }
  };

  if (!component) {
    return (
      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Select a component to edit its properties
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="text.primary">
          {component.type} Properties
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Reset changes">
            <IconButton size="small" onClick={resetChanges}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Apply changes">
            <IconButton size="small" color="primary" onClick={applyChanges}>
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Component ID
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
          {component.id}
        </Typography>
      </Box>

      <Box>
        {Object.entries(properties).map(([name, value]) => (
          <Box key={name} sx={{ mb: 2 }}>
            {renderPropertyInput(name, value)}
          </Box>
        ))}
      </Box>

      {/* Add new property button */}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            // Open dialog or add a default property
            const propName = prompt('Enter property name:');
            if (propName && propName.trim()) {
              handlePropertyChange(propName.trim(), '');
            }
          }}
        >
          Add Property
        </Button>
      </Box>
    </Paper>
  );
} 