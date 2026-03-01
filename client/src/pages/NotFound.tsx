import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-creepy text-accent text-glow-red">404</h1>
        <p className="mb-2 text-lg font-terminal text-primary text-glow">
          ERROR: Route not found
        </p>
        <p className="mb-6 text-sm font-mono text-muted-foreground">
          $ ls {location.pathname}<br />
          <span className="text-accent">Permission denied or path does not exist.</span>
        </p>
        <Link
          to="/"
          className="px-4 py-2 border border-primary/30 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 font-terminal text-sm tracking-wider transition-colors"
        >
          cd /home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
