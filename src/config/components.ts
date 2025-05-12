import type { ComponentProperty } from '../types/playground';
import type { TechStack } from '../types/playground';

interface ComponentDefinition {
  id: string;
  type: string;
  defaultProps: Record<string, any>;
  configurableProps: Record<string, ComponentProperty>;
  category: 'layout' | 'content' | 'input' | 'display' | 'container' | 'data';
  icon?: string;
  description: string;
  allowChildren: boolean;
  codeTemplate: {
    import: string;
    component: string;
    props: string[];
    wrapper?: string;
  };
  techStackTemplates: {
    [key in TechStack]?: {
      imports: string[];
      component: string; // Template for the component code
      css?: string; // Template for CSS styles
    }
  };
  previewTemplate?: (props: any) => string;
}

// Add template strings for code generation
const generateTypographyCode = (props: any) => `
<Typography
  variant="${props.variant || 'body1'}"
  align="${props.align || 'left'}"
  sx={{
    color: "${props.color || 'inherit'}",
    fontSize: ${props.fontSize ? `${props.fontSize}px` : 'inherit'},
    fontWeight: "${props.fontWeight || 'normal'}",
    fontStyle: "${props.fontStyle || 'normal'}",
    textDecoration: "${props.textDecoration || 'none'}",
    letterSpacing: "${props.letterSpacing || 'normal'}",
    lineHeight: ${props.lineHeight || 1.5},
    textTransform: "${props.textTransform || 'none'}"
  }}
>
  ${props.children || 'Text Content'}
</Typography>
`;

// Add CSS templates
const generateTypographyCSS = (props: any) => `
.typography-component {
  color: ${props.color || 'inherit'};
  font-size: ${props.fontSize ? `${props.fontSize}px` : 'inherit'};
  font-weight: ${props.fontWeight || 'normal'};
  font-style: ${props.fontStyle || 'normal'};
  text-decoration: ${props.textDecoration || 'none'};
  letter-spacing: ${props.letterSpacing || 'normal'};
  line-height: ${props.lineHeight || 1.5};
  text-transform: ${props.textTransform || 'none'};
  text-align: ${props.align || 'left'};
}
`;

const generateButtonCode = (props: any) => `
<Button
  variant="${props.variant || 'contained'}"
  color="${props.color || 'primary'}"
  size="${props.size || 'medium'}"
  ${props.disabled === 'true' || props.disabled === true ? 'disabled' : ''}
  ${props.onClick ? `onClick={${props.onClick}}` : ''}
  sx={{ ${props.borderRadius ? `borderRadius: ${props.borderRadius}px,` : ''} }}
>
  ${props.children || 'Button'}
</Button>
`;

const generateButtonCSS = (props: any) => `
.button-component {
  border-radius: ${props.borderRadius ? `${props.borderRadius}px` : '4px'};
  cursor: ${props.disabled === 'true' || props.disabled === true ? 'not-allowed' : 'pointer'};
  opacity: ${props.disabled === 'true' || props.disabled === true ? '0.7' : '1'};
}
`;

const generateFlexboxCode = (props: any) => `
<Box
  sx={{
    display: 'flex',
    flexDirection: '${props.flexDirection || 'row'}',
    justifyContent: '${props.justifyContent || 'flex-start'}',
    alignItems: '${props.alignItems || 'center'}',
    flexWrap: '${props.flexWrap || 'nowrap'}',
    gap: ${props.gap || 2},
    padding: ${props.padding || 2},
    backgroundColor: '${props.backgroundColor || 'transparent'}',
  }}
>
  {/* Children will be rendered here */}
</Box>
`;

const generateSectionCode = (props: any) => `
<Box
  sx={{
    padding: ${props.padding || 2},
    margin: ${props.margin || 0},
    backgroundColor: '${props.backgroundColor || '#f9f9f9'}',
    borderRadius: ${props.borderRadius ? `${props.borderRadius}px` : 0},
    border: '${props.border || '1px solid #eee'}',
  }}
>
  {/* Children will be rendered here */}
</Box>
`;

const generateStackCode = (props: any) => `
<Stack
  direction="${props.direction || 'column'}"
  spacing={${props.spacing || 2}}
  alignItems="${props.alignItems || 'flex-start'}"
  justifyContent="${props.justifyContent || 'flex-start'}"
  sx={{
    padding: ${props.padding || 2},
    backgroundColor: '${props.backgroundColor || 'transparent'}',
  }}
>
  {/* Children will be rendered here */}
</Stack>
`;

const generateCardCode = (props: any) => `
<Card
  sx={{
    maxWidth: ${props.maxWidth || 345},
    backgroundColor: '${props.backgroundColor || '#fff'}',
    borderRadius: ${props.borderRadius || 4}px,
  }}
  elevation={${props.elevation || 1}}
  variant="${props.variant || 'elevation'}"
>
  <CardContent>
    {/* Children will be rendered here */}
  </CardContent>
</Card>
`;

const generateImageCode = (props: any) => `
<Avatar
  src="${props.src || 'https://placehold.co/150'}"
  alt="${props.alt || 'Image'}"
  sx={{
    width: ${props.width || 150},
    height: ${props.height || 150},
    borderRadius: '${props.borderRadius || '50%'}',
    objectFit: '${props.objectFit || 'cover'}',
    border: '${props.border || 'none'}',
  }}
/>
`;

const generateScrollableContainerCode = (props: any) => `
<Box
  sx={{
    height: ${props.height || 200},
    width: ${props.width || '100%'},
    overflow: 'auto',
    padding: ${props.padding || 2},
    backgroundColor: '${props.backgroundColor || 'transparent'}',
    borderRadius: ${props.borderRadius || 1},
    border: '${props.border || '1px solid #e0e0e0'}',
  }}
>
  {/* Children will be rendered here */}
</Box>
`;

// Enhanced component registry
export const availableComponents: ComponentDefinition[] = [
  {
    id: 'map',
    type: 'MapComponent',
    defaultProps: {
      dataPath: 'items',
      emptyText: 'No items to display',
      condition: '',
      stringProcessing: 'none',
      separator: ',',
    },
    configurableProps: {
      dataPath: { type: 'text', label: 'Data Path', default: 'items' },
      emptyText: { type: 'text', label: 'Empty Text', default: 'No items to display' },
      condition: { type: 'text', label: 'Filter Condition', default: '' },
      stringProcessing: { 
        type: 'select', 
        label: 'String Processing', 
        default: 'none',
        options: [
          'none',
          'split',
          'lines',
          'json'
        ]
      },
      separator: { type: 'text', label: 'Separator', default: ',' },
    },
    category: 'data',
    description: 'Maps over an array of data to render child components for each item',
    allowChildren: true,
    codeTemplate: {
      import: 'import { Box } from "@mui/material";',
      component: 'Box',
      props: ['dataPath', 'emptyText', 'condition', 'stringProcessing', 'separator'],
      wrapper: 'sx'
    },
    techStackTemplates: {
      'react': {
        imports: ['import { Box } from "@mui/material";'],
        component: `import React from 'react';
import { Box } from "@mui/material";

export const MapComponent = ({ children, data, dataPath = "items", emptyText = "No items to display", condition = "" }) => {
  // Get data array from the specified path
  const getDataArray = () => {
    if (!data) return [];
    return dataPath.split('.').reduce((obj, path) => obj && obj[path], data) || [];
  };
  
  const items = getDataArray();
  
  // Filter items if condition is provided
  const filteredItems = condition 
    ? items.filter(item => {
        try {
          const filterFn = new Function('item', \`return \${condition}\`);
          return filterFn(item);
        } catch (e) {
          return true;
        }
      })
    : items;

  if (!filteredItems.length) {
    return <div>{emptyText}</div>;
  }

  return (
    <Box>
      {filteredItems.map((item, index) => (
        <div key={index}>
          {/* Render children with item data */}
          {React.Children.map(children, child => 
            React.cloneElement(child, { data: item })
          )}
        </div>
      ))}
    </Box>
  );
};`,
        css: ''
      },
    },
  },
  {
    id: 'section',
    type: 'Section',
    defaultProps: {
      children: [],
      sx: { padding: 2, margin: 1 },
    },
    configurableProps: {
      padding: { type: 'number', label: 'Padding', default: 2 },
      margin: { type: 'number', label: 'Margin', default: 1 },
      backgroundColor: { type: 'color', label: 'Background Color', default: '#ffffff' },
      borderRadius: { type: 'number', label: 'Border Radius', default: 0 },
      border: { type: 'text', label: 'Border', default: 'none' },
    },
    category: 'container',
    description: 'A general purpose container section',
    allowChildren: true,
    codeTemplate: {
      import: 'import { Box } from "@mui/material";',
      component: 'Box',
      props: ['padding', 'margin', 'backgroundColor', 'borderRadius', 'border'],
      wrapper: 'sx'
    },
    techStackTemplates: {
      'react': {
        imports: ['import { Box } from "@mui/material";'],
        component: `import React from 'react';
import { Box } from "@mui/material";

export const Section = ({ children, padding = 2, margin = 1, backgroundColor = "#ffffff", borderRadius = 0, border = "none" }) => {
  return (
    <Box
      sx={{
        padding: padding,
        margin: margin,
        backgroundColor: backgroundColor,
        borderRadius: borderRadius,
        border: border
      }}
    >
      {children}
    </Box>
  );
};`,
        css: `.section {
  padding: 16px;
  margin: 8px;
  background-color: #ffffff;
  border-radius: 0;
  border: none;
}`
      },
      'react-typescript': {
        imports: ['import { Box } from "@mui/material";'],
        component: `import React, { ReactNode } from 'react';
import { Box } from "@mui/material";

interface SectionProps {
  children?: ReactNode;
  padding?: number;
  margin?: number;
  backgroundColor?: string;
  borderRadius?: number;
  border?: string;
}

export const Section: React.FC<SectionProps> = ({ 
  children, 
  padding = 2, 
  margin = 1, 
  backgroundColor = "#ffffff", 
  borderRadius = 0, 
  border = "none" 
}) => {
  return (
    <Box
      sx={{
        padding: padding,
        margin: margin,
        backgroundColor: backgroundColor,
        borderRadius: borderRadius,
        border: border
      }}
    >
      {children}
    </Box>
  );
};`,
        css: `.section {
  padding: 16px;
  margin: 8px;
  background-color: #ffffff;
  border-radius: 0;
  border: none;
}`
      },
      'vue': {
        imports: [],
        component: `<template>
  <div class="section" :style="sectionStyle">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'Section',
  props: {
    padding: {
      type: Number,
      default: 2
    },
    margin: {
      type: Number,
      default: 1
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    borderRadius: {
      type: Number,
      default: 0
    },
    border: {
      type: String,
      default: 'none'
    }
  },
  computed: {
    sectionStyle() {
      return {
        padding: \`\${this.padding * 8}px\`,
        margin: \`\${this.margin * 8}px\`,
        backgroundColor: this.backgroundColor,
        borderRadius: \`\${this.borderRadius}px\`,
        border: this.border
      }
    }
  }
}
</script>

<style scoped>
.section {
  padding: 16px;
  margin: 8px;
  background-color: #ffffff;
}
</style>`
      },
      'angular': {
        imports: [],
        component: `import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section',
  template: \`
    <div class="section" [ngStyle]="sectionStyle">
      <ng-content></ng-content>
    </div>
  \`,
  styleUrls: ['./section.component.css']
})
export class SectionComponent {
  @Input() padding: number = 2;
  @Input() margin: number = 1;
  @Input() backgroundColor: string = '#ffffff';
  @Input() borderRadius: number = 0;
  @Input() border: string = 'none';

  get sectionStyle() {
    return {
      'padding': \`\${this.padding * 8}px\`,
      'margin': \`\${this.margin * 8}px\`,
      'background-color': this.backgroundColor,
      'border-radius': \`\${this.borderRadius}px\`,
      'border': this.border
    };
  }
}`
      }
    },
    previewTemplate: generateSectionCode
  },
  {
    id: 'flexbox',
    type: 'Flexbox',
    defaultProps: {
      children: [],
      sx: { display: 'flex', gap: 2, padding: 2 },
    },
    configurableProps: {
      flexDirection: { 
        type: 'select', 
        label: 'Direction', 
        default: 'row',
        options: ['row', 'column', 'row-reverse', 'column-reverse'] 
      },
      justifyContent: { 
        type: 'select', 
        label: 'Justify Content', 
        default: 'flex-start',
        options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] 
      },
      alignItems: { 
        type: 'select', 
        label: 'Align Items', 
        default: 'center',
        options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'] 
      },
      flexWrap: { 
        type: 'select', 
        label: 'Wrap', 
        default: 'nowrap',
        options: ['nowrap', 'wrap', 'wrap-reverse'] 
      },
      gap: { type: 'number', label: 'Gap', default: 2 },
      padding: { type: 'number', label: 'Padding', default: 2 },
      backgroundColor: { type: 'color', label: 'Background Color', default: '#ffffff' },
    },
    category: 'layout',
    description: 'Flexible box layout for arranging items in rows or columns',
    allowChildren: true,
    codeTemplate: {
      import: 'import { Box } from "@mui/material";',
      component: 'Box',
      props: ['flexDirection', 'justifyContent', 'alignItems', 'flexWrap', 'gap', 'padding', 'backgroundColor'],
      wrapper: 'sx'
    },
    previewTemplate: generateFlexboxCode
  },
  {
    id: 'stack',
    type: 'Stack',
    defaultProps: {
      children: [],
      sx: { padding: 2 },
      spacing: 2,
      direction: 'column',
    },
    configurableProps: {
      direction: { 
        type: 'select', 
        label: 'Direction', 
        default: 'column',
        options: ['row', 'column', 'row-reverse', 'column-reverse'] 
      },
      spacing: { type: 'number', label: 'Spacing', default: 2 },
      alignItems: { 
        type: 'select', 
        label: 'Align Items', 
        default: 'flex-start',
        options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'] 
      },
      justifyContent: { 
        type: 'select', 
        label: 'Justify Content', 
        default: 'flex-start',
        options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] 
      },
      padding: { type: 'number', label: 'Padding', default: 2 },
      backgroundColor: { type: 'color', label: 'Background Color', default: '#ffffff' },
    },
    category: 'layout',
    description: 'Stack layout for vertical or horizontal arrangement of components',
    allowChildren: true,
    codeTemplate: {
      import: 'import { Stack } from "@mui/material";',
      component: 'Stack',
      props: ['direction', 'spacing', 'alignItems', 'justifyContent', 'padding', 'backgroundColor'],
    },
    previewTemplate: generateStackCode
  },
  {
    id: 'scrollable',
    type: 'ScrollableContainer',
    defaultProps: {
      children: [],
      sx: { 
        height: 200, 
        overflow: 'auto', 
        padding: 2, 
        border: '1px solid #e0e0e0', 
        borderRadius: 1 
      },
    },
    configurableProps: {
      height: { type: 'number', label: 'Height', default: 200 },
      width: { type: 'number', label: 'Width', default: '100%' },
      padding: { type: 'number', label: 'Padding', default: 2 },
      backgroundColor: { type: 'color', label: 'Background Color', default: '#ffffff' },
      borderRadius: { type: 'number', label: 'Border Radius', default: 1 },
      border: { type: 'text', label: 'Border', default: '1px solid #e0e0e0' },
    },
    category: 'container',
    description: 'Container with scrollable content',
    allowChildren: true,
    codeTemplate: {
      import: 'import { Box } from "@mui/material";',
      component: 'Box',
      props: ['height', 'width', 'padding', 'backgroundColor', 'borderRadius', 'border'],
      wrapper: 'sx'
    },
    previewTemplate: generateScrollableContainerCode
  },
  {
    id: 'image',
    type: 'Image',
    defaultProps: {
      src: 'https://via.placeholder.com/150',
      alt: 'Profile Image',
      sx: { width: 150, height: 150, borderRadius: '50%' },
    },
    configurableProps: {
      src: { type: 'text', label: 'Image URL', default: 'https://via.placeholder.com/150' },
      alt: { type: 'text', label: 'Alt Text', default: 'Profile Image' },
      width: { type: 'number', label: 'Width', default: 150 },
      height: { type: 'number', label: 'Height', default: 150 },
      borderRadius: { type: 'text', label: 'Border Radius', default: '50%' },
      objectFit: {
        type: 'select',
        label: 'Object Fit',
        default: 'cover',
        options: ['contain', 'cover', 'fill', 'none', 'scale-down'],
      },
    },
    category: 'content',
    description: 'Image or avatar component',
    allowChildren: false,
    codeTemplate: {
      import: 'import { Avatar } from "@mui/material";',
      component: 'Avatar',
      props: ['src', 'alt', 'width', 'height', 'borderRadius', 'objectFit', 'border'],
      wrapper: 'sx'
    },
    previewTemplate: generateImageCode
  },
  {
    id: 'typography',
    type: 'Typography',
    defaultProps: {
      variant: 'body1',
      children: 'Text Content',
    },
    configurableProps: {
      variant: {
        type: 'select',
        label: 'Variant',
        default: 'body1',
        options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'subtitle1', 'subtitle2'],
      },
      children: { type: 'text', label: 'Text Content', default: 'Text Content' },
      color: { type: 'color', label: 'Text Color', default: 'inherit' },
      align: {
        type: 'select',
        label: 'Text Align',
        default: 'left',
        options: ['left', 'center', 'right', 'justify'],
      },
      fontSize: { type: 'number', label: 'Font Size', default: 16 },
      fontWeight: {
        type: 'select',
        label: 'Font Weight',
        default: 'normal',
        options: ['normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
      },
      fontStyle: {
        type: 'select',
        label: 'Font Style',
        default: 'normal',
        options: ['normal', 'italic', 'oblique'],
      },
      textDecoration: {
        type: 'select',
        label: 'Text Decoration',
        default: 'none',
        options: ['none', 'underline', 'overline', 'line-through'],
      },
      letterSpacing: { 
        type: 'number', 
        label: 'Letter Spacing', 
        default: 0 
      },
      lineHeight: { 
        type: 'number', 
        label: 'Line Height', 
        default: 1.5 
      },
      textTransform: {
        type: 'select',
        label: 'Text Transform',
        default: 'none',
        options: ['none', 'capitalize', 'uppercase', 'lowercase'],
      },
    },
    category: 'content',
    description: 'Text component with typography controls',
    allowChildren: false,
    codeTemplate: {
      import: 'import { Typography } from "@mui/material";',
      component: 'Typography',
      props: ['variant', 'align', 'color', 'fontSize', 'fontWeight', 'fontStyle', 'textDecoration', 'letterSpacing', 'lineHeight', 'textTransform'],
      wrapper: 'sx'
    },
    previewTemplate: generateTypographyCode
  },
  {
    id: 'card',
    type: 'Card',
    defaultProps: {
      children: [],
      sx: { maxWidth: 345 },
    },
    configurableProps: {
      maxWidth: { 
        type: 'number', 
        label: 'Max Width', 
        default: 345,
        min: 100,
        max: 1200
      },
      elevation: { type: 'number', label: 'Elevation', default: 1 },
      variant: {
        type: 'select',
        label: 'Variant',
        default: 'elevation',
        options: ['elevation', 'outlined'],
      },
      backgroundColor: { type: 'color', label: 'Background Color', default: '#ffffff' },
      borderRadius: { type: 'number', label: 'Border Radius', default: 4 },
    },
    category: 'container',
    description: 'Material design card component',
    allowChildren: true,
    codeTemplate: {
      import: 'import { Card, CardContent } from "@mui/material";',
      component: 'Card',
      props: ['maxWidth', 'elevation', 'variant', 'backgroundColor', 'borderRadius'],
      wrapper: 'sx'
    },
    techStackTemplates: {
      'react': {
        imports: ['import { Card, CardContent } from "@mui/material";'],
        component: `import React from 'react';
import { Card, CardContent } from "@mui/material";

export const CardComponent = ({ 
  children, 
  maxWidth = 345, 
  elevation = 1, 
  variant = "elevation", 
  backgroundColor = "#ffffff", 
  borderRadius = 4 
}) => {
  return (
    <Card
      sx={{
        maxWidth: maxWidth,
        backgroundColor: backgroundColor,
        borderRadius: borderRadius + 'px',
      }}
      elevation={elevation}
      variant={variant}
    >
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};`,
        css: `.card {
  border-radius: 4px;
  background-color: #ffffff;
  box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
}`
      },
      'react-typescript': {
        imports: ['import { Card, CardContent } from "@mui/material";'],
        component: `import React, { ReactNode } from 'react';
import { Card, CardContent } from "@mui/material";

interface CardComponentProps {
  children?: ReactNode;
  maxWidth?: number;
  elevation?: number;
  variant?: 'elevation' | 'outlined';
  backgroundColor?: string;
  borderRadius?: number;
}

export const CardComponent: React.FC<CardComponentProps> = ({ 
  children, 
  maxWidth = 345, 
  elevation = 1, 
  variant = "elevation", 
  backgroundColor = "#ffffff", 
  borderRadius = 4 
}) => {
  return (
    <Card
      sx={{
        maxWidth: maxWidth,
        backgroundColor: backgroundColor,
        borderRadius: borderRadius + 'px',
      }}
      elevation={elevation}
      variant={variant}
    >
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};`,
        css: `.card {
  border-radius: 4px;
  background-color: #ffffff;
  box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
}`
      }
    },
    previewTemplate: generateCardCode
  },
  {
    id: 'button',
    type: 'Button',
    defaultProps: {
      variant: 'contained',
      children: 'Button',
    },
    configurableProps: {
      variant: {
        type: 'select',
        label: 'Variant',
        default: 'contained',
        options: ['contained', 'outlined', 'text'],
      },
      children: { type: 'text', label: 'Button Text', default: 'Button' },
      color: {
        type: 'select',
        label: 'Color',
        default: 'primary',
        options: ['primary', 'secondary', 'success', 'error', 'info', 'warning'],
      },
      size: {
        type: 'select',
        label: 'Size',
        default: 'medium',
        options: ['small', 'medium', 'large'],
      },
      disabled: {
        type: 'select',
        label: 'Disabled',
        default: 'false',
        options: ['true', 'false'],
      },
    },
    category: 'input',
    description: 'Interactive button component',
    allowChildren: false,
    codeTemplate: {
      import: 'import { Button } from "@mui/material";',
      component: 'Button',
      props: ['variant', 'color', 'size', 'disabled', 'borderRadius'],
      wrapper: 'sx'
    },
    previewTemplate: generateButtonCode
  },
  {
    id: 'taglist',
    type: 'TagList',
    defaultProps: {
      tags: 'CS,SVT,DMT',
      separator: ',',
      variant: 'contained',
      color: 'primary',
      size: 'small',
      shape: 'rounded'
    },
    configurableProps: {
      tags: { type: 'text', label: 'Tags', default: 'CS,SVT,DMT' },
      separator: { type: 'text', label: 'Separator', default: ',' },
      variant: { type: 'select', label: 'Variant', default: 'contained', options: ['contained', 'outlined'] },
      color: { type: 'select', label: 'Color', default: 'primary', options: ['primary', 'secondary', 'error', 'warning', 'success', 'info', 'default'] },
      size: { type: 'select', label: 'Size', default: 'small', options: ['small', 'medium', 'large'] },
      shape: { type: 'select', label: 'Shape', default: 'rounded', options: ['rounded', 'square'] },
    },
    category: 'content',
    description: 'Display a list of tags as chips',
    allowChildren: false,
    codeTemplate: {
      import: 'import { TagList } from "./TagList";',
      component: 'TagList',
      props: ['tags', 'separator', 'variant', 'color', 'size', 'shape'],
    },
    previewTemplate: (props: any) => `<TagList tags="${props.tags}" separator="${props.separator}" variant="${props.variant}" color="${props.color}" size="${props.size}" shape="${props.shape}" />`
  },
]; 