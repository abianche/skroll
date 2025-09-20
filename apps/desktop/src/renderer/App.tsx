import { Anchor, Container, Divider, Group, Title } from "@mantine/core";
import { NavLink, Route, Routes } from "react-router-dom";

import { EditorPage } from "./pages/Editor";
import { HomePage } from "./pages/Home";
import { PlayerPage } from "./pages/Player";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/editor", label: "Editor" },
  { to: "/player", label: "Player" },
];

export default function App() {
  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="center" mb="md">
        <Title order={1}>Skroll</Title>
        <Group gap="md">
          {navLinks.map((link) => (
            <Anchor
              key={link.to}
              component={NavLink}
              to={link.to}
              style={({ isActive }) => ({
                fontWeight: isActive ? 700 : 500,
              })}
            >
              {link.label}
            </Anchor>
          ))}
        </Group>
      </Group>
      <Divider mb="xl" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/player" element={<PlayerPage />} />
      </Routes>
    </Container>
  );
}
