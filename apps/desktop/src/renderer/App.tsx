import { NavLink, Route, Routes } from "react-router";
import { Container } from "./components/ui/container";
import { Separator } from "./components/ui/separator";

import { EditorPage } from "./pages/Editor";
import { HomePage } from "./pages/Home";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/editor", label: "Script" },
];

export default function App() {
  return (
    <Container size="lg" py="xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Skroll</h1>
        <nav className="flex gap-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Separator className="mb-6" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </Container>
  );
}
