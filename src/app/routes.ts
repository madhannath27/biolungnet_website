import { createBrowserRouter } from "react-router";
import { AuthPage }         from "./pages/auth-page";
import { DisclaimerPage }   from "./pages/disclaimer-page";
import { ProfileSetupPage } from "./pages/profile-setup-page";
import { UploadPage }       from "./pages/upload-page";
import { ProcessingPage }   from "./pages/processing-page";
import { ResultPage }       from "./pages/result-page";
import { DashboardPage }    from "./pages/dashboard-page";

export const router = createBrowserRouter([
  { path: "/",               Component: AuthPage },
  { path: "/disclaimer",     Component: DisclaimerPage },
  { path: "/profile-setup",  Component: ProfileSetupPage },
  { path: "/upload",         Component: UploadPage },
  { path: "/processing",     Component: ProcessingPage },
  { path: "/result/:scanId", Component: ResultPage },
  { path: "/dashboard",      Component: DashboardPage },
]);
