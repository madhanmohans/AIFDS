import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Tooltip,
  Grid,
} from '@mui/material';
import { availableComponents } from '../../config/components';
import { usePlayground } from '../../context/PlaygroundContext';

interface ComponentsPanelProps {
  searchText?: string;
}

export default function ComponentsPanel({ searchText = '' }: ComponentsPanelProps) {
  const { state, dispatch } = usePlayground();
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);

  // Group components by category
  const groupedComponents = availableComponents.reduce((acc, component) => {
    const category = component.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(component);
    return acc;
  }, {} as Record<string, typeof availableComponents>);

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
      case 'TagList': return '#f39c12';
      default: return '#6caba8';
    }
  };

  // Get category label and color
  const getCategoryInfo = (category: string) => {
    switch(category) {
      case 'layout':
        return { label: 'Layout', color: '#7986cb' };
      case 'content':
        return { label: 'Content', color: '#e6a456' };
      case 'input':
        return { label: 'Input', color: '#6d597a' };
      case 'display':
        return { label: 'Display', color: '#6caba8' };
      case 'container':
        return { label: 'Container', color: '#b7bf96' };
      case 'data':
        return { label: 'Data', color: '#8e44ad' };
      default:
        return { label: category, color: '#6caba8' };
    }
  };

  // Handle clicking on a component
  const handleComponentClick = (component: any) => {
    console.log('Component clicked:', component.type);
    dispatch({ 
      type: 'SELECT_AVAILABLE_COMPONENT',
      payload: component.id 
    });
  };

  // Filter components based on search text if provided
  const filteredCategories = searchText
    ? Object.entries(groupedComponents)
        .map(([category, components]) => ({
          category,
          components: components.filter(comp => 
            comp.type.toLowerCase().includes(searchText.toLowerCase()) ||
            comp.description.toLowerCase().includes(searchText.toLowerCase()))
        }))
        .filter(group => group.components.length > 0)
    : Object.entries(groupedComponents)
        .map(([category, components]) => ({ category, components }));

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
      }}
      data-test-id="components-panel"
    >
      <Typography variant="h6" align="center" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
        Components
      </Typography>
      
      {filteredCategories.length === 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100px' 
        }}>
          <Typography variant="body2" color="text.secondary">
            No components found matching '{searchText}'
          </Typography>
        </Box>
      )}
      
      {filteredCategories.map(({ category, components }) => (
        <Box key={category} sx={{ mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 1.5, 
            pb: 0.5,
            borderBottom: `2px solid ${getCategoryInfo(category).color}`
          }}>
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                bgcolor: getCategoryInfo(category).color,
                mr: 1
              }} 
            />
            <Typography variant="subtitle2" fontWeight="bold">
              {getCategoryInfo(category).label}
            </Typography>
          </Box>
          
          <Grid container spacing={1}>
            {components.map((component) => (
              <Grid item xs={12} sm={6} key={component.id}>
                <Tooltip 
                  title={component.description} 
                  placement="right"
                  arrow
                >
                  <Card
                    draggable
                    onClick={() => handleComponentClick(component)}
                    onDragStart={(e) => {
                      setDraggedComponent(component.id);
                      const componentData = {
                        type: component.type,
                        id: component.id,
                        defaultProps: component.defaultProps
                      };
                      console.log('Drag start on component:', component.type);
                      console.log('Setting component data for transfer:', componentData);
                      
                      e.dataTransfer.setData('component', JSON.stringify(componentData));
                      e.dataTransfer.effectAllowed = 'copy';
                      document.body.style.cursor = 'grabbing';
                      
                      // Highlight selected component for clear visual feedback
                      dispatch({ 
                        type: 'SELECT_AVAILABLE_COMPONENT', 
                        payload: component.id 
                      });
                    }}
                    onDragEnd={() => {
                      console.log('Drag ended for component:', draggedComponent);
                      document.body.style.cursor = 'default';
                      setDraggedComponent(null);
                      
                      // Clear selection after a short delay
                      setTimeout(() => {
                        // Don't clear selection to keep properties panel visible
                        // dispatch({ 
                        //   type: 'SELECT_AVAILABLE_COMPONENT', 
                        //   payload: null 
                        // });
                      }, 300);
                    }}
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderLeft: `4px solid ${getComponentColor(component.type)}`,
                      backgroundColor: state.selectedAvailableComponent === component.id ? 'rgba(108, 171, 168, 0.1)' : 'white',
                      boxShadow: state.selectedAvailableComponent === component.id ? '0 0 0 1px #6caba8' : 'none',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      },
                    }}
                    data-test-id={`component-card-${component.id}`}
                    data-component-type={component.type}
                    data-component-id={component.id}
                  >
                    <CardContent sx={{ py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 16, 
                        height: 16, 
                        bgcolor: getComponentColor(component.type), 
                        borderRadius: '50%',
                        flexShrink: 0
                      }} />
                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Typography fontWeight="medium" noWrap>
                          {component.type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {component.description.slice(0, 30)}{component.description.length > 30 ? '...' : ''}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Paper>
  );
} 