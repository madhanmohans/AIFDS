import type { PlaygroundComponent } from '../types';

export class CodeGenerator {
  private static generateComponentCode(component: PlaygroundComponent): string {
    const props = Object.entries(component.props)
      .filter(([key]) => key !== 'children')
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        }
        if (typeof value === 'object') {
          return `${key}={${JSON.stringify(value)}}`;
        }
        return `${key}={${value}}`;
      })
      .join(' ');

    if (component.children?.length) {
      const childrenCode = component.children
        .map((child) => this.generateComponentCode(child))
        .join('\n');
      return `<${component.type} ${props}>\n${childrenCode}\n</${component.type}>`;
    }

    return `<${component.type} ${props} />`;
  }

  private static generateComponentFile(component: PlaygroundComponent): string {
    return `import React from 'react';
import { ${component.type} } from '@mui/material';

export default function GeneratedComponent() {
  return (
    ${this.generateComponentCode(component)}
  );
}`;
  }

  private static generatePackageJson(): string {
    return `{
  "name": "generated-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/material": "^5.13.0",
    "@mui/icons-material": "^5.11.16",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`;
  }

  private static generateTsConfig(): string {
    return `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}`;
  }

  private static generateIndexHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Generated React Application" />
    <title>Generated App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;
  }

  private static generateIndexTsx(): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
  }

  private static generateAppTsx(component: PlaygroundComponent): string {
    return `import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import GeneratedComponent from './components/GeneratedComponent';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GeneratedComponent />
    </ThemeProvider>
  );
}

export default App;`;
  }

  public static generateProject(component: PlaygroundComponent): Record<string, string> {
    return {
      'package.json': this.generatePackageJson(),
      'tsconfig.json': this.generateTsConfig(),
      'public/index.html': this.generateIndexHtml(),
      'src/index.tsx': this.generateIndexTsx(),
      'src/App.tsx': this.generateAppTsx(component),
      'src/components/GeneratedComponent.tsx': this.generateComponentFile(component),
    };
  }
} 