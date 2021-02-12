# Kanban: A Kanban Board for VS Code

Visual way to keep track of your progress and boost productivity for your projects.

![Kanban Animation](https://i.giphy.com/media/1yDS3RXAonwdg5Cy9J/giphy.webp)

## Using Kanban

Kanban automatically creates a kanban board for each workspace you use. To view this board, click the `Kanban` button on the bottom right of the status bar or enter `Kanban: View` in the Command Pallete `(ctrl+shift+P)`.

## Extension Settings

* `kanban.showViewButton`: Display the `Kanban` button on the bottom right that lets you view your board.

## Release Notes

### 1.0.0

Initial release.

## Wishlist

Below is a list of features or fixes I would like to add to this extension at some point in the future. If you've got an idea or implementation for a feature to add, feel free to message me or submit a pull request.

* Add ability to perform all operations on the board with a keyboard (accessibility)
  * Currently you can save `(ctrl+S)` and undo `(ctrl+Z)`
* Update icon colors immediately when color theme is changed
* Update settings immediately, rather than on next startup
* Periodically scan comments for *TODO*s and *FIXME*s and add them to a corresponding column on the board
