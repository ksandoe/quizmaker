import { 
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { AuthTest } from './components/AuthTest';
import VideoForm from './components/VideoForm';
import { VideoSegmentation } from './components/VideoSegmentation';
import { Dashboard } from './components/Dashboard';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<AuthTest />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/video/new" element={<VideoForm />} />
      <Route path="/video/:videoId/segments" element={<VideoSegmentation />} />
    </>
  ),
  {
    future: {
      // These flags are not yet available in the current version of react-router-dom
      // We'll remove them for now and wait for v7 to be released
    }
  }
);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}
