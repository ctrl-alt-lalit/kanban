# Kanban: A Kanban Board for VS Code

![Build Status](https://github.com/lbauskar/kanban/actions/workflows/main.yml/badge.svg)

A visual way to keep track of your progress and boost productivity for your projects.

![Kanban Demo](https://raw.githubusercontent.com/lbauskar/kanban/main/images/demo.gif)
Make, edit, and organize your goals in whatever way works best for you!

## Using Kanban

Kanban automatically creates a kanban board for each workspace you use. To view this board, click the `Kanban` button on the status bar or enter `Kanban: View` in the Command Pallete `(ctrl+shift+P)`.

## Extension Settings

-   `kanban.statusButton.alignment`: Show `Kanban` on the left or right side of your status bar. Or don't show it at all.
-   `kanban.statusButton.priority`: Where the `Kanban` button should be in relation to other status bar items. A higher number means further left.
-   `kanban.saveFiles.pathPreferences`: An array of absolute or relative file paths. `Kanban` will try to load files in this array's order and will stop on first success. `Kanban` will also attempt to save to whatever file it loaded from.

## Release

See [Changelog](CHANGELOG.md)
