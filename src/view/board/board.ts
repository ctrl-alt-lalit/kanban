declare var colorToFilter: (rgbStr: string) => string; // found in filter.js
declare var acquireVsCodeApi: Function; // linked by VSCode at runtime

type ColumnJSON = {title: string, ntasks?: number, tasks: string[]};
type KanbanJSON = {ncols: number, cols: ColumnJSON[]};
type HistoryJSON = {type: string, parent: HTMLDivElement, position: number, data: (string | ColumnJSON)};

/**
 * Represents an HTMLDivElement that contains editable text for a user to 
 * write things they need to do.
 */
class Task extends HTMLDivElement {

    /**
     * Creates a task with the given text.
     * 
     * @param text text the task will show
     * @returns the new task
     */
    constructor(text: string) {
        super();
        this.draggable = true;
        this.className = "task";

        this.addEventListener("dragstart", () => {
            this.classList.add("dragging");
        });

        this.addEventListener("dragend", () => {
            this.classList.remove("dragging");
        });

        const taskText = document.createElement("p");
        taskText.contentEditable = "true";
        taskText.innerHTML = text;

        const delTask = makeButton(icons.delete, filters.textColor, filters.headerColor, "Delete Task");
        delTask.addEventListener("click", () => {
            deleteElement(this);
        });
        

        this.append(taskText, delTask);
    }

    /**
     * the editable text in this Task
     */
    get text() {
        return this.firstElementChild!.innerHTML;
    }
}

/**
 * Represents an HTMLDivElement that resides in a KanbanBoard and contains Tasks.
 */
class Column extends HTMLDivElement {
    /**
     * Creates an empty column -- one with no tasks inside -- that has the given `title`.
     *  
     * @param title text shown at the top of the column
     */
    constructor(title: string) {
        super();
        this.className = "col";

        this.addEventListener("dragover", event => {
            event.preventDefault();
            const draggable = document.getElementsByClassName("dragging")[0];
            const taskBelow = getClosestTask(this, event.clientY);
            if (taskBelow === null) {
                this.lastElementChild!.appendChild(draggable);
            } else {
                this.lastElementChild!.insertBefore(draggable, taskBelow);
            }
        });

        const header = document.createElement("div");
        header.className = "header";

        const headerText = document.createElement("h2");
        headerText.contentEditable = "true";
        headerText.innerHTML = title;

        const addTask = makeButton(icons.add, filters.backgroundColor, filters.textColor, "Create Task");
        addTask.addEventListener("click", () => {
            this.appendTask("Add your own text here!");
        });
        

        const delCol = makeButton(icons.delCol, filters.backgroundColor, filters.textColor, "Remove Column");
        delCol.addEventListener("click", () => {
            removeColumn(this);
        });

        header.append(headerText, addTask, delCol);
        this.appendChild(header);

        const tasksDiv = document.createElement("div");
        tasksDiv.className = "tasks";
        this.appendChild(tasksDiv);
    }

    /**
     * Adds a Task with the given `text` to the bottom of this column.
     */
    appendTask(text: string) {
        this.getElementsByClassName("tasks")[0].appendChild(new Task(text));
    }


    /**
     * the String shown at the top of this Column.
     */
    get title() {
        return this.firstElementChild!.firstElementChild!.innerHTML;
    }

    /**
     * an array of all Tasks in this Column.
     */
    get tasks() {
        return <Task[]> Array.from(this.getElementsByClassName("task"));
    }

    /**
     * Serializes this column into a ColumnJSON.
     * 
     * @returns a ColumnJSON that represents this Column
     */
    toJSON(): ColumnJSON {
        const tasks = this.tasks;
        return {
            title: this.title,
            tasks: tasks.map(task => task.text)
        };
    }
}
/**
 * Represents an HTMLDivElement that holds multiple columns
 */
class KanbanBoard extends HTMLDivElement {

    constructor(id: string) {
        super();
        this.id = id;
    }

    /**
     * an array of Columns under this KanbanBoard
     */
    get columns() {
        const arr =  <Column[]> Array.from(this.children);
        return arr;
    }

    /**
     * Creates an empty Column with the given title and adds it to the right
     * of the kanban board.
     * 
     * @param title text shown at the top of the Column
     * @returns the new Column
     */
    appendColumn(title: string) {
        const column = new Column(title);
        this.appendChild(column);
        resizeColumns();
        return column;
    }
}

//define the above classes for use in HTML
window.customElements.define("kanban-column", Column, {extends: "div"});
window.customElements.define("kanban-task", Task, {extends: "div"});
window.customElements.define("kanban-board", KanbanBoard, {extends: "div"});

//add a kanban board to the html document
const board = new KanbanBoard("board");
document.body.appendChild(board);

/**
 * Wrapper class to send messages to VSCode API
 */
class MessageSender {
    static vscode = acquireVsCodeApi();

    /**
     * Sends a message to the vscode API
     * 
     * Right now the only valid message is to save the board.
     * 
     * @param command must be "save"
     * @param data must be a kanbanJSON
     */
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
 * if the "s" key was pushed down, then `keysPressed["s"] = true`.
 */
const keysPressed: Map<string, boolean> = new Map();

/**
 * An object containing VSCode URIs for image files.
 * 
 * Type annotation is up to date as of ver 1.0.4
 * 
 */
let icons: {delete: string, delCol: string, add: string};

/**
 * List of elements deleted by the user.
 * 
 * Elements at the end of the list have been deleted more recently.
 */
const deleteHistory: HistoryJSON[] = [];

/**
 * CSS filter strings that correspond to colors.
 * 
 * When the CSS "filter" attribute is set to one of these strings, and the object being filtered
 * is black, the object will be colorized to whatever color the filter string corresponds to.
 */
const filters = {
    textColor: colorToFilter(getComputedStyle(document.getElementById("titlebar")!).color),
    headerColor: colorToFilter(getComputedStyle(document.getElementsByClassName("header")[0]).backgroundColor),
    backgroundColor: colorToFilter(getComputedStyle(document.getElementsByClassName("header")[0]).color) //text color of headers = background color
};



/**
 * Only function manually called, everything below isfunction definitions
 */
addListeners();

/**
 * Adds event listeners to the "Kanban: View" page.
 * 
 * Includes:
 * - mouse listeners for clickable UI elements (i.e. buttons)
 * - mouse listeners for dragging tasks
 * - keyboard listeners for shortcuts
 * - window listener for resizing
 * - VSCode API listener to load data
 */
function addListeners() {
    /**
     * Listeners for user input
     */
    document.addEventListener("keydown", event => {
        keysPressed.set(event.key, true);

        if (keysPressed.get("Control") && event.key === "s") {
            saveData();
        } else if (keysPressed.get("Control") && event.key === "z") {
            restoreElement();
        }
    });

    document.addEventListener("keyup", event => {
        keysPressed.set(event.key, false);
    });

    window.addEventListener("resize", () => {
        resizeColumns();
    });

    /**
     * Listener for VSCode API
     */
    window.addEventListener("message", event => {
        const message: {command: string, data: any} = event.data;
        switch (message.command) {
            case "load":
                loadData(message.data);
                break;
            case "icons":
                icons = message.data;
                break;
        }
    });

    /**
     * Listeners for buttons in titlebar
     */
    const addCol = document.getElementById("add-col")!;
    addCol.addEventListener("click", () => {
        board.appendColumn(`Column ${board.children.length + 1}`);
    });

    const saveBtn = document.getElementById("save")!;
    saveBtn.addEventListener("click", () => {
        saveData();
    });

    const undoBtn = document.getElementById("undo")!;
    undoBtn.addEventListener("click", () => {
        restoreElement();
    });

    const buttonIcons = document.getElementById("titlebar")!.getElementsByTagName("img");
    for (const buttonIcon of Array.from(buttonIcons)) {
        buttonIcon.style.filter = filters.textColor;
        buttonIcon.addEventListener("mouseenter", () => {
            buttonIcon.style.filter = filters.headerColor;
        });
        buttonIcon.addEventListener("mouseleave", () => {
            buttonIcon.style.filter = filters.textColor;
        });
    }
}




/**
 * Takes the serialized kanban board JSON and renders it onto the DOM.
 * 
 * This clears the old board in the process.
 * 
 * @param savedData the kanbanJSON you want rendered
 */
function loadData(savedData: KanbanJSON) {
    for (const column of board.columns) {
        column.remove();
    }

    savedData.cols.forEach(col => {
        const column = board.appendColumn(col.title);
        col.tasks.forEach(taskText => {
            column.appendTask(taskText);
        });
    });
}

/**
 * Serializes the current state of the kanban board then sends it to
 * the VSCode API to be stored in the workspace. 
 */
function saveData() {
    const columns = board.columns;
    const data: KanbanJSON = {
        ncols: columns.length,
        cols: columns.map(column => column.toJSON())
    };
    MessageSender.send("save", data);
}


/**
 * Removes a Column from the DOM
 * 
 * The Column is removed via deleteElement, so it can be recovered.
 * The other Columns have their width adjusted to accomodate for the deletion
 * of this one.
 * 
 * @param column Column being removed
 */
function removeColumn(column: Column) {
    deleteElement(column);
    resizeColumns();
}

/**
 * Find the Task in `column` that is closest to the vertical position `y`.
 * 
 * @param column Column the Task must be in
 * @param y vertical position in pixels
 * @returns Task in `column` closest to `y` position, or null
 */
function getClosestTask(column: Column, y: number) {
    let closestOffset = Number.NEGATIVE_INFINITY;
    let closestTask: Task | null = null;
    
    for (const task of column.tasks) {
        const box = task.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closestOffset) {
            closestOffset = offset;
            closestTask = task;
        }
    }

    return closestTask;
}

/**
 * Makes all the columns have equal width.
 * 
 * More specifically, if the kanban board has a width of `w` and there are `n` columns
 * in the board, then each column will have a width of `w/n` after thisfunction has been called.
 */
function resizeColumns() {
    for (const column of board.columns) {
        column.style.width = board.clientWidth / board.columns.length + "px";
        column.style.maxWidth = column.style.width;
        column.style.minWidth = column.style.maxWidth;
    }
}

/**
 * Creates an anchor ("a" tag) element containing the `icon` image, with `filter` applied
 * normally, `hoverFilter` applied when moused over, and displaying `tooltip` when moused over.
 * 
 * For the filters to show their intended color, `icon` should be completely black. This anchor
 * element does not link to anything nor does it have a click listener.
 * 
 * @param element element this button will go in
 * @param icon VSCode URI for image file
 * @param filter CSS filters applied when this isn't moused over
 * @param hoverFilter CSS filters applied when this is moused over
 * @param tooltip text that appears when this is moused over
 * 
 * @return HTMLAnchorElement containing `icon`
 */
function makeButton(icon: string, filter: string, hoverFilter: string, tooltip: string) {
    const img = document.createElement("img");
    img.src = icon;
    img.style.filter = filter;
    img.addEventListener("mouseenter", () => {
        img.style.filter = hoverFilter;
    });
    img.addEventListener("mouseleave", () => {
        img.style.filter = filter;
    });

    const button = document.createElement("a");
    button.title = tooltip;
    button.appendChild(img);
    return button;
}

/**
 * Serializes a task or column for potential restoration later, then removes it from the DOM.
 * 
 * @param element task or column to delete
 */
function deleteElement(element: Task | Column) {
    const save: HistoryJSON = {
        type: element.className,
        parent: <HTMLDivElement> element.parentNode,
        position: 0,
        data: ""
    };

    //determine position of element
    let siblings = element.parentNode!.children;
    for (let i = 0; i < siblings.length; ++i) {
        if (siblings[i].isSameNode(element)) {
            save.position = i;
            break;
        }
    }

    if (save.type === "task") { // save task
        save.data = (<Task> element).text;
    } else { // save column and child tasks
        save.data = (<Column> element).toJSON();
    }

    deleteHistory.push(save);
    element.remove();
}

/**
 * Deserializes the most recently deleted task or column and puts it back into the DOM
 * to where it was before it was deleted.
 */
function restoreElement() {
    if (deleteHistory.length === 0) {
        return;
    }

    const restore: HistoryJSON = deleteHistory.pop()!;
    let element: Column | Task;
    if (restore.type === "task") {
        element = new Task(<string> restore.data);
    } else {
        const colJSON = <ColumnJSON> restore.data;
        const column = new Column(colJSON.title);
        colJSON.tasks.forEach(taskText => {
            column.appendTask(taskText);
        });
        element = column;
    }

    //put in right position
    const siblings = restore.parent.children;
    if (restore.position === siblings.length) {
        restore.parent.appendChild(element);
    } else {
        restore.parent.insertBefore(element, siblings[restore.position]);
    }

    if (restore.type === "col") {
        resizeColumns();
    }
}

