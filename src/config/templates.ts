import type { TechStack } from '../types';

export const techStacks: Record<string, TechStack> = {
  'react-ts': {
    name: 'React + TypeScript',
    template: 'react-ts',
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@mui/material': '^5.15.0',
      '@emotion/react': '^11.11.0',
      '@emotion/styled': '^11.11.0',
      'react-router-dom': '^6.21.0'
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'typescript': '^5.0.0',
      'vite': '^5.0.0',
      '@vitejs/plugin-react': '^4.2.0'
    }
  },
  'next-ts': {
    name: 'Next.js + TypeScript',
    template: 'next-ts',
    dependencies: {
      'next': '^14.0.0',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@mui/material': '^5.15.0',
      '@emotion/react': '^11.11.0',
      '@emotion/styled': '^11.11.0'
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/node': '^20.0.0',
      'typescript': '^5.0.0'
    }
  }
}; 