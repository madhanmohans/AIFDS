import React from 'react';
import {
  Box,
  Chip,
  Button,
  Typography,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { ComponentConfig } from '../../types/playground';

interface TagListProps {
  component: ComponentConfig;
  parentContext?: any;
}

// Custom styled tag buttons
const TagButton = styled(Button)(({ theme, color = 'primary', shape = 'rounded' }) => ({
  margin: theme.spacing(0.5),
  borderRadius: shape === 'rounded' ? '16px' : '4px',
  textTransform: 'none',
  minWidth: 'unset',
  fontWeight: 500,
  padding: theme.spacing(0.5, 1.5),
}));

export const TagList: React.FC<TagListProps> = ({ component, parentContext }) => {
  // Get tags from props or context
  const getTagsString = (): string => {
    // If specific tags prop is provided, use it
    if (component.props.tags) {
      return component.props.tags;
    }
    
    // Check if there's context data with a tags property
    if (parentContext && parentContext.tags) {
      return parentContext.tags;
    }
    
    // Check if there's context data with a property that matches the dataPath
    if (parentContext && component.props.dataPath) {
      const path = component.props.dataPath;
      const value = path.split('.').reduce((obj, key) => obj && obj[key], parentContext);
      if (typeof value === 'string') {
        return value;
      }
    }
    
    // Default empty string if no tags found
    return '';
  };
  
  // Get condition (if any) for filtering tags
  const condition = component.props.condition || '';
  
  // Get separator (default to comma)
  const separator = component.props.separator || ',';
  
  // Parse the tags string into an array
  const tagsString = getTagsString();
  let tags: string[] = tagsString ? tagsString.split(separator).map(tag => tag.trim()) : [];
  
  // Apply condition if provided
  if (condition) {
    try {
      // Create a filter function
      const filterFn = new Function('tag', `return ${condition}`);
      tags = tags.filter(tag => {
        try {
          return filterFn(tag);
        } catch (e) {
          return true; // If condition fails, include tag by default
        }
      });
    } catch (e) {
      console.error('Invalid condition:', e);
    }
  }
  
  // Get display type (chip or button)
  const displayType = component.props.displayType || 'chip';
  
  // Get color, variant, and size props
  const color = component.props.color || 'primary';
  const variant = component.props.variant || 'contained';
  const size = component.props.size || 'small';
  const shape = component.props.shape || 'rounded';
  
  // Render empty state if no tags
  if (!tags.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {component.props.emptyText || 'No tags to display'}
      </Typography>
    );
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: 0.5,
      justifyContent: component.props.justifyContent || 'flex-start',
      '& > *': { m: 0.5 }
    }}>
      {tags.map((tag, index) => (
        displayType === 'chip' ? (
          <Chip
            key={index}
            label={tag}
            color={color as any}
            variant={variant === 'contained' ? 'filled' : 'outlined'}
            size={size as any}
            sx={{
              borderRadius: shape === 'rounded' ? '16px' : '4px',
              ...(component.props.tagStyle || {})
            }}
          />
        ) : (
          <TagButton
            key={index}
            variant={variant as any}
            color={color as any}
            size={size as any}
            shape={shape}
            sx={component.props.tagStyle || {}}
          >
            {tag}
          </TagButton>
        )
      ))}
    </Box>
  );
};

// Render preview in ComponentRenderer
export const renderTagListPreview = (component: ComponentConfig) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 1, 
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: '1px dashed #ccc'
      }}
    >
      <TagList component={component} />
    </Paper>
  );
}; 