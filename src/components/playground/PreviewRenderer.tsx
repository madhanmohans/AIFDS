import React, { useMemo } from 'react';
import { Box, Typography, Avatar, Button, Card, CardContent, Stack, styled } from '@mui/material';
import { usePlayground } from '../../context/PlaygroundContext';
import type { ComponentConfig } from '../../types/playground';

// Styled component for the preview container
const PreviewContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  padding: theme.spacing(2),
  backgroundColor: '#f8f9fa',
  border: '1px solid #e0e0e0',
  borderRadius: theme.shape.borderRadius,
  overflow: 'auto',
}));

// Dynamic component renderer
const RenderComponent = ({ component }: { component: ComponentConfig }) => {
  switch (component.type) {
    case 'Section':
      return (
        <Box
          sx={{
            padding: component.props?.padding || 2,
            margin: component.props?.margin || 0,
            backgroundColor: component.props?.backgroundColor || '#f9f9f9',
            borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : 0,
            border: component.props?.border || '1px solid #eee',
            width: '100%',
            minHeight: 50,
          }}
        >
          {component.children?.map((child, idx) => (
            <RenderComponent key={`${child.id}-${idx}`} component={child} />
          ))}
        </Box>
      );

    case 'Typography':
      return (
        <Typography
          variant={component.props?.variant as any || 'body1'}
          align={component.props?.align as any || 'left'}
          sx={{
            color: component.props?.color || '#153447',
            fontSize: component.props?.fontSize ? `${component.props.fontSize}px` : 'inherit',
            fontWeight: component.props?.fontWeight || 'normal',
            fontStyle: component.props?.fontStyle || 'normal',
            textDecoration: component.props?.textDecoration || 'none',
            letterSpacing: component.props?.letterSpacing || 'normal',
            lineHeight: component.props?.lineHeight || 'normal',
            textTransform: component.props?.textTransform as any || 'none',
          }}
        >
          {component.props?.children || 'Text Content'}
        </Typography>
      );

    case 'Button':
      return (
        <Button
          variant={component.props?.variant as any || 'contained'}
          color={component.props?.color as any || 'primary'}
          size={component.props?.size as any || 'medium'}
          disabled={component.props?.disabled === 'true' || component.props?.disabled === true}
          sx={{
            borderRadius: component.props?.borderRadius ? `${component.props.borderRadius}px` : undefined,
          }}
        >
          {component.props?.children || 'Button'}
        </Button>
      );

    case 'Image':
      return (
        <Avatar
          src={component.props?.src || 'https://placehold.co/150'}
          alt={component.props?.alt || 'Image'}
          sx={{
            width: component.props?.width || 150,
            height: component.props?.height || 150,
            borderRadius: component.props?.borderRadius || '50%',
            objectFit: component.props?.objectFit as any || 'cover',
          }}
        />
      );

    case 'Card':
      return (
        <Card
          sx={{
            maxWidth: component.props?.maxWidth || 345,
            backgroundColor: component.props?.backgroundColor || '#fff',
            borderRadius: `${component.props?.borderRadius || 4}px`,
          }}
          elevation={component.props?.elevation || 1}
          variant={component.props?.variant as any || 'elevation'}
        >
          <CardContent>
            {component.children?.map((child, idx) => (
              <RenderComponent key={`${child.id}-${idx}`} component={child} />
            ))}
            {!component.children?.length && (
              <Typography variant="body2" color="text.secondary">
                Card Content
              </Typography>
            )}
          </CardContent>
        </Card>
      );

    case 'Flexbox':
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: component.props?.flexDirection as any || 'row',
            justifyContent: component.props?.justifyContent || 'flex-start',
            alignItems: component.props?.alignItems || 'center',
            flexWrap: component.props?.flexWrap as any || 'nowrap',
            gap: component.props?.gap || 2,
            padding: component.props?.padding || 2,
            backgroundColor: component.props?.backgroundColor || 'transparent',
            width: '100%',
          }}
        >
          {component.children?.map((child, idx) => (
            <RenderComponent key={`${child.id}-${idx}`} component={child} />
          ))}
          {!component.children?.length && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Flexbox ({component.props?.flexDirection || 'row'})
            </Typography>
          )}
        </Box>
      );

    case 'Stack':
      return (
        <Stack
          direction={component.props?.direction as any || 'column'}
          spacing={component.props?.spacing || 2}
          alignItems={component.props?.alignItems as any || 'flex-start'}
          justifyContent={component.props?.justifyContent as any || 'flex-start'}
          sx={{
            padding: component.props?.padding || 2,
            backgroundColor: component.props?.backgroundColor || 'transparent',
            width: '100%',
          }}
        >
          {component.children?.map((child, idx) => (
            <RenderComponent key={`${child.id}-${idx}`} component={child} />
          ))}
          {!component.children?.length && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Stack ({component.props?.direction || 'column'})
            </Typography>
          )}
        </Stack>
      );

    case 'ScrollableContainer':
      return (
        <Box
          sx={{
            height: component.props?.height || 200,
            width: component.props?.width || '100%',
            overflow: 'auto',
            padding: component.props?.padding || 2,
            backgroundColor: component.props?.backgroundColor || 'transparent',
            borderRadius: component.props?.borderRadius || 1,
            border: component.props?.border || '1px solid #e0e0e0',
          }}
        >
          {component.children?.map((child, idx) => (
            <RenderComponent key={`${child.id}-${idx}`} component={child} />
          ))}
          {!component.children?.length && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Scrollable Container
            </Typography>
          )}
        </Box>
      );

    default:
      return (
        <Box sx={{ p: 2, border: '1px dashed #ccc' }}>
          <Typography variant="body2">Unknown component: {component.type}</Typography>
        </Box>
      );
  }
};

export default function PreviewRenderer() {
  const { state } = usePlayground();
  const { components } = state;

  // Memoize the preview to avoid unnecessary re-renders
  const preview = useMemo(() => {
    if (components.length === 0) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Preview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add components to see a preview
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%' }}>
        {components.map((component, idx) => (
          <RenderComponent key={`${component.id}-${idx}`} component={component} />
        ))}
      </Box>
    );
  }, [components]);

  return (
    <PreviewContainer data-test-id="preview-container">
      {preview}
    </PreviewContainer>
  );
} 