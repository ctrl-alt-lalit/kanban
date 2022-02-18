# Changelog

## 1.5.0

-   Fixed text on right arrow to "Move Column Right" (thanks @md2perpe!)
-   Updated dependencies to work with newer versions of Jest and Typescript
-   Columns' color pallete closes when settings menu closes

## 1.4.0

-   Moved release notes to `CHANGELOG.md`
-   Add column button has beet removed and replaced with an add column bar on the right
-   Removed `kanban.showViewButton` setting
-   Added `kanban.statusButton.alignment` and `kanban.statusButton.priority` settings
    -   `alignment` lets you choose where or if the `Kanban` button is on the status bar
    -   `priority` lets you modify where the `Kanban` button is in relation to other buttons
-   Changed how to add task button looks
-   Added a revision history panel, which allows you to roll back changes you made
    -   Revision history is cleared when you close the board
    -   Removed delete notifications since their undo option has been superseded
-   Changed how autosave works internally, making it more responsive
    -   it no longer uses an interval timer
    -   it saves button-click changes immediately
    -   it saves what you typed when you stop typing for a couple seconds
-   Buttons to change a column's color and delete a column moved under a per-column settings panel
-   Added context menu for columns to support quickly adding tasks or deleting the column
-   Added buttons to move a column for each column's settings panel

## 1.3.0

-   You can now save and load from a file in addition to the workspace
    -   The file is `.vscode/kanban.json`
-   Added a settings panel where the save-to-file and autosave toggles now reside
-   Column color pickers now have opening and closing animations
-   Column color pickers now have different default swatches for light and dark mode
-   Autosaving is less aggressive, triggering at most every 5 seconds instead of for every change
-   Added icon to view button

## 1.2.0

-   Rewrote the entire project in React
-   Redesigned board to look more sleek and minimal
-   The title of the board is now editable, but it will no longer use your workspace name by default
-   Drag and drop has been improved
-   You can change a column's color
-   Tasks now render their text as markdown, so you can format them

### 1.1.2

-   Fixed bug where icon font wouldn't load

### 1.1.1

-   Changed `Add Column` and `Undo` icons to make their function clearer

## 1.1.0

-   Kanban button is on the left side of the status bar, per the VS Code API reference
-   Board uses Codicon icons rather than PNGs
    -   removed `filter.js` and PNGs from project directory
-   Added toggle to autosave every second

### 1.0.6

-   Refactored `board.ts` by making classes for the board, column, and task html elements
-   Added a scrollbar to the column whenever too many tasks are on it to fit onscreen

### 1.0.5

-   Cleaned up source code and reorganized directories

### 1.0.4

-   Fixed directory structure so compiled extension would run

## 1.0.0

-   Initial release
