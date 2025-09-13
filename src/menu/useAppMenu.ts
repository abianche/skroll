import { useEffect, useRef } from 'react';
import { Menu, Submenu, MenuItem, CheckMenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';
import { getCurrentWindow } from '@tauri-apps/api/window';

type Recent = { path: string; lastOpenedAt: number }[];

type Handlers = {
  onOpen: () => Promise<void>;
  onSave: () => Promise<void>;
  onSaveAs: () => Promise<void>;
  onReset: () => Promise<void>;
  onToggleAutosave: (next: boolean) => Promise<void> | void;
};

export function useAppMenu(autosave: boolean, handlers: Handlers) {
  const appWindow = getCurrentWindow();
  const recentMenuRef = useRef<Submenu | null>(null);
  const autosaveRef = useRef<CheckMenuItem | null>(null);
  const fileMenuRef = useRef<Submenu | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const openItem = await MenuItem.new({
          id: 'file.open',
          text: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          action: handlers.onOpen,
        });
        const saveItem = await MenuItem.new({
          id: 'file.save',
          text: 'Save',
          accelerator: 'CmdOrCtrl+S',
          action: handlers.onSave,
        });
        const saveAsItem = await MenuItem.new({
          id: 'file.saveAs',
          text: 'Save As…',
          accelerator: 'Shift+CmdOrCtrl+S',
          action: handlers.onSaveAs,
        });
        const autosaveItem = await CheckMenuItem.new({
          id: 'file.autosave',
          text: 'Autosave',
          checked: autosave,
          action: async () => {
            const next = !(await autosaveItem.isChecked());
            await autosaveItem.setChecked(next);
            await handlers.onToggleAutosave(next);
          },
        });
        autosaveRef.current = autosaveItem;

        recentMenuRef.current = await Submenu.new({
          id: 'file.recent',
          text: 'Recent Files',
          items: [],
        });
        const clearRecentItem = await MenuItem.new({
          id: 'file.recent.clear',
          text: 'Clear Recent',
        });

        const reset = await MenuItem.new({
          id: 'game.reset',
          text: 'Reset',
          action: handlers.onReset,
        });
        const game = await Submenu.new({ id: 'game', text: 'Game', items: [reset] });

        const menu = await Menu.default();

        // Find existing default File menu if present, otherwise create our own
        let fileMenu: Submenu | null = null;
        try {
          const byId = await menu.get('file');
          if (byId) fileMenu = byId as Submenu;
        } catch {
          // ignore
        }
        try {
          const topItems = await menu.items();
          for (const it of topItems) {
            try {
              const title = await (it as Submenu).text();
              if (title.toLowerCase() === 'file') {
                fileMenu = it as Submenu;
                break;
              }
            } catch {
              // not a submenu
            }
          }
        } catch {
          // ignore
        }

        if (!fileMenu) {
          fileMenu = await Submenu.new({ id: 'file', text: 'File', items: [] });
          await menu.append(fileMenu);
        }
        fileMenuRef.current = fileMenu;

        // Add a separator before our items to keep defaults intact
        try {
          const sep = await PredefinedMenuItem.new({ item: 'Separator' });
          await fileMenu.append(sep);
        } catch {
          // ignore
        }

        await fileMenu.append([
          openItem,
          saveItem,
          saveAsItem,
          autosaveItem,
          recentMenuRef.current,
          clearRecentItem,
        ]);

        // Place Game menu after View if present; otherwise append at end
        try {
          const topItems = await menu.items();
          let viewIndex = -1;
          for (let i = 0; i < topItems.length; i++) {
            const it = topItems[i];
            try {
              const title = await (it as Submenu).text();
              if (title.toLowerCase() === 'view') {
                viewIndex = i;
                break;
              }
            } catch {
              // not a submenu, ignore
            }
          }
          if (viewIndex >= 0) {
            await menu.insert(game, viewIndex + 1);
          } else {
            await menu.append(game);
          }
        } catch {
          await menu.append(game);
        }
        await menu.setAsAppMenu();
        try {
          await menu.setAsWindowMenu(appWindow);
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (autosaveRef.current) await autosaveRef.current.setChecked(autosave);
      } catch {
        // ignore
      }
    })();
  }, [autosave]);

  async function rebuildRecent(
    recent: Recent,
    onClick: (path: string) => Promise<void>,
    onClear: () => Promise<void>
  ) {
    const submenu = recentMenuRef.current;
    if (!submenu) return;
    const items = await submenu.items();
    for (let i = items.length - 1; i >= 0; i--) await submenu.removeAt(i);
    for (const entry of recent) {
      const item = await MenuItem.new({
        id: `file.recent.${entry.path}`,
        text: entry.path,
        action: () => onClick(entry.path),
      });
      await submenu.append(item);
    }
    const parent = fileMenuRef.current;
    if (!parent) return;
    const oldClear = await parent.get('file.recent.clear');
    if (oldClear) await parent.remove(oldClear);
    const clear = await MenuItem.new({
      id: 'file.recent.clear',
      text: 'Clear Recent',
      action: onClear,
    });
    await parent.append(clear);
  }

  return { rebuildRecent, recentMenuRef, autosaveRef };
}
