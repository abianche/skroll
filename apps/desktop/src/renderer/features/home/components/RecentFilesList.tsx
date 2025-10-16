import { Button } from "../../../components/ui/button";

export type RecentFilesListProps = {
  files: string[];
  onOpen: (path: string) => void | Promise<void>;
};

export function RecentFilesList({ files, onOpen }: Readonly<RecentFilesListProps>) {
  if (files.length === 0) {
    return (
      <p className="text-muted-foreground">
        No recent files yet. Create or open a story to see it here.
      </p>
    );
  }

  return (
    <ul className="list-disc space-y-1 pl-5">
      {files.map((file) => (
        <li key={file}>
          <Button
            variant="ghost"
            className="px-0 text-left hover:underline"
            onClick={() => onOpen(file)}
          >
            {file}
          </Button>
        </li>
      ))}
    </ul>
  );
}
