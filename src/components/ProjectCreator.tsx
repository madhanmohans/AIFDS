import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Divider,
  Card,
  CardContent,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';

const steps = ['Project Details', 'UI Components'];

// UI component types that will be available in the playground
const uiComponentTypes = [
  'Layout Components',
  'Navigation Components',
  'Input Components',
  'Display Components',
  'Feedback Components'
];

// Common frontend features
const frontendFeatures = [
  'Responsive Design',
  'Dark/Light Theme',
  'Animations',
  'Form Validation',
  'State Management',
  'Routing',
  'Authentication UI',
  'Data Visualization'
];

export default function ProjectCreator() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  useEffect(() => {
    // Load selected framework from localStorage
    const savedTechStack = localStorage.getItem('techStack');
    if (savedTechStack) {
      const techData = JSON.parse(savedTechStack);
      setSelectedFramework(techData.frontend);
    }
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleFeatureToggle = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const handleComponentToggle = (component: string) => {
    if (selectedComponents.includes(component)) {
      setSelectedComponents(selectedComponents.filter(c => c !== component));
    } else {
      setSelectedComponents([...selectedComponents, component]);
    }
  };

  const handleCreateProject = () => {
    // Create project with collected information
    const projectData = {
      name: projectName,
      description: projectDescription,
      framework: selectedFramework,
      features: selectedFeatures,
      components: selectedComponents
    };
    
    // Store project data in localStorage
    localStorage.setItem('currentProject', JSON.stringify(projectData));
    
    // Navigate to playground
    navigate('/playground');
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Project Information
            </Typography>
            
            {selectedFramework && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Framework:
                </Typography>
                <Chip label={selectedFramework} color="primary" />
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Project Name"
              margin="normal"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            
            <TextField
              fullWidth
              label="Project Description"
              margin="normal"
              multiline
              rows={4}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              UI Components & Features
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Features:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {frontendFeatures.map(feature => (
                  <Chip
                    key={feature}
                    label={feature}
                    onClick={() => handleFeatureToggle(feature)}
                    color={selectedFeatures.includes(feature) ? "primary" : "default"}
                    sx={{ cursor: 'pointer' }}
                    icon={selectedFeatures.includes(feature) ? <CheckIcon /> : undefined}
                  />
                ))}
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Component Categories:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {uiComponentTypes.map(component => (
                  <Chip
                    key={component}
                    label={component}
                    onClick={() => handleComponentToggle(component)}
                    color={selectedComponents.includes(component) ? "primary" : "default"}
                    sx={{ cursor: 'pointer' }}
                    icon={selectedComponents.includes(component) ? <CheckIcon /> : undefined}
                  />
                ))}
              </Box>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Project Summary
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2">Project Details</Typography>
                <Typography variant="body2">Name: {projectName}</Typography>
                <Typography variant="body2">Description: {projectDescription}</Typography>
                <Typography variant="body2">Framework: {selectedFramework}</Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Selected Features ({selectedFeatures.length})</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {selectedFeatures.map(feature => (
                    <Chip key={feature} label={feature} size="small" />
                  ))}
                </Box>
                
                <Typography variant="subtitle2">Component Categories ({selectedComponents.length})</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedComponents.map(component => (
                    <Chip key={component} label={component} size="small" />
                  ))}
                </Box>
              </Paper>
            </Box>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Project Setup
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure your project settings before building in the playground
        </Typography>
      </Box>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {getStepContent(activeStep)}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        
        {activeStep === steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleCreateProject}
            disabled={!projectName}
          >
            Create Project & Go to Playground
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleNext}
            endIcon={<ArrowForwardIcon />}
            disabled={activeStep === 0 && !projectName}
          >
            Next
          </Button>
        )}
      </Box>
    </Container>
  );
} 