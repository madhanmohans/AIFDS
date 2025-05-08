import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Grid,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CodeIcon from '@mui/icons-material/Code';
import AddIcon from '@mui/icons-material/Add';
import ReactIcon from '@mui/icons-material/AllInclusive';
import VueIcon from '@mui/icons-material/ViewQuilt';
import AngularIcon from '@mui/icons-material/WebAsset';

// Tech stack options
const frontendOptions = [
  { name: 'React', icon: <ReactIcon />, description: 'A JavaScript library for building user interfaces' },
  { name: 'Vue', icon: <VueIcon />, description: 'Progressive JavaScript framework for building UIs' },
  { name: 'Angular', icon: <AngularIcon />, description: 'Platform for building mobile & desktop web applications' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  const handleTechSelect = (tech: string) => {
    setSelectedTech(tech);
  };

  const handleContinue = () => {
    // Store the selected tech stack in localStorage
    localStorage.setItem('techStack', JSON.stringify({ frontend: selectedTech }));
    navigate('/create');
  };

  const handleSkipToPlayground = () => {
    navigate('/playground');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Low-Code Development Platform
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          Build applications quickly by dragging and dropping components
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Select Your Framework
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            {frontendOptions.map((tech) => (
              <Grid item xs={12} md={4} key={tech.name}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedTech === tech.name ? '2px solid #1976d2' : 'none',
                    bgcolor: selectedTech === tech.name ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                  }}
                  onClick={() => handleTechSelect(tech.name)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {tech.icon}
                      <Typography variant="h6" sx={{ ml: 1 }}>{tech.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {tech.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1">Selected Framework:</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {selectedTech && <Chip label={selectedTech} color="primary" />}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined"
              size="large" 
              startIcon={<CodeIcon />}
              onClick={handleSkipToPlayground}
            >
              Skip to Playground
            </Button>
            <Button 
              variant="contained" 
              size="large" 
              startIcon={<AddIcon />}
              disabled={!selectedTech}
              onClick={handleContinue}
            >
              Continue to Project Setup
            </Button>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 4 }}>
        <Card sx={{ flex: '1 1 300px', maxWidth: 400 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Projects
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your previously created projects
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small">View All Projects</Button>
          </CardActions>
        </Card>

        <Card sx={{ flex: '1 1 300px', maxWidth: 400 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start with pre-built application templates
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small">Browse Templates</Button>
          </CardActions>
        </Card>
      </Box>
    </Container>
  );
} 