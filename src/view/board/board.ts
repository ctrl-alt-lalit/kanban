declare var acquireVsCodeApi: Function; // linked by VSCode at runtime

type ColumnJSON = {title: string, ntasks: number, tasks: string[]};
type KanbanJSON = {ncols: number, cols: ColumnJSON[], settings?: {autosave?: boolean}};
type HistoryJSON = {type: string, parent: HTMLDivElement, position: number, data: (string | ColumnJSON)};

/**
 * Wrapper class to send messages to VSCode API
 */
class MessageSender {
    static vscode = acquireVsCodeApi();

    static send(command: string, data: any) {
        this.vscode.postMessage({
            command: command,
            data: data
        });
    }
}

/**
 * Keeps track of what keys are pressed.
 * 
 * Maps a key name to boolean of whether it is pressed or not. For example,
 * if the 's' key was pushed down, then `keysPressed['s'] = true`.
 */
const keysPressed: Map<string, boolean> = new Map();

/**
 * List of elements deleted by the user.
 * 
 * Elements at the end of the list have been deleted more recently.
 */
const deleteHistory: HistoryJSON[] = [];

let autosave = false;

/**
 * Adds event listeners to the 'Kanban: View' page.
 * 
 * Includes:
 * - mouse listeners for clickable UI elements (i.e. buttons)
 * - mouse listeners for dragging tasks
 * - keyboard listeners for shortcuts
 * - window listener for resizing
 * - VSCode API listener to load data
 */
function addListeners() {
    
    // key is pressed
    document.addEventListener('keydown', event => {
        keysPressed.set(event.key, true);

        // ctrl+s or ctrl+z is pressed
        if (keysPressed.get('Control') && event.key === 's') {
            saveData();
        } else if (keysPressed.get('Control') && event.key === 'z') {
            restoreElement();
        }
    });

    // key is released
    document.addEventListener('keyup', event => {
        keysPressed.set(event.key, false);
    });

    // listen for message from VSCode API
    window.addEventListener('message', event => {
        const message: {command: string, data: any} = event.data;
        switch (message.command) {
            case 'load':
                loadData(message.data);
                break;
        }
    });

    // listen for window resizing
    window.addEventListener('resize', () => {
        resizeColumns();
    });

    // 'Add Column' button clicked
    const addCol = document.getElementById('add-col')!;
    addCol.addEventListener('click', () => {
        const board = document.getElementById('board')!;
        appendColumn(`Column ${board.children.length + 1}`);
    });

    // 'Save' button clicked
    const saveBtn = document.getElementById('save')!;
    saveBtn.addEventListener('click', () => { //save button clicked
        saveData();
    });

    // 'Undo' button clicked
    const undoBtn = document.getElementById('undo')!;
    undoBtn.addEventListener('click', () => {
        restoreElement();
    });

    const autosaveBtn = document.getElementById('autosave')!;
    autosaveBtn.addEventListener('click', () => {
        updateAutosave(!autosave);
    });
}


/**
 * Takes the serialized kanban board JSON and renders it onto the DOM.
 */
 function loadData(savedData: KanbanJSON) {
    const columns = document.getElementsByClassName('col');
    const board = document.getElementById('board')!;
    while (columns.length > 0) {
        board.removeChild(columns[0]);
    }

    savedData.cols.forEach(col => {
        const column = appendColumn(col.title);
        col.tasks.forEach(taskText => {
            column.appendChild(makeTask(taskText));
        });
    });

    if (savedData.settings?.autosave) {
        updateAutosave(true);
    } else {
        updateAutosave(false);
    }
}

function updateAutosave(save: boolean) {
    if (save === autosave) {
        return;
    }

    autosave = save;
    const element = document.getElementById('autosave')!;
    const iconClasses = element?.firstElementChild?.classList!;
    if (save) {
        element.title = 'Autosave';
        iconClasses.remove('codicon-sync-ignored');
        iconClasses.add('codicon-sync');
    } else {
        element.title = "Don't autosave";
        iconClasses.remove('codicon-sync');
        iconClasses.add('codicon-sync-ignored');
    }
}

/**
 * Serializes the current state of the kanban board then sends it to
 * the VSCode API to be stored in the workspace. 
 */
 function saveData() {
    const columns = document.getElementById('board')!.children;
    const data: KanbanJSON = {
        ncols: columns.length,
        cols: [],
        settings: {
            autosave: autosave
        }
    };

    for (const column of Array.from(columns)) {
        const children = column.children;
        const col: ColumnJSON = {
            title: '',
            ntasks: children.length - 1,
            tasks: []
        };

        for (const child of Array.from(children)) {
            if (child.className === 'header') {
                col.title = child.firstElementChild!.innerHTML;
            } else {
                col.tasks.push(child.firstElementChild!.innerHTML);
            }
        }

        data.cols.push(col);
    }

    MessageSender.send('save', data);
}

/**
 * Creates an empty column with the given title and adds it to the right
 * of the kanban board.
 * 
 * @see makeColumn
 * 
 * @param title text shown at the top of the column
 * @returns the new column
 */
 function appendColumn(title: string) {
    const column = makeColumn(title);
    document.getElementById('board')!.appendChild(column);
    resizeColumns();
    return column;
}

/**
 * Creates an empty column -- one with no tasks inside -- that has the given title.
 *  
 * @param title text shown at the top of the column
 * @returns the new column
 */
 function makeColumn(title: string) {
    let column = document.createElement('div');
    column.className = 'col';

    column.addEventListener('dragover', event => {
        event.preventDefault();
        const draggable = document.getElementsByClassName('dragging')[0];
        const taskBelow = getClosestTask(column, event.clientY);
        if (taskBelow === null) {
            column.appendChild(draggable);
        } else {
            column.insertBefore(draggable, taskBelow);
        }
    });

    const header = document.createElement('div');
    header.className = 'header';

    const headerText = document.createElement('h2');
    headerText.contentEditable = 'true';
    headerText.innerHTML = title;

    const addTask = document.createElement('a');
    addTask.addEventListener('click', () => {
        column.appendChild(makeTask('Add your own text here!'));
    });
    addIcon(addTask, 'add', 'Create Task');

    const delCol = document.createElement('a');
    delCol.addEventListener('click', () => {
        removeColumn(column);
    });
    addIcon(delCol, 'trash', 'Remove Column');


    header.append(headerText, addTask, delCol);
    column.appendChild(header);
    return column;
}

function addIcon(element: HTMLAnchorElement, iconName: string, label: string) {
    const icon = document.createElement('i');
    icon.classList.add('codicon', `codicon-${iconName}`);
    icon.title = label;
    element.appendChild(icon);
}

/**
 * Creates a task with the given text.
 * 
 * @param text text the task will show
 * @returns the new task
 */
 function makeTask(text: string) {
    const task = document.createElement('div');
    task.className = 'task';
    task.draggable = true;

    task.addEventListener('dragstart', () => {
        task.classList.add('dragging');
    });

    task.addEventListener('dragend', () => {
        task.classList.remove('dragging');
    });

    const taskText = document.createElement('p');
    taskText.contentEditable = 'true';
    taskText.innerHTML = text;

    const delTask = document.createElement('a');
    delTask.addEventListener('click', () => {
        deleteElement(task);
    });
    addIcon(delTask, 'trash', 'Delete Task');

    task.append(taskText, delTask);
    return task;
}

/**
 * Removes a column from the kanban board.
 * 
 * The column is removed via deleteElement, so it can be recovered.
 * The other columns have their width adjusted to accomodate for the deletion
 * of this one.
 * 
 * @param column column being removed
 */
 function removeColumn(column: HTMLDivElement) {
    deleteElement(column);
    resizeColumns();
}

/**
 * Find the task object in `column` that is closest to the vertical position `y`.
 * 
 * @param column column task must be in
 * @param y vertical position in pixels
 * @returns task in `column` closest to `y` position
 */
 function getClosestTask(column: HTMLDivElement, y: number) {
    let closestOffset = Number.NEGATIVE_INFINITY;
    let closestTask: HTMLDivElement | null = null;
    const tasks = document.getElementsByClassName('task');
    
    for (const task of Array.from(tasks)) {
        if (column !== task.parentNode) {
            continue;
        }

        const box = task.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closestOffset) {
            closestOffset = offset;
            closestTask = <HTMLDivElement> task;
        }
    }

    return closestTask;
}

/**
 * Makes all the columns have equal width.
 * 
 * More specifically, if the kanban board has a width of `w` and there are `n` columns
 * in the board, then each column will have a width of `w/n` after this function has been called.
 */
 function resizeColumns() {
    const board = document.getElementById('board')!;
    const columns = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName('col');
    for (const column of Array.from(columns)) {
        column.style.width = board.clientWidth / columns.length + 'px';
        column.style.maxWidth = column.style.width;
        column.style.minWidth = column.style.maxWidth;
    }
}

/**
 * Serializes a task or column for potential restoration later, then removes it from the DOM.
 * 
 * @param element task or column to delete
 */
 function deleteElement(element: HTMLDivElement) {
    const save: HistoryJSON = {
        type: element.className,
        parent: <HTMLDivElement> element.parentNode,
        position: 0,
        data: ''
    };

    //determine position of element
    let siblings = element.parentNode!.children;
    for (let i = 0; i < siblings.length; ++i) {
        if (siblings[i].isSameNode(element)) {
            save.position = i;
            break;
        }
    }

    if (save.type === 'task') { // save task
        save.data = element.firstElementChild!.innerHTML;
    } else { // save column and child tasks
        const colJSON: ColumnJSON = {
            title: '',
            ntasks: 0,
            tasks: []
        };
        const children = element.children;
        for (const child of Array.from(children)) {
            if (child.className === 'header') {
                colJSON.title = child.firstElementChild!.innerHTML;
            } else {
                colJSON.tasks.push(child.firstElementChild!.innerHTML);
                colJSON.ntasks++;
            }
        }
        save.data = colJSON;
    }

    deleteHistory.push(save);
    element.remove();
}

/**
 * Deserializes the most recently deleted task or column and puts it back into the DOM
 * to where it was before it was deleted.
 */
 function restoreElement() {
    if (history.length === 0) {
        return;
    }

    const restore: HistoryJSON = deleteHistory.pop()!;
    let element: HTMLDivElement;
    if (restore.type === 'task') {
        element = makeTask(<string> restore.data);
    } else {
        const colJSON = <ColumnJSON> restore.data;
        element = makeColumn(colJSON.title);
        colJSON.tasks.forEach(taskText => {
            element.appendChild(makeTask(taskText));
        });
    }

    //put in right position
    const siblings = restore.parent.children;
    if (restore.position === siblings.length) {
        restore.parent.appendChild(element);
    } else {
        restore.parent.insertBefore(element, siblings[restore.position]);
    }

    if (restore.type === 'col') {
        resizeColumns();
    }
}

/**
 * Actually add the event listeners, rather than just defining how to do so.
 */
 addListeners();

