import { availableComponents } from '../config/components';
import type { ComponentConfig } from '../types/playground';
import type { TechStack } from '../types/playground';

/**
 * Code Generator Service
 * This service converts the visual component tree to React code
 */

// Helper to get unique imports
const getUniqueImports = (components: ComponentConfig[]): string[] => {
  const imports = new Set<string>();
  
  const processComponent = (component: ComponentConfig) => {
    const componentDef = availableComponents.find(c => c.type === component.type);
    if (componentDef?.codeTemplate.import) {
      imports.add(componentDef.codeTemplate.import);
    }
    
    // Process children recursively
    if (component.children && component.children.length > 0) {
      component.children.forEach(child => processComponent(child));
    }
  };
  
  components.forEach(component => processComponent(component));
  
  return Array.from(imports);
};

// Generate imports based on used components
const generateImports = (components: ComponentConfig[], techStack: TechStack): string => {
  const importMap: Record<string, Set<string>> = {};
  
  // Helper to extract imports from a component
  const extractImportsFromComponent = (component: ComponentConfig) => {
    const componentDef = availableComponents.find(c => c.type === component.type);
    if (!componentDef) return;
    
    // Get the import statement for this component
    const importStatement = componentDef.codeTemplate.import;
    if (!importStatement) return;
    
    // Parse the import statement
    const match = importStatement.match(/import\s+{([^}]+)}\s+from\s+["']([^"']+)["']/);
    if (!match) return;
    
    const [, importedComponents, packageName] = match;
    
    // Add the imported components to the import map
    if (!importMap[packageName]) {
      importMap[packageName] = new Set();
    }
    
    importedComponents.split(',').forEach(comp => {
      importMap[packageName].add(comp.trim());
    });
    
    // Recursively process children
    if (component.children && component.children.length > 0) {
      component.children.forEach(extractImportsFromComponent);
    }
  };
  
  // Process all top-level components
  components.forEach(extractImportsFromComponent);
  
  // Check if we have API calls or transforms that need React hooks
  const needsApiHooks = components.some(component => {
    if (component.apiConfig?.enabled) return true;
    if (component.contextTransform) return true;
    
    // Recursively check children
    const checkChildren = (children: ComponentConfig[]): boolean => {
      return children.some(child => {
        if (child.apiConfig?.enabled) return true;
        if (child.contextTransform) return true;
        return child.children ? checkChildren(child.children) : false;
      });
    };
    
    return component.children ? checkChildren(component.children) : false;
  });
  
  // Add React imports
  if (needsApiHooks) {
    if (!importMap['react']) {
      importMap['react'] = new Set();
    }
    
    // Add necessary hooks for API calls and transformations
    importMap['react'].add('useState');
    importMap['react'].add('useEffect');
    importMap['react'].add('useMemo');
  } else {
    // Always add React import
    importMap['react'] = new Set(['React']);
  }
  
  // Generate import statements
  let imports = '';
  Object.entries(importMap).forEach(([packageName, components]) => {
    imports += `import { ${Array.from(components).join(', ')} } from '${packageName}';\n`;
  });
  
  return imports;
};

// Generate code for a single component
const generateComponentCode = (component: ComponentConfig, indent = 0): string => {
  const indentStr = '  '.repeat(indent);
  
  if (!component) return `${indentStr}{/* No component data */}`;
  
  // Handle MapComponent differently to use proper React .map()
  if (component.type === 'MapComponent') {
    const dataPath = component.props.dataPath || 'items';
    const condition = component.props.condition;
    
    // Start with data extraction logic
    let code = `${indentStr}{/* Map over ${dataPath} */}\n`;
    code += `${indentStr}{(() => {\n`;
    code += `${indentStr}  // Extract data from the specified path\n`;
    code += `${indentStr}  const extractData = (data, path) => {\n`;
    code += `${indentStr}    if (!path || path === '') return data;\n`;
    code += `${indentStr}    return path.split('.').reduce((obj, key) => obj && obj[key] !== undefined ? obj[key] : null, data);\n`;
    code += `${indentStr}  };\n\n`;
    code += `${indentStr}  const itemsData = extractData(data, '${dataPath}') || [];\n`;
    
    // Add filter logic if condition exists
    if (condition) {
      code += `${indentStr}  const filteredData = itemsData.filter(item => ${condition});\n\n`;
      code += `${indentStr}  // Return early if no data\n`;
      code += `${indentStr}  if (!filteredData || !filteredData.length) {\n`;
      code += `${indentStr}    return <div>${component.props.emptyText || 'No items to display'}</div>;\n`;
      code += `${indentStr}  }\n\n`;
      code += `${indentStr}  return filteredData.map((item, index) => (\n`;
    } else {
      code += `${indentStr}  // Return early if no data\n`;
      code += `${indentStr}  if (!itemsData || !itemsData.length) {\n`;
      code += `${indentStr}    return <div>${component.props.emptyText || 'No items to display'}</div>;\n`;
      code += `${indentStr}  }\n\n`;
      code += `${indentStr}  return itemsData.map((item, index) => (\n`;
    }
    
    // Generate the mapped component(s)
    code += `${indentStr}    <React.Fragment key={index}>\n`;
    
    if (component.children && component.children.length > 0) {
      component.children.forEach(child => {
        code += generateComponentCode(child, indent + 3);
      });
    }
    
    code += `${indentStr}    </React.Fragment>\n`;
    code += `${indentStr}  ));\n`;
    code += `${indentStr}})()}\n`;
    
    return code;
  }
  
  // Handle other component types
  switch(component.type) {
    case 'Typography': {
      const variant = component.props.variant || 'body1';
      const align = component.props.align || 'left';
      const color = component.props.color || 'inherit';
      const fontSize = component.props.fontSize;
      const fontWeight = component.props.fontWeight;
      const fontStyle = component.props.fontStyle;
      const textDecoration = component.props.textDecoration;
      const letterSpacing = component.props.letterSpacing;
      const lineHeight = component.props.lineHeight;
      const textTransform = component.props.textTransform;
      
      // Format sx prop based on properties - fixed with double braces and proper formatting
      let sx = '{{';
      if (color !== 'inherit') sx += `color: '${color}', `;
      if (fontSize) sx += `fontSize: "${fontSize}px", `;
      if (fontWeight) sx += `fontWeight: '${fontWeight}', `;
      if (fontStyle) sx += `fontStyle: '${fontStyle}', `;
      if (textDecoration) sx += `textDecoration: '${textDecoration}', `;
      if (letterSpacing) sx += `letterSpacing: '${letterSpacing}', `;
      if (lineHeight) sx += `lineHeight: ${lineHeight}, `;
      if (textTransform) sx += `textTransform: '${textTransform}', `;
      // Remove trailing comma if exists
      if (sx.endsWith(', ')) {
        sx = sx.substring(0, sx.length - 2);
      }
      sx += '}}';

      // Handle special case for contextPath
      let content = component.props.children || 'Text Content';
      if (component.props.contextPath) {
        content = `{getPropValue(item, "${component.props.contextPath}", "${content}")}`;
      }
      
      return `${indentStr}<Typography variant="${variant}" align="${align}" sx=${sx}>
${indentStr}  ${content}
${indentStr}</Typography>\n`;
    }

    case 'Button': {
      const variant = component.props.variant || 'contained';
      const color = component.props.color || 'primary';
      const size = component.props.size || 'medium';
      const disabled = component.props.disabled === 'true' || component.props.disabled === true;
      
      // Fix sx prop formatting with double braces
      let sx = '{{';
      if (component.props.borderRadius) sx += `borderRadius: '${component.props.borderRadius}px', `;
      // Remove trailing comma if exists
      if (sx.endsWith(', ')) {
        sx = sx.substring(0, sx.length - 2);
      }
      sx += '}}';
      
      // Handle special case for contextPath in button text
      let content = component.props.children || 'Button';
      if (component.props.contextPath) {
        content = `{getPropValue(item, "${component.props.contextPath}", "${content}")}`;
      }
      
      return `${indentStr}<Button
${indentStr}  variant="${variant}"
${indentStr}  color="${color}"
${indentStr}  size="${size}"
${indentStr}  ${disabled ? 'disabled' : ''}
${indentStr}  sx=${sx}
${indentStr}>
${indentStr}  ${content}
${indentStr}</Button>\n`;
    }

    case 'Card': {
      const maxWidth = component.props.maxWidth || 345;
      const elevation = component.props.elevation || 1;
      const variant = component.props.variant || 'elevation';
      const backgroundColor = component.props.backgroundColor || '#fff';
      const borderRadius = component.props.borderRadius || 4;
      
      let childCode = '';
      if (component.children && component.children.length > 0) {
        component.children.forEach(child => {
          childCode += generateComponentCode(child, indent + 2);
        });
      }
      
      return `${indentStr}<Card
${indentStr}  sx={{
${indentStr}    maxWidth: ${maxWidth},
${indentStr}    backgroundColor: '${backgroundColor}',
${indentStr}    borderRadius: ${borderRadius}
${indentStr}  }}
${indentStr}  elevation={${elevation}}
${indentStr}  variant="${variant}"
${indentStr}>
${indentStr}  <CardContent>
${childCode}${indentStr}  </CardContent>
${indentStr}</Card>\n`;
    }

    case 'Section': {
      const padding = component.props.padding !== undefined ? component.props.padding : 2;
      const margin = component.props.margin !== undefined ? component.props.margin : 1;
      const backgroundColor = component.props.backgroundColor || '#ffffff';
      const borderRadius = component.props.borderRadius || 0;
      const border = component.props.border || 'none';
      
      let childCode = '';
      if (component.children && component.children.length > 0) {
        component.children.forEach(child => {
          childCode += generateComponentCode(child, indent + 1);
        });
      }
      
      return `${indentStr}<Box
${indentStr}  sx={{
${indentStr}    padding: ${padding},
${indentStr}    margin: ${margin},
${indentStr}    backgroundColor: '${backgroundColor}',
${indentStr}    borderRadius: ${borderRadius},
${indentStr}    border: '${border}'
${indentStr}  }}
${indentStr}>
${childCode}${indentStr}</Box>\n`;
    }

    case 'Flexbox': {
      const direction = component.props.flexDirection || 'row';
      const justifyContent = component.props.justifyContent || 'flex-start';
      const alignItems = component.props.alignItems || 'center';
      const flexWrap = component.props.flexWrap || 'nowrap';
      const gap = component.props.gap !== undefined ? component.props.gap : 2;
      const padding = component.props.padding !== undefined ? component.props.padding : 2;
      const backgroundColor = component.props.backgroundColor || 'transparent';
      
      let childCode = '';
      if (component.children && component.children.length > 0) {
        component.children.forEach(child => {
          childCode += generateComponentCode(child, indent + 1);
        });
      }
      
      return `${indentStr}<Box
${indentStr}  sx={{
${indentStr}    display: 'flex',
${indentStr}    flexDirection: '${direction}',
${indentStr}    justifyContent: '${justifyContent}',
${indentStr}    alignItems: '${alignItems}',
${indentStr}    flexWrap: '${flexWrap}',
${indentStr}    gap: ${gap},
${indentStr}    padding: ${padding},
${indentStr}    backgroundColor: '${backgroundColor}'
${indentStr}  }}
${indentStr}>
${childCode}${indentStr}</Box>\n`;
    }

    case 'Stack': {
      const direction = component.props.direction || 'column';
      const spacing = component.props.spacing !== undefined ? component.props.spacing : 2;
      const alignItems = component.props.alignItems || 'flex-start';
      const justifyContent = component.props.justifyContent || 'flex-start';
      const padding = component.props.padding !== undefined ? component.props.padding : 2;
      const backgroundColor = component.props.backgroundColor || 'transparent';
      
      let childCode = '';
      if (component.children && component.children.length > 0) {
        component.children.forEach(child => {
          childCode += generateComponentCode(child, indent + 1);
        });
      }
      
      return `${indentStr}<Stack
${indentStr}  direction="${direction}"
${indentStr}  spacing={${spacing}}
${indentStr}  alignItems="${alignItems}"
${indentStr}  justifyContent="${justifyContent}"
${indentStr}  sx={{
${indentStr}    padding: ${padding},
${indentStr}    backgroundColor: '${backgroundColor}'
${indentStr}  }}
${indentStr}>
${childCode}${indentStr}</Stack>\n`;
    }
      
    case 'Image': {
      const src = component.props.src || 'https://placehold.co/150';
      const alt = component.props.alt || 'Image';
      const width = component.props.width || 150;
      const height = component.props.height || 150;
      const borderRadius = component.props.borderRadius || 4;
      const objectFit = component.props.objectFit || 'cover';
      const border = component.props.border || 'none';
      
      // Handle special case for contextPath in image source
      let srcValue = src;
      if (component.props.contextPath) {
        srcValue = `{getPropValue(item, "${component.props.contextPath}", "${src}")}`; 
      }
      
      return `${indentStr}<Avatar
${indentStr}  src=${srcValue}
${indentStr}  alt="${alt}"
${indentStr}  sx={{
${indentStr}    width: ${width},
${indentStr}    height: ${height},
${indentStr}    borderRadius: '${borderRadius}px',
${indentStr}    objectFit: '${objectFit}',
${indentStr}    border: '${border}'
${indentStr}  }}
${indentStr}/>\n`;
    }

    case 'ScrollableContainer': {
      const height = component.props.height || 200;
      const width = component.props.width || '100%';
      const padding = component.props.padding !== undefined ? component.props.padding : 2;
      const backgroundColor = component.props.backgroundColor || 'transparent';
      const borderRadius = component.props.borderRadius || 1;
      const border = component.props.border || '1px solid #e0e0e0';
      
      let childCode = '';
      if (component.children && component.children.length > 0) {
        component.children.forEach(child => {
          childCode += generateComponentCode(child, indent + 1);
        });
      }
      
      return `${indentStr}<Box
${indentStr}  sx={{
${indentStr}    height: ${height},
${indentStr}    width: '${width}',
${indentStr}    overflow: 'auto',
${indentStr}    padding: ${padding},
${indentStr}    backgroundColor: '${backgroundColor}',
${indentStr}    borderRadius: ${borderRadius},
${indentStr}    border: '${border}'
${indentStr}  }}
${indentStr}>
${childCode}${indentStr}</Box>\n`;
    }

    case 'TagList': {
      const tags = component.props.tags || 'CS,SVT,DMT';
      const separator = component.props.separator || ',';
      const variant = component.props.variant || 'contained';
      const color = component.props.color || 'primary';
      const size = component.props.size || 'small';
      const shape = component.props.shape || 'rounded';
      
      // Handle special case for contextPath
      let tagsValue = tags;
      if (component.props.contextPath) {
        tagsValue = `getPropValue(item, "${component.props.contextPath}", "${tags}")`;
      }
      
      return `${indentStr}{(() => {
${indentStr}  const tagData = ${component.props.contextPath ? tagsValue : `"${tags}"`};
${indentStr}  return (
${indentStr}    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
${indentStr}      {tagData.split('${separator}').map((tag, index) => (
${indentStr}        <Chip
${indentStr}          key={index}
${indentStr}          label={tag.trim()}
${indentStr}          color="${color}"
${indentStr}          variant="${variant === 'contained' ? 'filled' : 'outlined'}"
${indentStr}          size="${size}"
${indentStr}          sx={{ borderRadius: ${shape === 'rounded' ? '"16px"' : '"4px"'} }}
${indentStr}        />
${indentStr}      ))}
${indentStr}    </Box>
${indentStr}  );
${indentStr}})()} \n`;
    }

    default: {
      let childCode = '';
      if (component.children && component.children.length > 0) {
        component.children.forEach(child => {
          childCode += generateComponentCode(child, indent + 1);
        });
      }
      
      return `${indentStr}<div>
${childCode}${indentStr}</div>\n`;
    }
  }
};

// Generate API configuration code for a component
const generateApiConfigCode = (component: ComponentConfig, indent = 0): string => {
  if (!component.apiConfig || !component.apiConfig.url) return '';
  
  const { url, method, headers, payload } = component.apiConfig;
  const headersStr = headers ? JSON.stringify(headers, null, 2) : '{}';
  const payloadStr = payload ? payload : 'undefined';
  
  // Generate a React hook to fetch data
  return `
${' '.repeat(indent)}// API configuration for ${component.type} (ID: ${component.id})
${' '.repeat(indent)}const [${component.id.replace(/-/g, '_')}_data, set${component.id.replace(/-/g, '_')}_Data] = useState(null);
${' '.repeat(indent)}const [${component.id.replace(/-/g, '_')}_loading, set${component.id.replace(/-/g, '_')}_Loading] = useState(false);
${' '.repeat(indent)}const [${component.id.replace(/-/g, '_')}_error, set${component.id.replace(/-/g, '_')}_Error] = useState(null);

${' '.repeat(indent)}// Fetch data on component mount or when dependencies change
${' '.repeat(indent)}useEffect(() => {
${' '.repeat(indent + 2)}const fetchData = async () => {
${' '.repeat(indent + 4)}set${component.id.replace(/-/g, '_')}_Loading(true);
${' '.repeat(indent + 4)}try {
${' '.repeat(indent + 6)}const response = await fetch('${url}', {
${' '.repeat(indent + 8)}method: '${method}',
${' '.repeat(indent + 8)}headers: ${headersStr.replace(/\n/g, `\n${' '.repeat(indent + 8)}`)},
${' '.repeat(indent + 8)}${method !== 'GET' ? `body: ${payloadStr},` : ''}
${' '.repeat(indent + 6)}});
${' '.repeat(indent + 6)}const data = await response.json();
${' '.repeat(indent + 6)}set${component.id.replace(/-/g, '_')}_Data(data);
${' '.repeat(indent + 4)}} catch (error) {
${' '.repeat(indent + 6)}set${component.id.replace(/-/g, '_')}_Error(error);
${' '.repeat(indent + 4)}} finally {
${' '.repeat(indent + 6)}set${component.id.replace(/-/g, '_')}_Loading(false);
${' '.repeat(indent + 4)}}
${' '.repeat(indent + 2)}};

${' '.repeat(indent + 2)}fetchData();
${' '.repeat(indent)}}${component.apiConfig.dependencies ? `, [${component.apiConfig.dependencies}]` : ', []'});

`;
};

// Generate context transform code
const generateContextTransformCode = (component: ComponentConfig, indent = 0): string => {
  if (!component.contextTransform) return '';
  
  // Format the user's transform code with proper indentation
  const formattedTransformCode = component.contextTransform
    .split('\n')
    .map(line => `${' '.repeat(indent + 4)}${line}`)
    .join('\n');
  
  return `
${' '.repeat(indent)}// Transform data for ${component.type} (ID: ${component.id})
${' '.repeat(indent)}const ${component.id.replace(/-/g, '_')}_transformed = useMemo(() => {
${' '.repeat(indent + 2)}// Skip transformation if no data
${' '.repeat(indent + 2)}if (!${component.id.replace(/-/g, '_')}_data) return null;
${' '.repeat(indent + 2)}
${' '.repeat(indent + 2)}// Apply custom transform
${' '.repeat(indent + 2)}try {
${formattedTransformCode}
${' '.repeat(indent + 2)}} catch (error) {
${' '.repeat(indent + 4)}console.error('Error transforming data:', error);
${' '.repeat(indent + 4)}return ${component.id.replace(/-/g, '_')}_data;
${' '.repeat(indent + 2)}}
${' '.repeat(indent)}}, [${component.id.replace(/-/g, '_')}_data]);

`;
};

// Generate tech stack specific code
const generateTechStackCode = (
  components: ComponentConfig[],
  techStack: TechStack,
  componentName: string
): { code: string; css: string; fileSuffix: string; packageJson: string; readme: string } => {
  let imports: string[] = [];
  let code = '';
  let css = '';
  let fileSuffix = '.jsx';
  let packageJson = '';
  let readme = '';

  // Check if we need to include API handling
  const hasApiCalls = components.some(component => component.apiConfig?.enabled);
  const hasMapComponent = components.some(component => component.type === 'MapComponent');
  
  switch (techStack) {
    case 'react':
      imports = [
        'import React, { useState, useEffect } from "react";',
        'import { Box, Typography, Button, Card, CardContent, Paper, Stack, Avatar, Chip } from "@mui/material";'
      ];
      
      // Add fetch API handling
      const apiSetupCode = hasApiCalls ? `
  // State for API data
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to safely access nested properties
  const getPropValue = (obj, path, defaultValue = '') => {
    if (!obj || !path) return defaultValue;
    try {
      return path.split('.').reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('${components.find(c => c.apiConfig?.enabled)?.apiConfig?.url || 'https://api.example.com/data'}');
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result);
        console.log('API data loaded:', result);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);` : `
  // Sample data for preview
  const [data] = useState({
    items: [
      { id: 1, name: 'Item 1', description: 'Description for item 1' },
      { id: 2, name: 'Item 2', description: 'Description for item 2' },
      { id: 3, name: 'Item 3', description: 'Description for item 3' }
    ]
  });

  // Helper to safely access nested properties
  const getPropValue = (obj, path, defaultValue = '') => {
    if (!obj || !path) return defaultValue;
    try {
      return path.split('.').reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };`;
      
      code = `${imports.join('\n')}

export const ${componentName} = () => {${apiSetupCode}

  ${hasApiCalls ? `
  // Show loading or error states
  if (isLoading) return <Box p={2}><Typography>Loading...</Typography></Box>;
  if (error) return <Box p={2}><Typography color="error">Error: {error}</Typography></Box>;
  ` : ''}

  return (
    <Box sx={{ padding: 2 }}>
${components.map(comp => generateComponentCode(comp, 3)).join('')}    </Box>
  );
};

export default ${componentName};
`;
      
      // Generate CSS for the component
      css = generateComponentCss(components);
      
      // Generate package.json for react
      packageJson = `{
  "name": "${componentName.toLowerCase()}-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.10.6",
    "@emotion/styled": "^11.10.6",
    "@mui/icons-material": "^5.11.11",
    "@mui/material": "^5.11.11",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
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

      // Generate README for react
      readme = `# ${componentName} App

This project was generated from a UI playground design.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### \`npm test\`

Launches the test runner in interactive watch mode.

### \`npm run build\`

Builds the app for production to the \`build\` folder.
`;
      
      fileSuffix = '.jsx';
      break;
      
    case 'react-typescript':
      imports = [
        'import React, { useState, useEffect } from "react";',
        'import { Box, Typography, Button, Card, CardContent, Paper, Stack, Avatar, Chip } from "@mui/material";'
      ];
      
      // Add fetch API handling with TypeScript types
      const apiSetupCodeTS = hasApiCalls ? `
  interface ApiData {
    [key: string]: any;
  }

  // State for API data
  const [data, setData] = useState<ApiData>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to safely access nested properties
  const getPropValue = (obj: any, path: string, defaultValue: any = ''): any => {
    if (!obj || !path) return defaultValue;
    try {
      return path.split('.').reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await fetch('${components.find(c => c.apiConfig?.enabled)?.apiConfig?.url || 'https://api.example.com/data'}');
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result);
        console.log('API data loaded:', result);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);` : `
  interface ApiData {
    items: Array<{
      id: number;
      name: string;
      description: string;
    }>;
  }

  // Sample data for preview
  const [data] = useState<ApiData>({
    items: [
      { id: 1, name: 'Item 1', description: 'Description for item 1' },
      { id: 2, name: 'Item 2', description: 'Description for item 2' },
      { id: 3, name: 'Item 3', description: 'Description for item 3' }
    ]
  });

  // Helper to safely access nested properties
  const getPropValue = (obj: any, path: string, defaultValue: any = ''): any => {
    if (!obj || !path) return defaultValue;
    try {
      return path.split('.').reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };`;
      
      code = `${imports.join('\n')}

export const ${componentName}: React.FC = () => {${apiSetupCodeTS}

  ${hasApiCalls ? `
  // Show loading or error states
  if (isLoading) return <Box p={2}><Typography>Loading...</Typography></Box>;
  if (error) return <Box p={2}><Typography color="error">Error: {error}</Typography></Box>;
  ` : ''}

  return (
    <Box sx={{ padding: 2 }}>
${components.map(comp => generateComponentCode(comp, 3)).join('')}    </Box>
  );
};

export default ${componentName};
`;
      
      // Generate CSS for the component
      css = generateComponentCss(components);
      
      // Generate package.json for react-typescript
      packageJson = `{
  "name": "${componentName.toLowerCase()}-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.10.6",
    "@emotion/styled": "^11.10.6",
    "@mui/icons-material": "^5.11.11",
    "@mui/material": "^5.11.11",
    "@types/node": "^16.18.12",
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
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

      // Generate README for react-typescript
      readme = `# ${componentName} App (TypeScript)

This project was generated from a UI playground design using TypeScript.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### \`npm test\`

Launches the test runner in interactive watch mode.

### \`npm run build\`

Builds the app for production to the \`build\` folder.
`;
      
      fileSuffix = '.tsx';
      break;
    
    case 'vue':
      imports = [
        'import { reactive, onMounted } from "vue";'
      ];
      
      const apiSetupVue = hasApiCalls ? `
  const state = reactive({
    data: {},
    isLoading: false,
    error: null
  });

  // Helper to safely access nested properties
  function getPropValue(obj, path, defaultValue = '') {
    if (!obj || !path) return defaultValue;
    try {
      return path.split('.').reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  // Fetch data when component mounts
  onMounted(async () => {
    state.isLoading = true;
    try {
      const response = await fetch('${components.find(c => c.apiConfig?.enabled)?.apiConfig?.url || 'https://api.example.com/data'}');
      if (!response.ok) throw new Error('Network response was not ok');
      state.data = await response.json();
      console.log('API data loaded:', state.data);
    } catch (err) {
      state.error = err.message;
      console.error('Error fetching data:', err);
    } finally {
      state.isLoading = false;
    }
  });` : `
  const state = reactive({
    data: {
      items: [
        { id: 1, name: 'Item 1', description: 'Description for item 1' },
        { id: 2, name: 'Item 2', description: 'Description for item 2' },
        { id: 3, name: 'Item 3', description: 'Description for item 3' }
      ]
    }
  });

  // Helper to safely access nested properties
  function getPropValue(obj, path, defaultValue = '') {
    if (!obj || !path) return defaultValue;
    try {
      return path.split('.').reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }`;
      
      // Generate Vue template using helper
      let vueTemplate = `<template>
  <div class="component-container">
    ${hasApiCalls ? `
    <div v-if="state.isLoading" class="loading">Loading...</div>
    <div v-else-if="state.error" class="error">Error: {{ state.error }}</div>
    <div v-else>` : ''}
${components.map(comp => generateVueTemplate(comp, 4)).join('\n')}
    ${hasApiCalls ? `</div>` : ''}
  </div>
</template>

<script>
${imports.join('\n')}

export default {
  name: "${componentName}",
  setup() {${apiSetupVue}

    return {
      state,
      getPropValue
    };
  }
};
</script>

<style scoped>
${css}
</style>
`;
      
      code = vueTemplate;
      
      // Generate package.json for Vue
      packageJson = `{
  "name": "${componentName.toLowerCase()}-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint": "vue-cli-service lint"
  },
  "dependencies": {
    "core-js": "^3.8.3",
    "vue": "^3.2.13"
  },
  "devDependencies": {
    "@vue/cli-plugin-babel": "~5.0.0",
    "@vue/cli-plugin-eslint": "~5.0.0",
    "@vue/cli-service": "~5.0.0",
    "eslint": "^7.32.0",
    "eslint-plugin-vue": "^8.0.3"
  }
}`;

      // Generate README for Vue
      readme = `# ${componentName} Vue App

This project was generated from a UI playground design using Vue.js.

## Project setup
\`\`\`
npm install
\`\`\`

### Compiles and hot-reloads for development
\`\`\`
npm run serve
\`\`\`

### Compiles and minifies for production
\`\`\`
npm run build
\`\`\`

### Lints and fixes files
\`\`\`
npm run lint
\`\`\`
`;
      
      fileSuffix = '.vue';
      break;
    
    case 'angular':
      imports = [
        'import { Component, OnInit } from \'@angular/core\';',
        'import { HttpClient } from \'@angular/common/http\';'
      ];
      
      const apiSetupAngular = hasApiCalls ? `
  data: any = {};
  isLoading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.isLoading = true;
    this.http.get('${components.find(c => c.apiConfig?.enabled)?.apiConfig?.url || 'https://api.example.com/data'}')
      .subscribe({
        next: (result) => {
          this.data = result;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.message;
          this.isLoading = false;
        }
      });
  }

  // Helper to safely access nested properties
  getPropValue(obj: any, path: string, defaultValue = ''): any {
    if (!obj || !path) return defaultValue;
    try {
      return path.split('.').reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }` : `
  data: any = {
    items: [
      { id: 1, name: 'Item 1', description: 'Description for item 1' },
      { id: 2, name: 'Item 2', description: 'Description for item 2' },
      { id: 3, name: 'Item 3', description: 'Description for item 3' }
    ]
  };

  constructor() {}

  ngOnInit(): void {}

  // Helper to safely access nested properties
  getPropValue(obj: any, path: string, defaultValue = ''): any {
    if (!obj || !path) return defaultValue;
    try {
      return path.split('.').reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }`;
      
      // Generate Angular template using helper
      let angularTemplate = `${imports.join('\n')}

@Component({
  selector: 'app-${componentName.toLowerCase()}',
  template: \`
    <div class="component-container">
      ${hasApiCalls ? `
      <div *ngIf="isLoading" class="loading">Loading...</div>
      <div *ngIf="error" class="error">Error: {{ error }}</div>
      <div *ngIf="!isLoading && !error">` : ''}
${components.map(comp => generateAngularTemplate(comp, 6)).join('\n')}
      ${hasApiCalls ? `</div>` : ''}
    </div>
  \`,
  styles: [\`
${css}
  \`]
})
export class ${componentName}Component implements OnInit {
  ${apiSetupAngular}
}
`;
      
      code = angularTemplate;
      
      // Generate package.json for Angular
      packageJson = `{
  "name": "${componentName.toLowerCase()}-app",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^15.1.0",
    "@angular/common": "^15.1.0",
    "@angular/compiler": "^15.1.0",
    "@angular/core": "^15.1.0",
    "@angular/forms": "^15.1.0",
    "@angular/platform-browser": "^15.1.0",
    "@angular/platform-browser-dynamic": "^15.1.0",
    "@angular/router": "^15.1.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.12.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^15.1.6",
    "@angular/cli": "~15.1.6",
    "@angular/compiler-cli": "^15.1.0",
    "@types/jasmine": "~4.3.0",
    "jasmine-core": "~4.5.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.1.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.0.0",
    "typescript": "~4.9.4"
  }
}`;

      // Generate README for Angular
      readme = `# ${componentName} Angular App

This project was generated from a UI playground design using Angular.

## Development server

Run \`ng serve\` for a dev server. Navigate to \`http://localhost:4200/\`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run \`ng generate component component-name\` to generate a new component.

## Build

Run \`ng build\` to build the project. The build artifacts will be stored in the \`dist/\` directory.

## Running unit tests

Run \`ng test\` to execute the unit tests via Karma.
`;
      
      fileSuffix = '.component.ts';
      break;
    
    default:
      // Default to React if tech stack is not recognized
      return generateTechStackCode(components, 'react', componentName);
  }

  return { code, css, fileSuffix, packageJson, readme };
};

// Main function to generate React component code
export const generateReactComponent = (components: ComponentConfig[], componentName = 'MyComponent'): string => {
  const imports = getUniqueImports(components);
  const importsCode = imports.join('\n');
  
  const componentsCode = components.map(comp => generateComponentCode(comp, 2)).join('\n');
  
  return `import React from 'react';
${importsCode}

export const ${componentName} = () => {
  return (
${componentsCode}
  );
};
`;
};

// Generate a complete React application
export const generateReactApp = (components: ComponentConfig[], appName = 'MyApp'): string => {
  const componentCode = generateReactComponent(components, 'AppContent');
  
  return `${componentCode}

// Main App component
export default function ${appName}() {
  return (
    <div className="app-container">
      <AppContent />
    </div>
  );
}
`;
};

// Generate component code for a specific tech stack
export const generateComponentForTechStack = (
  components: ComponentConfig[],
  techStack: TechStack = 'react',
  componentName = 'MyComponent'
): {
  code: string;
  css: string;
  fileSuffix: string;
  packageJson: string;
  readme: string;
} => {
  return generateTechStackCode(components, techStack, componentName);
};

// Generate exportable code for a playground
export const exportPlayground = (
  components: ComponentConfig[],
  techStack: TechStack = 'react'
): { 
  code: string; 
  imports: string[]; 
  css: string;
  fileSuffix: string;
  packageJson: string;
  readme: string;
  appJs: string;
  indexHtml: string;
} => {
  const { code, css, fileSuffix, packageJson, readme } = generateTechStackCode(components, techStack, 'MyComponent');
  
  // Generate a basic App.js wrapper component
  let appJs = '';
  
  // Generate different App file depending on tech stack
  switch (techStack) {
    case 'react':
      appJs = `import React from 'react';
import MyComponent from './MyComponent';

function App() {
  return (
    <div className="App">
      <MyComponent />
    </div>
  );
}

export default App;
`;
      break;
    
    case 'react-typescript':
      appJs = `import React from 'react';
import MyComponent from './MyComponent';

const App: React.FC = () => {
  return (
    <div className="App">
      <MyComponent />
    </div>
  );
};

export default App;
`;
      break;
  }

  // Generate a basic index.html file
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Generated component from playground" />
    <title>Playground Component</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;
  
  return { 
    code, 
    imports: getUniqueImports(components), 
    css, 
    fileSuffix,
    packageJson,
    readme,
    appJs,
    indexHtml
  };
};

// Helper functions to generate templates for different tech stacks
const generateVueTemplate = (component: ComponentConfig, indentation: number): string => {
  const indent = ' '.repeat(indentation);
  
  if (!component) return `${indent}<div>No component</div>`;
  
  switch (component.type) {
    case 'Typography':
      return `${indent}<p class="typography ${component.props.variant || 'body1'}" 
${indent}   :style="{ 
${indent}     color: '${component.props.color || 'inherit'}',
${indent}     fontSize: ${component.props.fontSize ? `'${component.props.fontSize}px'` : 'undefined'},
${indent}     textAlign: '${component.props.align || 'left'}'
${indent}   }">
${indent}  ${component.props.children || 'Text Content'}
${indent}</p>`;
      
    case 'Button':
      return `${indent}<button class="btn ${component.props.variant || 'primary'}"
${indent}   :class="{ 
${indent}     disabled: ${component.props.disabled === 'true' || component.props.disabled === true},
${indent}     'btn-${component.props.color || 'primary'}': true 
${indent}   }"
${indent}   :disabled="${component.props.disabled === 'true' || component.props.disabled === true}">
${indent}  ${component.props.children || 'Button'}
${indent}</button>`;
      
    case 'Card':
      return `${indent}<div class="card" 
${indent}   :style="{
${indent}     maxWidth: '${component.props.maxWidth || '345'}px',
${indent}     backgroundColor: '${component.props.backgroundColor || '#fff'}'
${indent}   }">
${indent}  <div class="card-content">
${component.children?.map(child => generateVueTemplate(child, indentation + 4)).join('\n') || `${indent}    Card Content`}
${indent}  </div>
${indent}</div>`;
      
    case 'Section':
      return `${indent}<section 
${indent}   :style="{ 
${indent}     padding: '${component.props.padding || 2}', 
${indent}     backgroundColor: '${component.props.backgroundColor || '#fff'}'
${indent}   }">
${component.children?.map(child => generateVueTemplate(child, indentation + 2)).join('\n') || `${indent}  Section Content`}
${indent}</section>`;
      
    case 'Flexbox':
      return `${indent}<div 
${indent}   :style="{ 
${indent}     display: 'flex', 
${indent}     flexDirection: '${component.props.flexDirection || 'row'}',
${indent}     justifyContent: '${component.props.justifyContent || 'flex-start'}',
${indent}     alignItems: '${component.props.alignItems || 'center'}'
${indent}   }">
${component.children?.map(child => generateVueTemplate(child, indentation + 2)).join('\n') || `${indent}  Flexbox Content`}
${indent}</div>`;
      
    case 'Image':
      return `${indent}<img 
${indent}   src="${component.props.src || 'https://placehold.co/150'}" 
${indent}   alt="${component.props.alt || 'Image'}"
${indent}   :style="{
${indent}     width: '${component.props.width || 150}px',
${indent}     height: '${component.props.height || 150}px'
${indent}   }" />`;
      
    default:
      return `${indent}<div>${component.type} (${component.children?.length || 0} children)</div>`;
  }
};

const generateAngularTemplate = (component: ComponentConfig, indentation: number): string => {
  const indent = ' '.repeat(indentation);
  
  if (!component) return `${indent}<div>No component</div>`;
  
  switch (component.type) {
    case 'Typography':
      return `${indent}<p class="typography ${component.props.variant || 'body1'}"
${indent}   [ngStyle]="{
${indent}     color: '${component.props.color || 'inherit'}',
${indent}     fontSize: ${component.props.fontSize ? `'${component.props.fontSize}px'` : 'undefined'},
${indent}     textAlign: '${component.props.align || 'left'}'
${indent}   }">
${indent}  ${component.props.children || 'Text Content'}
${indent}</p>`;
      
    case 'Button':
      return `${indent}<button class="btn ${component.props.variant || 'primary'}"
${indent}   [ngClass]="{ 
${indent}     disabled: ${component.props.disabled === 'true' || component.props.disabled === true},
${indent}     'btn-${component.props.color || 'primary'}': true 
${indent}   }"
${indent}   [disabled]="${component.props.disabled === 'true' || component.props.disabled === true}">
${indent}  ${component.props.children || 'Button'}
${indent}</button>`;
      
    case 'Card':
      return `${indent}<div class="card" 
${indent}   [ngStyle]="{
${indent}     maxWidth: '${component.props.maxWidth || '345'}px',
${indent}     backgroundColor: '${component.props.backgroundColor || '#fff'}'
${indent}   }">
${indent}  <div class="card-content">
${component.children?.map(child => generateAngularTemplate(child, indentation + 4)).join('\n') || `${indent}    Card Content`}
${indent}  </div>
${indent}</div>`;
      
    case 'Section':
      return `${indent}<section 
${indent}   [ngStyle]="{ 
${indent}     padding: '${component.props.padding || 2}', 
${indent}     backgroundColor: '${component.props.backgroundColor || '#fff'}'
${indent}   }">
${component.children?.map(child => generateAngularTemplate(child, indentation + 2)).join('\n') || `${indent}  Section Content`}
${indent}</section>`;
      
    case 'Flexbox':
      return `${indent}<div 
${indent}   [ngStyle]="{ 
${indent}     display: 'flex', 
${indent}     flexDirection: '${component.props.flexDirection || 'row'}',
${indent}     justifyContent: '${component.props.justifyContent || 'flex-start'}',
${indent}     alignItems: '${component.props.alignItems || 'center'}'
${indent}   }">
${component.children?.map(child => generateAngularTemplate(child, indentation + 2)).join('\n') || `${indent}  Flexbox Content`}
${indent}</div>`;
      
    case 'Image':
      return `${indent}<img 
${indent}   src="${component.props.src || 'https://placehold.co/150'}" 
${indent}   alt="${component.props.alt || 'Image'}"
${indent}   [ngStyle]="{
${indent}     width: '${component.props.width || 150}px',
${indent}     height: '${component.props.height || 150}px'
${indent}   }" />`;
      
    default:
      return `${indent}<div>${component.type} (${component.children?.length || 0} children)</div>`;
  }
};

// Generate CSS styles for all components
const generateComponentCss = (components: ComponentConfig[]): string => {
  const css = [];
  
  // Function to generate CSS for a single component
  const generateCssForComponent = (component: ComponentConfig): void => {
    if (!component) return;
    
    switch(component.type) {
      case 'Typography':
        css.push(`
.typography {
  margin: 0;
  font-weight: ${component.props.fontWeight || 'normal'};
  font-size: ${component.props.fontSize ? `${component.props.fontSize}px` : 'inherit'};
  color: ${component.props.color || 'inherit'};
  text-align: ${component.props.align || 'left'};
  line-height: ${component.props.lineHeight || 1.5};
  text-decoration: ${component.props.textDecoration || 'none'};
  font-style: ${component.props.fontStyle || 'normal'};
  text-transform: ${component.props.textTransform || 'none'};
}

.typography.h1 { font-size: 2.5rem; font-weight: bold; }
.typography.h2 { font-size: 2rem; font-weight: bold; }
.typography.h3 { font-size: 1.75rem; font-weight: bold; }
.typography.h4 { font-size: 1.5rem; font-weight: bold; }
.typography.h5 { font-size: 1.25rem; font-weight: bold; }
.typography.h6 { font-size: 1rem; font-weight: bold; }
.typography.body1 { font-size: 1rem; }
.typography.body2 { font-size: 0.875rem; }
.typography.subtitle1 { font-size: 1rem; font-weight: 500; }
.typography.subtitle2 { font-size: 0.875rem; font-weight: 500; }
`);
        break;
        
      case 'Button':
        css.push(`
.btn {
  padding: 8px 16px;
  cursor: pointer;
  border-radius: ${component.props.borderRadius ? `${component.props.borderRadius}px` : '4px'};
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: uppercase;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.btn.primary {
  background-color: #6caba8;
  color: white;
  border: none;
}

.btn.secondary {
  background-color: #6d597a;
  color: white;
  border: none;
}

.btn.outlined {
  background-color: transparent;
  border: 1px solid currentColor;
}

.btn.outlined.btn-primary {
  color: #6caba8;
}

.btn.outlined.btn-secondary {
  color: #6d597a;
}

.btn.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
`);
        break;
        
      case 'Card':
        css.push(`
.card {
  border-radius: ${component.props.borderRadius || 4}px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  background-color: ${component.props.backgroundColor || '#ffffff'};
  margin: 16px 0;
  display: flex;
  flex-direction: column;
}

.card-content {
  padding: 16px;
}
`);
        break;
        
      case 'Section':
        css.push(`
section {
  padding: 16px;
  margin: 16px 0;
  background-color: ${component.props.backgroundColor || '#ffffff'};
  border-radius: ${component.props.borderRadius || 0}px;
  border: ${component.props.border || 'none'};
}
`);
        break;
        
      case 'Flexbox':
        css.push(`
.flexbox {
  display: flex;
  flex-direction: ${component.props.flexDirection || 'row'};
  justify-content: ${component.props.justifyContent || 'flex-start'};
  align-items: ${component.props.alignItems || 'center'};
  flex-wrap: ${component.props.flexWrap || 'nowrap'};
  gap: ${component.props.gap ? `${component.props.gap * 8}px` : '16px'};
  padding: ${component.props.padding ? `${component.props.padding * 8}px` : '16px'};
  background-color: ${component.props.backgroundColor || 'transparent'};
}
`);
        break;
        
      default:
        break;
    }
    
    // Process children recursively
    if (component.children && component.children.length > 0) {
      component.children.forEach(child => generateCssForComponent(child));
    }
  };
  
  // Process all components
  components.forEach(component => generateCssForComponent(component));
  
  return css.join('\n');
}; 