import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("rail-fence", "routes/rail-fence.tsx"),
    route("rsa", "routes/rsa.tsx"),
    route("md5", "routes/md5.tsx"),
    route("sha2", "routes/sha2.tsx"),
    route("login", "routes/login.tsx"),
    route("signup", "routes/signup.tsx"),
    route("logout", "routes/logout.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("profile", "routes/profile.tsx"),
    route("change-password", "routes/change-password.tsx"),
  ]),
] satisfies RouteConfig;
