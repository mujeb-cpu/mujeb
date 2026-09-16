import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MujeebLogo } from "@/components/mujeeb-logo";

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-5">
      <MujeebLogo />
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex gap-2">
        <Link to="/">
          <Button variant="outline">Back to home</Button>
        </Link>
        <Link to="/app">
          <Button>Open demo</Button>
        </Link>
      </div>
    </div>
  );
}
