<img src="https://socialify.git.ci/Sbonelo2/LPM_System/image?language=1&owner=1&name=1&stargazers=1&theme=Light" alt="LPM_System" width="640" height="320" />
# LPM System - Learner Placement Management

A comprehensive Learner Placement Management system built with React, TypeScript, and Supabase.

## Features

### Role-Based Access Control
- **Admin**: System administration and user management
- **Super Admin**: Combined QA and Coordinator functionality for placement oversight
- **Facilitator**: Training and mentorship management
- **Mentor**: Mentor dashboard and learner supervision
- **Learner**: Personal placement tracking and document management

### Core Functionality
- **User Management**: Multi-role user creation and management with automatic profile generation
- **Placement Management**: Company and placement tracking for learners
- **Document Management**: Upload, review, and approval workflows
- **Profile System**: Role-based profiles with automatic creation
- **Notifications**: Real-time notifications and alerts
- **Dashboard**: Role-specific dashboards with relevant metrics
- **Compliance Tracking**: Quality assurance and compliance monitoring

### Technical Stack
- **Frontend**: React 19.2.0 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI Components**: Custom component library with consistent design
- **Styling**: CSS with modern design patterns
- **Build Tools**: Vite + TypeScript Compiler

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase project

### Installation
```bash
# Clone the repository
git clone https://github.com/Sbonelo2/LPM_System.git
cd lpm-system

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENABLE_DUMMY_AUTH=true
```

### Development Server
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```bash
src/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── TableComponent.tsx
│   ├── InputField.tsx
│   ├── Dropdown.tsx
│   └── SideBar.tsx
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── Profile.tsx
│   ├── Documents.tsx
│   ├── Placements.tsx
│   ├── AdminUserManagement.tsx
│   ├── CoordinatorDocuments.tsx
│   └── MentorDashboard.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
│   └── useAuth.ts
├── services/           # External service integrations
│   ├── supabaseClient.ts
│   └── learnerService.ts
└── types/              # TypeScript type definitions
```

## Authentication & Authorization

### Role-Based Access
The system implements a comprehensive role-based access control:

1. **Admin**: Full system access and user management
2. **Super Admin**: Combined QA and Coordinator oversight
3. **Facilitator**: Training and mentorship capabilities
4. **Mentor**: Learner supervision and assessment
5. **Learner**: Personal placement tracking

### Profile Management
- Automatic profile creation on first login
- Role-specific profile fields
- Profile image upload and management
- Profile data synchronization across roles

### Security Features
- Row Level Security (RLS) policies
- Role-based API access control
- Secure token management
- Session management with automatic cleanup

## Database Schema

### Core Tables
- **profiles**: User profile management with role-based fields
- **placements**: Placement and company tracking
- **documents**: Document management with metadata
- **learners**: Learner-specific profiles and progress
- **notifications**: System notifications and alerts

### Relationships
- User-to-profile relationships
- Document-to-user associations
- Placement tracking with status updates

## UI/UX Features

### Responsive Design
- Mobile-first responsive design
- Consistent component styling
- Accessible navigation patterns
- Role-based sidebar navigation

### User Experience
- Real-time form validation
- Loading states and error handling
- Success feedback with notifications
- Intuitive dashboard layouts

## Development Workflow

### Code Quality
- TypeScript for type safety
- ESLint for code consistency
- Component-based architecture
- Comprehensive error handling

### Testing Strategy
- Component unit testing
- Integration testing for API calls
- End-to-end user flow testing
- Performance optimization

## Deployment

### Production Build
```bash
# Build optimized production bundle
npm run build

# Preview before deployment
npm run preview
```

### Environment Configuration
- Development: Local development with hot reload
- Staging: Pre-production testing environment
- Production: Optimized build with performance monitoring

## API Documentation

### Key Services
- **Authentication Service**: User login, registration, and session management
- **Profile Service**: CRUD operations for user profiles
- **Document Service**: Upload, download, and management
- **Placement Service**: Company and placement tracking
- **Notification Service**: Real-time alerts and updates

### Data Models
- **User**: Authentication and profile data
- **Profile**: Extended user information with role-specific fields
- **Document**: File metadata and content management
- **Placement**: Company and placement relationship tracking

## Configuration

### Build Configuration
- **Vite**: Fast development server and optimized builds
- **TypeScript**: Strict type checking and modern features
- **ESLint**: Code quality and consistency enforcement
- **Path Aliases**: Clean import paths

### Development Tools
- **Hot Module Replacement**: Fast development refresh
- **Source Maps**: Easy debugging in development
- **Code Splitting**: Optimized bundle sizes
- **Tree Shaking**: Dead code elimination

## Contributing Guidelines

### Development Standards
- Follow TypeScript best practices
- Use semantic HTML and accessible ARIA labels
- Implement proper error boundaries
- Write comprehensive unit tests
- Document component APIs

### Code Style
- Use descriptive variable names
- Implement proper TypeScript types
- Follow React hooks best practices
- Maintain consistent component patterns

### Git Workflow
- Feature branches for new development
- Descriptive commit messages
- Code review requirements
- Automated testing on pull requests

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check existing documentation and FAQs
- Review development guidelines
- Contact the development team

---

**Built with ❤️ using React, TypeScript, and Supabase**
