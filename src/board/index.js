"use strict";

class MessageSender {

    #vscode;

    constructor() {
        this.#vscode = acquireVsCodeApi();
    }

    send(command, data) {
        this.#vscode.postMessage({
            command: command,
            data: data
        });
    }
}

const sender = new MessageSender();
let keysPressed = {}; //keep track of what keys are pressed

function addListeners() {

    document.addEventListener("keydown", event => { //key is pressed
        keysPressed[event.key] = true;

        if (keysPressed["Control"] && event.key === "s") { //check if ctrl + s is pressed
            saveData();
        }
    });

    document.addEventListener("keyup", event => { //key is unpressed
        keysPressed[event.key] = false;
    });

    document.getElementById("save").addEventListener("click", () => { //save button clicked
        saveData();
    });

    window.addEventListener("message", event=> { // listen for message
        const message = event.data;
        switch (message.command) {
            case "load":
                loadData(message.data);
                break;
        }
    });


    function saveData() {
        const columns = document.getElementById("board").children;
        let data = {};
        data.ncols = columns.length;
        data.cols = [];

        for (const column of columns) {
            let col = {};
            const children = column.children;
            col.ntasks = children.length - 1;
            col.tasks = [];

            for (const child of children) {
                if (child.className === "header") {
                    col.title = child.firstElementChild.innerHTML;
                } else {
                    col.tasks.push(child.firstElementChild.innerHTML);
                }
            }

            data.cols.push(col);
        }

        sender.send("save", data);
    }


    const columns = document.getElementsByClassName("col");

    for (const col of columns) {
        const children = col.firstElementChild.children;
        
        const addBtn = children[1];
        const remBtn = children[2];

        addBtn.addEventListener("click", () => { //create new task and add it to bottom of column
            addTask(col, "Add your own text here!");
        });

        remBtn.addEventListener("click", () => { //delete col
            removeColumn(col);
        });
    }

    const addCol = document.getElementById("add-col");
    addCol.addEventListener("click", () => {
        let board = document.getElementById("board");
        const column = addColumn(`Column ${board.children.length + 1}`);
        board.appendChild(column);
    });
}

function loadData(data) {
    let columns = document.getElementsByClassName("col");
    let board = document.getElementById("board");
    while (columns.length > 0) {
        board.removeChild(columns[0]);
    }

    data.cols.forEach(col => {
        console.log(JSON.stringify(col));
        let column = addColumn(col.title);
        col.tasks.forEach(task => {
            addTask(column, task);
        });
        board.appendChild(column);
    });

}

function addColumn(title) {
    let column = document.createElement("div");
    column.className = "col";

    column.addEventListener("dragover", event => {
        event.preventDefault();
        const draggable = document.getElementsByClassName("dragging")[0];
        const taskBelow = getClosestTask(column, event.clientX, event.clientY);
        if (taskBelow === null) {
            column.appendChild(draggable);
        } else {
            column.insertBefore(draggable, taskBelow);
        }
    });

    let header = document.createElement("div");
    header.className = "header";

    let headerText = document.createElement("h2");
    headerText.contentEditable = true;
    headerText.innerHTML = title;
    
    let newTask = document.createElement("button");
    newTask.innerText = "Add Task";
    newTask.addEventListener("click", () => {
        addTask(column, "Add your own text here!");
    });

    let delCol = document.createElement("button");
    delCol.innerHTML = "Delete Column";
    delCol.addEventListener("click", () => {
        removeColumn(column);
    });

    header.append(headerText, newTask, delCol);
    column.appendChild(header);
    return column;
}

function addTask(column, text) {
    let task = document.createElement("div");
    task.className = "task";
    task.draggable = true;

    task.addEventListener("dragstart", () => {
        task.classList.add("dragging");
    });

    task.addEventListener("dragend", ()=>{
        task.classList.remove("dragging");
    });
  
    let taskText = document.createElement("p");
    taskText.contentEditable = true;
    taskText.innerHTML = text;
    
    let delTask = document.createElement("a");
    delTask.innerHTML = "Remove";
    delTask.addEventListener("click", () => {
        //TODO: Add way to restore task
        task.remove();
    });

    task.append(taskText, delTask);
    column.appendChild(task);
}

function removeColumn(column) {
    //TODO: Add way to restore column
    column.remove();
}

function getClosestTask(col, x, y) {
    let closestOffset = Number.NEGATIVE_INFINITY;
    let closestTask = null;

    const tasks = document.getElementsByClassName("task");
    for (const task of tasks) {
        if (col !== task.parentNode) {
            continue;
        }

        const box = task.getBoundingClientRect();
        const offset = y - box.top - box.height/2;
        if (offset < 0 && offset > closestOffset) {
            closestOffset = offset;
            closestTask = task;
        }
    }

    return closestTask;
}

addListeners();
