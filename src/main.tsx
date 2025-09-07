import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import App from './App';

const theme = createTheme({
  fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
  defaultRadius: 'md',
  primaryColor: 'blue',
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
