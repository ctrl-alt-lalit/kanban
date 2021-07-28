declare var acquireVsCodeApi: Function; // linked by VSCode at runtime

type ColumnJSON = {title: string, ntasks: number, tasks: string[]};
type KanbanJSON = {ncols: number, cols: ColumnJSON[], settings?: any};
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

const currentlyDraggedTask = {
    text: '',
    column: document.createElement('div'),
    taskBelowIndex: -1,
    height: 0,
    yOffset: 0,
    distFromCenter: 0
};

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

    window.addEventListener('resize', ()=>{resizeColumns();});

    //autosave every second
    setInterval(() => {
        if (autosave) {
            saveData();
        }
    }, 1000);

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
            column.querySelector('.tasks')!.appendChild(makeTask(taskText));
        });
    });

    if (savedData.settings?.autosave) {
        updateAutosave(true);
    } else {
        updateAutosave(false);
    }
}

/**
 * Updates the autosave variable and icon to match the value of `save`.
 * 
 * @param save true to enable autosave, false to disable it
 */
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
        const tasks = Array.from(column.querySelectorAll('.tasks .task'));
        const col: ColumnJSON = {
            title: column.querySelector('.header > h2')!.innerHTML,
            ntasks: tasks.length,
            tasks: tasks.map(task => {return (<HTMLTextAreaElement>task.querySelector('div > textarea')!).value;})
        };
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
    const column = document.createElement('div');
    column.className = 'col';

    const tasks = document.createElement('div');
    tasks.classList.add('tasks');

    column.addEventListener('dragover', event => {
        event.preventDefault();
        const {yOffset, height} = currentlyDraggedTask;
        const taskArr = Array.from(tasks.getElementsByClassName('task')) as HTMLDivElement[];

        const indexAbove = getClosestTaskIndex(tasks, event.clientY - yOffset - height);
        for (let i = 0; i < Math.min(indexAbove, taskArr.length); ++i) {
            taskArr[i].style.transform = 'translateY(0px)'; 
        }

        const indexBelow = getClosestTaskIndex(tasks, event.clientY - yOffset);
        currentlyDraggedTask.taskBelowIndex = indexBelow;
        if (indexBelow !== -1) {
            for (let i = indexBelow; i < taskArr.length; ++i) {
                taskArr[i].style.transform = `translateY(${height}px)`; 
            }
        }
    });

    column.addEventListener('dragenter', () => {
        for (const task of <HTMLDivElement[]>Array.from(tasks.getElementsByClassName('task'))) {
            task.style.transition = 'transform 0.5s';
        }
    });

    column.addEventListener('dragleave', event => {
        event.preventDefault();
        const taskArr = Array.from(tasks.getElementsByClassName('task'));
        for (const task of <HTMLDivElement[]>taskArr) {
            task.style.transform = 'translateY(0)';
        }
    });

    column.addEventListener('drop', () => {
        for (const elem of <HTMLDivElement[]>Array.from(tasks.getElementsByClassName('task'))) {
            elem.style.transition = 'transform 0s';
            elem.style.transform = 'translateY(0)';
        }
    });

    const header = document.createElement('div');
    header.className = 'header';

    const headerText = document.createElement('h2');
    headerText.contentEditable = 'true';
    headerText.innerHTML = title;

    const addTask = document.createElement('a');
    addTask.addEventListener('click', () => {
        tasks.appendChild(makeTask(''));
    });
    addIcon(addTask, 'add', 'Create Task');

    const delCol = document.createElement('a');
    delCol.addEventListener('click', () => {
        removeColumn(column);
    });
    addIcon(delCol, 'trash', 'Remove Column');


    header.append(headerText, addTask, delCol);

    

    column.append(header, tasks);
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

    task.addEventListener('dragstart', (event) => {
        task.classList.add('dragging');
        currentlyDraggedTask.text = taskText.querySelector('textarea')!.value;
        currentlyDraggedTask.height = task.clientHeight;
        window.requestAnimationFrame(() => {task.style.display = 'none';});
        currentlyDraggedTask.yOffset = event.offsetY - task.clientHeight / 2;
    });

    task.addEventListener('dragend', () => {
        task.classList.remove('dragging');
        const col = currentlyDraggedTask.column;
        const tasks = col.querySelector('.tasks')!;
        const index = currentlyDraggedTask.taskBelowIndex;
        if (index === -1) {
            tasks.appendChild(makeTask(currentlyDraggedTask.text));
        } else {
            tasks.insertBefore(
                makeTask(currentlyDraggedTask.text),
                Array.from(tasks.getElementsByClassName('task'))[index]
            );
        }
        task.remove();
    });

    const taskText = document.createElement('div');
    taskText.classList.add('grow-wrap');
    taskText.innerHTML = `<textarea placeholder="Add your own text here!">${text}</textarea>`;
    
    //sync div with textarea on page load and on input
    taskText.dataset!.replicatedValue = taskText.querySelector('textarea')?.value;
    taskText.addEventListener('input', () => {
        taskText.dataset!.replicatedValue = taskText.querySelector('textarea')?.value;
    });
    
    const delTask = document.createElement('a');
    delTask.addEventListener('click', () => {
        deleteElement(task);
    });
    addIcon(delTask, 'trash', 'Delete Task');

    const delTaskDiv = document.createElement('div');
    delTaskDiv.appendChild(delTask);

    task.append(taskText, delTaskDiv);
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
function getClosestTaskIndex(tasks: HTMLDivElement, y: number) {
    let closestOffset = Number.NEGATIVE_INFINITY;
    let closestIndex: number = -1;
    const taskArr = Array.from(tasks.getElementsByClassName('task'));
    
    for (let i = 0; i < taskArr.length; ++i) {
        const task = taskArr[i];
        const box = task.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closestOffset) {
            closestOffset = offset;
            closestIndex = i;
        }
    }

    return closestIndex;
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
}

/**
 * Actually add the event listeners, rather than just defining how to do so.
 */
addListeners();



//BUG: dragging between columns deletes task