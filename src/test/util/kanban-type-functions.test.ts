import * as KT from '../../util/kanban-type-functions';

function randomString() {
    return Math.random().toString();
}

function randomBoolean() {
    return Math.random() < 0.5;
}

describe('Kanban Type Handler', () => {
    describe('createTaskJson()', () => {
        it('Should return a TaskJson', () => {
            const manuallyCreated: TaskJSON = {text: 'any string', id: '12345'};
            const task = KT.createTaskJson();
            
            expect(Object.keys(task)).toStrictEqual(Object.keys(manuallyCreated));
            expect(typeof task.id).toBe(typeof manuallyCreated.id);
            expect(typeof task.text).toBe(typeof manuallyCreated.text);
        });

        it('Should create a TaskJSON with the given string', () => {
            const text = randomString();
            const task = KT.createTaskJson(text);
            expect(task.text).toBe(text);
        });
    });

    describe('createColumnJson()', () => {
        it('Should return a StrictColumnJSON', () => {
            const manuallyCreated: StrictColumnJSON = {
                title: 'title',
                tasks: [],
                id: '12345',
                color: '#000000'
            };
            const column = KT.createStrictColumnJson();
            
            expect(Object.keys(column)).toStrictEqual(Object.keys(manuallyCreated));
            expect(typeof column.title).toBe(typeof manuallyCreated.title);
            expect(typeof column.id).toBe(typeof manuallyCreated.id);
            expect(typeof column.color).toBe(typeof manuallyCreated.color);
        });

        it('Should create a StrictColumnJSON with the given parameters', () => {
            const title = randomString();
            const tasks = [KT.createTaskJson(), KT.createTaskJson(), KT.createTaskJson()];
            const color = randomString();
            const column = KT.createStrictColumnJson(title, tasks, color);

            expect(column.title).toBe(title);
            expect(column.tasks).toHaveLength(tasks.length);
            expect(column.color).toBe(color);
        });
    });

    describe('createKanbanJSON()', () => {
        it('Should return a StrictKanbanJSON', () => {
            const manuallyCreated: StrictKanbanJSON = {
                title: 'title',
                cols: [],
                autosave: false,
                saveToFile: false,
                timestamp: 123
            };
            

            const kanban = KT.createStrictKanbanJson();
            expect(Object.keys(kanban)).toStrictEqual(Object.keys(manuallyCreated));
            expect(typeof kanban.title).toBe(typeof manuallyCreated.title);
            expect(typeof kanban.autosave).toBe(typeof manuallyCreated.autosave);
        });

        it('Should create a StrictKanbanJSON with the given parameters', () => {
            const title = randomString();
            const cols = [KT.createStrictColumnJson(), KT.createStrictColumnJson(), KT.createStrictColumnJson()];
            const autosave = randomBoolean();
            const kanban = KT.createStrictKanbanJson(title, cols, autosave);

            expect(kanban.title).toBe(title);
            expect(kanban.cols).toStrictEqual(cols);
            expect(kanban.autosave).toBe(autosave);
        });
    });

    describe('toTaskJson()', () => {
        it ('converts a string to a taskJSON', () => {
            const task = KT.createTaskJson();
            const text = randomString();
            const converted = KT.createTaskJson(text);
            
            expect(Object.keys(converted)).toStrictEqual(Object.keys(task));
            expect(converted.text).toBe(text);
        });

        it('does not modify an inputted taskJSON', () => {
            const task = KT.createTaskJson();
            const processed = KT.toTaskJson(task);
            expect(processed).toStrictEqual(task);
        });
    });

    describe('toStrictColumnJSON()', () => {
        it('converts a ColumnJSON to a StrictColumnJSON', () => {
            const strictKeys = Object.keys(KT.createStrictColumnJson());

            const stringTasks: ColumnJSON = {title: 'tasks_are_strings', tasks: ['a', 'b', 'c']};
            const convertedStringTasks = KT.toStrictColumnJson(stringTasks);
            expect(Object.keys(convertedStringTasks)).toStrictEqual(strictKeys);
            expect(convertedStringTasks.tasks.map(task => task.text)).toStrictEqual(stringTasks.tasks);

            const ntasks: ColumnJSON = {title: 'extra_ntasks_key', tasks: [], ntasks: 0};
            const convertedNtasks = KT.toStrictColumnJson(ntasks);
            expect(Object.keys(convertedNtasks)).toStrictEqual(strictKeys);
        });

        it('does not modify StrictColumnJSONs passed into it', () => {
            const alreadyStrict = KT.createStrictColumnJson('dont_convert', [], 'green');
            const converted = KT.toStrictColumnJson(alreadyStrict);
            expect(converted).toStrictEqual(alreadyStrict);
        });
    });

    describe('toStrictKanbanJSON()', () => {
        const strictKeys = Object.keys(KT.createStrictKanbanJson());

        it('converts a KanbanJSON to a StrictKanbanJSON', () => {
            const onlyColumns: KanbanJSON = {cols: [KT.createStrictColumnJson(), KT.createStrictColumnJson()]};
            const convertedOnlyColumns = KT.toStrictKanbanJson(onlyColumns);
            expect(Object.keys(convertedOnlyColumns)).toStrictEqual(strictKeys);

            const ncols: KanbanJSON = {title: 'extra_ncols_key', cols: [], ncols: 0};
            const convertedNcols = KT.toStrictKanbanJson(ncols);
            expect(Object.keys(convertedNcols)).toStrictEqual(strictKeys);
        });

        it('can get autosave data from settings', () => {
            const settings: KanbanJSON = {cols:[], settings: {autosave: randomBoolean()}};
            const convertedSettings = KT.toStrictKanbanJson(settings);
            expect(convertedSettings.autosave).toBe(settings.settings!.autosave);
        });

        it('does not modify StrictKanbanJSONs passed into it', () => {
            const alreadyStrict = KT.createStrictKanbanJson();
            const converted = KT.toStrictKanbanJson(alreadyStrict);
            expect(converted).toStrictEqual(alreadyStrict);
        });
    });
});
