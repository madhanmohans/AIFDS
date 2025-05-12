# User Data Display Guide

## Data Structure Overview
The data has the following structure:
```json
{
  "results": [
    {
      "user": {
        "gender": "male",
        "name": {
          "title": "mr",
          "first": "valtteri",
          "last": "korhonen"
        },
        "picture": {
          "large": "https://randomuser.me/api/portraits/men/23.jpg",
          "medium": "https://randomuser.me/api/portraits/med/men/23.jpg",
          "thumbnail": "https://randomuser.me/api/portraits/thumb/men/23.jpg"
        },
        // other user properties...
      }
    },
    // more user objects...
  ]
}
```

## Setting Up Components

### Step 1: Adding Your Root Components
1. Add a MapComponent to the playground
2. Set its `dataPath` to `results` 
3. Add a Card component as a child of the MapComponent

### Step 2: Setting Up the Card Component
1. Select the Card component
2. Set its `contextPath` to `user`
3. Add child components inside the Card

### Step 3: Adding Child Components to the Card
You can now add various components inside the Card component:

#### For User Images
1. Add an Image component inside the Card
2. Set its `contextPath` to `picture.large`

#### For User Name
1. Add a Typography component
2. Set its `contextPath` to `name.first` (for first name) or `name.last` (for last name)
3. You can also combine them with a custom text component

#### For Other User Information
1. Add Typography components for each piece of information
2. Set appropriate context paths like:
   - `email` for email address
   - `phone` for phone number
   - `location.city` for city
   - `location.country` for country

### Step 4: Using Context Data in Custom Components
For custom components like TagList:
1. Set `dataPath` to point to an array or string property
2. Or set `contextPath` to pick specific data

## Troubleshooting

### No Context Paths Available
If you don't see context paths when setting up child components:
1. Make sure the parent component has valid contextData
2. The `contextPath` on the parent component is correctly set 
3. Check the parent-child relationship is properly established

### Component Freezing
If the application freezes when selecting MapComponent:
1. Make sure your data structure isn't too deeply nested
2. Try using smaller samples of data while building your layout

### Context Paths Not Working
If context paths don't seem to work:
1. Try using the array notation for array items: `results[0]`
2. Make sure paths are correctly separated with dots: `user.name.first`
3. Use the browser console to check for context propagation errors 