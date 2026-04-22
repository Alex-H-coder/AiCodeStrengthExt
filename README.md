# AiCodeStrengthExt - AI-Powered Django Code Analysis

## Project Scope

AiCodeStrengthExt is an integrated development tool designed to provide developers with intelligent code analysis and recommendations. The project consists of three main components:

### Components:

1. **Backend (Django REST API)** - Core analysis engine powered by Google's Generative AI
   - Code strength evaluation
   - Duplicate code detection
   - AI-powered recommendations
   - Integrated with Radon for complexity analysis

2. **Frontend (React + Vite)** - User-friendly interface for code analysis
   - Real-time analysis results
   - Visual strength gauges
   - Recommendations and duplicate detection display
   - Responsive design

3. **VS Code Extension** - Seamless integration with VS Code
   - Displays analysis results directly in the editor
   - Shows as a sidebar panel when active and installed
   - Provides immediate feedback on code quality
   - One-click access to full analysis

## Current Status: WORK IN PROGRESS

**This extension is currently NOT FULLY FUNCTIONAL** and is actively under development. We are actively seeking collaboration and contributions from other developers to bring this project to completion.

### Known Limitations:

- [ ] Core analysis features need optimization
- [ ] VS Code extension UI refinement in progress
- [ ] Additional testing and error handling required
- [ ] Documentation and examples to be expanded
- [ ] Performance optimization pending

## Purpose

The primary goal of AiDjangoExt is to empower developers by providing:

**Code Strength Analysis** - Understand code quality metrics and complexity levels

**Error Detection** - Identify potential issues and errors before they become problems in future development

**AI-Powered Recommendations** - Get intelligent suggestions for code improvement using advanced AI

**Visual Feedback** - See code metrics and analysis in real-time within VS Code

## Contributing & Collaboration

We are actively looking for developers to help improve this project. Whether you're interested in:

- Backend optimization and API enhancements
- Frontend UI/UX improvements
- VS Code extension development
- Testing and QA
- Documentation and examples

**All contributions are welcome!** Please feel free to:

- Fork the repository
- Create feature branches
- Submit pull requests
- Open issues for bugs or feature requests
- Suggest improvements or architectural changes

## Installation & Setup

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### VS Code Extension Setup

```bash
cd vscode-extension
npm install
npm run compile
# Press F5 in VS Code to launch the extension in development mode
```

## Technologies Used

- **Backend**: Django, Django REST Framework, Google Generative AI, Radon
- **Frontend**: React, Vite, JavaScript
- **Extension**: TypeScript, VS Code API
- **Database**: SQLite (development)

## Requirements

See [backend/requirements.txt](backend/requirements.txt) for Python dependencies and [frontend/package.json](frontend/package.json) for Node.js dependencies.

## Future Improvements

As noted in the requirements, several enhancements are planned:

- Sidebar navigation panel
- Login/Logout functionality
- Analysis history for users
- More detailed AI recommendations with code snippets and documentation links
- Line numbers in duplicate detection results
- Enhanced performance metrics

## How It Works

1. **Submit Code** - Paste or upload code for analysis
2. **Analysis** - Backend processes code using multiple analysis engines
3. **Results** - View comprehensive analysis with strength metrics and recommendations
4. **Integration** - VS Code extension displays results in-editor for seamless workflow

## Get In Touch

For questions, suggestions, or collaboration inquiries, please open an issue in the repository.

---

**Note**: This project is under active development. Features and APIs may change as we work toward the v1.0 release. We appreciate your patience and contributions!
