import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';
import { authAPI } from './lib/api';
import Layout from './components/Layout';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogCreate from './pages/BlogCreate';
import Ideas from './pages/Ideas';
import SecurityTools from './pages/SecurityTools';

export default function App() {
  const { isAuthenticated, login, token } = useAuthStore();

  // Auto-register anonymous identity on first visit
  useEffect(() => {
    if (!isAuthenticated) {
      authAPI.register().then(login).catch(console.error);
    }
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <div className="scanline-overlay min-h-screen">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="chat" element={<Chat />} />
            <Route path="resources" element={<Resources />} />
            <Route path="resources/:id" element={<ResourceDetail />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/new" element={<BlogCreate />} />
            <Route path="blog/:id" element={<BlogPost />} />
            <Route path="ideas" element={<Ideas />} />
            <Route path="tools" element={<SecurityTools />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
