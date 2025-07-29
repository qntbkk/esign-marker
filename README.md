# eSign Marker

A React-based PDF signature placement tool that allows users to upload PDF documents and place draggable signature markers with coordinate tracking.

## Features

- **PDF Upload**: Upload and view PDF documents
- **Draggable Signature Markers**: Place and move signature placeholders on PDF pages
- **Coordinate Tracking**: Real-time coordinate logging with x1, y1, x2, y2 positions
- **Export Functionality**: Export coordinate logs as text files
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd esign-marker
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

## Usage

1. **Upload PDF**: Click the "Upload PDF" button and select a PDF file
2. **Add Signatures**: Click "Add Signature" to create draggable signature placeholders
3. **Position Markers**: Drag the yellow signature boxes to desired positions
4. **View Coordinates**: Check the coordinate log panel for real-time position data
5. **Export Log**: Export coordinate information as a text file

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Build for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Technologies Used

- React 18
- Tailwind CSS
- Lucide React (icons)
- Create React App

## License

This project is licensed under the MIT License.
