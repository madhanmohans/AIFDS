import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tab,
  Tabs,
  IconButton,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import { usePlayground } from '../../context/PlaygroundContext';
import { exportPlayground, generateReactComponent, generateComponentForTechStack } from '../../services/codeGenerator';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import type { TechStack } from '../../types/playground';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`code-tabpanel-${index}`}
      aria-labelledby={`code-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 1, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface CodeExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CodeExportDialog({ open, onClose }: CodeExportDialogProps) {
  const [tabValue, setTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { state, dispatch } = usePlayground();
  const [snackbarMessage, setSnackbarMessage] = useState('Code copied to clipboard!');

  // Generate code from components
  const { components, techStack } = state;
  const { code: exportedCode, imports, css, fileSuffix } = exportPlayground(components, techStack);
  
  // For React component code
  const { code: componentCode, css: componentCss } = generateComponentForTechStack(
    components, 
    techStack, 
    'MyComponent'
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCopyCode = () => {
    let codeToCopy = '';
    
    switch(tabValue) {
      case 0: // Component code
        codeToCopy = exportedCode;
        break;
      case 1: // Full component
        codeToCopy = componentCode;
        break;
      case 2: // CSS
        codeToCopy = css;
        break;
      case 3: // Imports
        codeToCopy = imports.join('\n');
        break;
      default:
        codeToCopy = exportedCode;
    }
    
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setSnackbarMessage('Code copied to clipboard!');
      setSnackbarOpen(true);
    });
  };

  const handleDownloadCode = () => {
    let codeToCopy = '';
    let fileName = '';
    
    switch(tabValue) {
      case 0: // Component code
        codeToCopy = exportedCode;
        fileName = `component.${fileSuffix}`;
        break;
      case 1: // Full component
        codeToCopy = componentCode;
        fileName = `MyComponent.${fileSuffix}`;
        break;
      case 2: // CSS
        codeToCopy = css;
        fileName = 'component.css';
        break;
      case 3: // Imports
        codeToCopy = imports.join('\n');
        fileName = 'imports.js';
        break;
      default:
        codeToCopy = exportedCode;
        fileName = `component.${fileSuffix}`;
    }
    
    const blob = new Blob([codeToCopy], { type: 'text/plain' });
    const href = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    
    setSnackbarMessage('File downloaded!');
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  const handleTechStackChange = (event: SelectChangeEvent<string>) => {
    const newTechStack = event.target.value as TechStack;
    dispatch({ type: 'SET_TECH_STACK', payload: newTechStack });
    
    setSnackbarMessage(`Tech stack changed to ${newTechStack}`);
    setSnackbarOpen(true);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        fullWidth 
        maxWidth="lg"
        aria-labelledby="code-export-dialog-title"
        PaperProps={{
          sx: { 
            height: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle id="code-export-dialog-title" sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CodeIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Generated Code
            </Typography>
            
            {/* Tech Stack Selector */}
            <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
              <InputLabel id="tech-stack-select-label">Tech Stack</InputLabel>
              <Select
                labelId="tech-stack-select-label"
                id="tech-stack-select"
                value={techStack}
                label="Tech Stack"
                onChange={handleTechStackChange}
                data-test-id="tech-stack-select"
              >
                <MenuItem value="react">React</MenuItem>
                <MenuItem value="react-typescript">React (TypeScript)</MenuItem>
                <MenuItem value="vue">Vue</MenuItem>
                <MenuItem value="angular">Angular</MenuItem>
              </Select>
            </FormControl>
            
            <Box>
              <IconButton 
                onClick={handleCopyCode} 
                title="Copy Code"
                color="primary"
                data-test-id="copy-code-button"
              >
                <ContentCopyIcon />
              </IconButton>
              <IconButton 
                onClick={handleDownloadCode} 
                title="Download Code"
                color="primary"
                data-test-id="download-code-button"
              >
                <DownloadIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="code export tabs"
            sx={{ mt: 1 }}
          >
            <Tab label={`Component (${fileSuffix})`} id="code-tab-0" />
            <Tab label={`Full Component (${fileSuffix})`} id="code-tab-1" />
            <Tab label="CSS" id="code-tab-2" />
            <Tab label="Imports" id="code-tab-3" />
          </Tabs>
        </DialogTitle>

        <DialogContent dividers sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          <TabPanel value={tabValue} index={0}>
            <SyntaxHighlighter 
              language={fileSuffix === 'vue' ? 'html' : 'jsx'} 
              style={atomOneDark}
              customStyle={{ 
                height: '100%', 
                margin: 0,
                borderRadius: 0,
                fontSize: '14px',
              }}
            >
              {exportedCode}
            </SyntaxHighlighter>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <SyntaxHighlighter 
              language={fileSuffix === 'vue' ? 'html' : 'jsx'} 
              style={atomOneDark}
              customStyle={{ 
                height: '100%', 
                margin: 0,
                borderRadius: 0,
                fontSize: '14px',
              }}
            >
              {componentCode}
            </SyntaxHighlighter>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <SyntaxHighlighter 
              language="css" 
              style={atomOneDark}
              customStyle={{ 
                height: '100%', 
                margin: 0,
                borderRadius: 0,
                fontSize: '14px',
              }}
            >
              {css}
            </SyntaxHighlighter>
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <SyntaxHighlighter 
              language="jsx" 
              style={atomOneDark}
              customStyle={{ 
                height: '100%', 
                margin: 0,
                borderRadius: 0,
                fontSize: '14px',
              }}
            >
              {imports.join('\n')}
            </SyntaxHighlighter>
          </TabPanel>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
} 