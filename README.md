# Kanban: A Kanban Board for VS Code

Visual way to keep track of your progress and boost productivity for your projects.

![Kanban Animation](https://i.giphy.com/media/1yDS3RXAonwdg5Cy9J/giphy.webp)

## Using Kanban

Kanban automatically creates a kanban board for each workspace you use. To view this board, click the ```Kanban``` button on the bottom left of the status bar or enter ```Kanban: View``` in the Command Pallete ```(ctrl+shift+P)```.

## Extension Settings

 - `kanban.showViewButton`: Display the ```Kanban``` button on the bottom right that lets you view your board.

## Release Notes

### 1.1.0
 - Kanban button is on the left side of the status bar, per the VS Code API reference
 - Board uses Codicon icons rather than PNGs
   - removed ```filter.js``` and PNGs from project directory
 - Added toggle to autosave every second
 

### 1.0.6
 - Refactored ```board.ts``` by making classes for the board, column, and task html elements
 - Added a scrollbar to the column whenever too many tasks are on it to fit onscreen

### 1.0.5
 - Cleaned up source code and reorganized directories

### 1.0.4
- Fixed directory structure so compiled extension would run

### 1.0.0
- Initial release
