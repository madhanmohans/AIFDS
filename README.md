# AI-Powered Front-End Development Studio

A visual drag-and-drop interface for rapidly creating UI components with API integration and code generation across multiple tech stacks.

## 🚀 Features

- **Drag-and-Drop UI Building**: Intuitive visual interface to create complex layouts
- **Component Library**: Pre-built components including Typography, Button, Card, Image, Flexbox, Stack, Section and more
- **API Integration**: Connect components to real endpoints with live data preview
- **Context Data Propagation**: Pass data between parent and child components
- **Multi-Tech Stack**: Generate code for React, React-TypeScript, Vue.js, and Angular
- **Complete Project Export**: Download fully configured, ready-to-run projects
- **Design Persistence**: Save and load designs as JSON files

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Integration](#api-integration)
- [Context Data](#context-data)
- [Code Generation](#code-generation)
- [Tech Stack](#tech-stack)
- [License](#license)

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-frontend-dev-studio.git

# Navigate to project directory
cd ai-frontend-dev-studio

# Install dependencies
npm install

# Start the development server
npm start
```

## 💻 Usage

### Basic Component Creation

1. Browse available components in the left sidebar
2. Drag and drop components onto the canvas
3. Select a component to edit its properties in the right panel
4. Components can be nested by dragging one into another

### Component Configuration

- Select any component to see its properties in the right panel
- Common properties include:
  - Width, height, and max-width
  - Margin and padding
  - Color and typography options
  - Content alignment

## 🔌 API Integration

The playground includes powerful API integration capabilities:

### Configuring an API Call

1. Select any component and click the API configuration button (globe icon)
2. Enter the API endpoint URL (e.g., `https://jsonplaceholder.typicode.com/users`)
3. Select the request method (GET, POST, etc.)
4. Add headers or request payload if needed
5. Click "Execute API Call" to fetch data

### Example: Displaying API Data in Components

```jsx
// 1. Configure API call on a parent component (e.g., Section)
// API: https://jsonplaceholder.typicode.com/users

// 2. Add a MapComponent inside the Section
// Set dataPath to "." to use the entire response

// 3. Add child components inside the MapComponent
// Example: Typography component with contextPath "name"
// This will display each user's name from the API response

// Generated code will look like:
function UserList() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then(res => res.json())
      .then(result => setData(result));
  }, []);
  
  return (
    <div>
      {data.map((item, index) => (
        <Typography key={index}>
          {item.name}
        </Typography>
      ))}
    </div>
  );
}
```

## 🔄 Context Data

Context is how data flows between components:

### Using Context Paths

1. After making an API call on a parent component, data becomes available as "context"
2. In child components, use the "Context Path" setting to extract specific data
3. For example, if your API returns user objects, use context paths like:
   - `name` - Access the name property
   - `address.city` - Access nested properties
   - `posts[0].title` - Access array items and their properties

### Example Context Path Usage

```
API Response:
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "address": {
        "city": "New York"
      }
    },
    ...
  ]
}

Context Path Examples:
- "users[0].name" => "John Doe"
- "users[0].address.city" => "New York"
- "users" => The entire users array, useful for MapComponent
```

## 📦 Code Generation

### Generating and Running Your Application

1. Build your UI using components and connect to APIs
2. Click the "Generate Code" button in the top bar
3. Select your desired tech stack (React, Vue, Angular)
4. Download the generated ZIP file
5. Extract and run the application:

```bash
# Extract the ZIP file
unzip react-project.zip -d my-app

# Navigate to the app directory
cd my-app

# Install dependencies
npm install

# Start the application
npm start

# Your app will be running at http://localhost:3000
```

### What's Included in the Generated Project

- Complete project structure
- All necessary dependencies in package.json
- Component code with proper API integration
- README with setup instructions
- CSS for styling

## 🧰 Tech Stack

- **Frontend**: React, Material UI
- **State Management**: React Context API
- **Code Generation**: Custom template engine
- **Export Format**: ZIP with complete project structure

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
