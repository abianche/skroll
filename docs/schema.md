# Story Schema

This repository uses JSON files to describe interactive stories. The schema lives in `packages/schema/story.schema.json`.

## Top-level structure

A story document contains:

- **`variables`** – object of initial variables keyed by name.
- **`start`** – id of the starting node.
- **`nodes`** – array of all story nodes.

## Nodes

Each entry in `nodes` describes a single state in the story:

- `id` – unique identifier for the node.
- `text` – narrative text displayed for the node.
- `set` – optional object assigning variables to specific values.
- `inc` – optional object incrementing numeric variables.
- `choices` – array of choices presented to the reader.
- `end` – optional boolean marking the node as terminal.

### Choices

Choices link nodes together.

- `text` – label shown to the reader.
- `next` – id of the node that follows when the choice is taken.
- `if` – optional string expression. When it evaluates to `true` the choice is available.

## Example

```json
{
  "variables": { "geiger": 0 },
  "start": "door",
  "nodes": [
    {
      "id": "door",
      "text": "You stand before the sealed bunker door.",
      "choices": [
        { "text": "Open the door", "next": "outside" },
        { "text": "Go back to bed", "next": "bed" }
      ]
    }
  ]
}
```

See [`assets/samples/bunker.story.json`](../assets/samples/bunker.story.json) for a more complete example that validates against the schema.
