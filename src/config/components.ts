import type { ComponentProperty } from '../context/PlaygroundContext';

interface ComponentDefinition {
  id: string;
  type: string;
  defaultProps: Record<string, any>;
  configurableProps: Record<string, ComponentProperty>;
}

export const availableComponents: ComponentDefinition[] = [
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
    },
  },
  {
    id: 'card',
    type: 'Card',
    defaultProps: {
      children: [],
      sx: { maxWidth: 345 },
    },
    configurableProps: {
      maxWidth: { type: 'number', label: 'Max Width', default: 345 },
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
  },
]; 