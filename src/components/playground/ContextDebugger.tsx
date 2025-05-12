import React from 'react';
import { Box, Typography, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { ComponentConfig } from '../../types/playground';

interface ContextDebuggerProps {
  component: ComponentConfig;
}

/**
 * Component for debugging context propagation
 * Shows the context data available for the component and its children
 */
const ContextDebugger: React.FC<ContextDebuggerProps> = ({ component }) => {
  const hasContext = !!component.contextData;
  const contextPath = component.props?.contextPath;
  
  const renderChildrenDebug = () => {
    if (!component.children || component.children.length === 0) return null;
    
    return (
      <Box sx={{ pl: 2, borderLeft: '1px dashed #ccc', mt: 1 }}>
        <Typography variant="caption" color="text.secondary">Children:</Typography>
        {component.children.map((child, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Chip
              size="small"
              label={`${child.type} (${child.props?.contextPath || 'no path'})`}
              color={child.contextData ? "primary" : "default"}
              variant={child.contextData ? "filled" : "outlined"}
            />
            <Box sx={{ fontSize: '10px', ml: 1, color: 'text.secondary' }}>
              {child.contextData ? '✅ Has context' : '❌ No context'}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };
  
  return (
    <Accordion sx={{ mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            {component.type} Context
          </Typography>
          <Chip 
            label={hasContext ? "Has Context" : "No Context"} 
            size="small"
            color={hasContext ? "success" : "error"}
          />
          {contextPath && (
            <Chip label={`Path: ${contextPath}`} size="small" color="primary" variant="outlined" />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
            Context Data:
          </Typography>
          {hasContext ? (
            <Box 
              component="pre" 
              sx={{ 
                p: 1, 
                bgcolor: 'rgba(0,0,0,0.03)', 
                borderRadius: 1,
                fontSize: '10px',
                maxHeight: 150,
                overflow: 'auto'
              }}
            >
              {JSON.stringify(component.contextData, null, 2)}
            </Box>
          ) : (
            <Typography variant="caption" color="error">No context data available</Typography>
          )}
        </Box>
        
        {renderChildrenDebug()}
      </AccordionDetails>
    </Accordion>
  );
};

export default ContextDebugger; 