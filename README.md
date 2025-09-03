# ResumeAI - AI-Powered Resume Tailoring Platform

<div align="center">

![ResumeAI Logo](public/next.svg)

**Transform your resume with AI-powered job-specific tailoring**

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Google AI](https://img.shields.io/badge/Google-Gemini_AI-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

## 🚀 Features

- **🤖 AI-Powered Tailoring**: Uses Google Gemini AI to optimize resumes for specific job descriptions
- **📁 Multiple File Formats**: Supports DOCX, TXT, and PDF file uploads
- **🔍 Smart Analysis**: Provides match scores and optimization recommendations
- **📊 Resume History**: Track and manage all your tailored resumes
- **🗑️ Soft Delete**: Safely trash and restore resumes with automatic cleanup
- **⚡ Performance Optimized**: MongoDB indexes, rate limiting, and caching
- **🛡️ Security First**: Input validation, sanitization, and XSS protection
- **✅ Fully Tested**: Comprehensive test suite with 70%+ coverage
- **📱 Responsive Design**: Beautiful UI with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes     │    │   Database      │
│   (Next.js)     │◄──►│   (Validation)   │◄──►│   (MongoDB)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   AI Service     │
                    │   (Google AI)    │
                    └──────────────────┘
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **MongoDB** (Atlas or local)
- **Google AI API Key** ([Get one here](https://ai.google.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/resumai.git
   cd resumai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/resumai
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   ADMIN_SECRET=your_admin_secret_for_database_management
   NODE_ENV=development
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   ```

5. **Run tests (optional)**
   ```bash
   npm test
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📖 Usage

### Basic Workflow

1. **Upload Resume**: Drag & drop or select your resume file (DOCX/TXT/PDF)
2. **Add Job Details**: Enter job title, description, and optional job posting URL
3. **AI Tailoring**: Click "Generate AI-Tailored Resume" for instant optimization
4. **Review Results**: Compare original vs. tailored versions side-by-side
5. **Save & Export**: Download or copy your optimized resume

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/resumes/add` | POST | Create new resume entry |
| `/api/resumes/history` | GET | Get recent resumes |
| `/api/resumes/tailor-resume` | POST | AI-tailor a resume |
| `/api/resumes/parse-file` | POST | Parse uploaded file |
| `/api/resumes/delete` | DELETE | Soft delete resume |
| `/api/resumes/restore` | POST | Restore deleted resume |

### Rate Limits

- **General API**: 100 requests per 15 minutes
- **AI Tailoring**: 10 requests per 15 minutes
- **File Upload**: 20 requests per 15 minutes

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run CI tests
npm run test:ci
```

### Test Coverage

- **API Routes**: Input validation, error handling, rate limiting
- **Components**: User interactions, file uploads, form validation
- **Services**: Database operations, AI integration
- **Utilities**: File parsing, data sanitization

## 🛠️ Database Management

### Health Check
```bash
npm run db:health
```

### Manual Cleanup
```bash
npm run db:cleanup
```

### Database Schema

```typescript
interface ResumeDocument {
  _id: ObjectId;
  jobTitle: string;
  jobLink?: string;
  jobDescription: string;
  originalResume: string;
  tailoredResume?: string;
  trashed: boolean;
  trashedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Analytics
  viewCount?: number;
  downloadCount?: number;
  lastAccessed?: Date;
  
  // AI Metadata
  aiModel?: string;
  processingTime?: number;
  matchScore?: number;
}
```

## 🔐 Security

- **Input Validation**: Zod schemas for all endpoints
- **Sanitization**: DOMPurify for XSS protection
- **Rate Limiting**: IP-based request throttling
- **Authentication**: Admin endpoints protected
- **Environment**: Secrets never committed to repo

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Environment Variables**: Add all `.env.local` variables to Vercel
3. **Database**: Ensure MongoDB Atlas is accessible
4. **Deploy**: Automatic deployments on push to main

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📊 Performance

### Database Optimizations

- **Indexes**: Optimized for common query patterns
- **TTL**: Automatic cleanup of trashed items (30 days)
- **Connection Pooling**: Efficient MongoDB connections
- **Background Processing**: Non-blocking index creation

### Frontend Optimizations

- **Code Splitting**: Lazy-loaded components
- **Image Optimization**: Next.js automatic optimization
- **Caching**: Static assets and API responses
- **Bundle Analysis**: Webpack bundle analyzer

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- **ESLint**: Enforced code style
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Tests**: Required for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI** for Gemini API
- **Vercel** for Next.js framework
- **MongoDB** for database platform
- **Tailwind CSS** for styling system

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/resumai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/resumai/discussions)
- **Email**: your.email@example.com

---

<div align="center">

**Made with ❤️ by [Your Name]**

[⭐ Star this repo](https://github.com/yourusername/resumai) if it helped you!

</div>
