export const DEFAULT_SCRIPT_SOURCE = `:::meta
id: "new-story"
locale: "en-US"
version: 1
:::

story introduction:
  config:
    starting_scene = opening

  scene opening:
    beat arrival:
      say narrator "Welcome to your new Skroll project."
      stage "Add beats, scenes, and choices to craft your branching narrative."
      choice:
        option "Continue" goto next_step

    beat next_step:
      say narrator "Edit this script to begin your story."
      end
`;
