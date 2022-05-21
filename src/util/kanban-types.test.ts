import * as KT from './kanban-types';
import { randomBoolean, randomString } from './test-helpers';

describe('Kanban Type Handler', () => {
    describe('createStrictTaskJson()', () => {
        it('Should return a TaskJson', () => {
            const manuallyCreated: KT.TaskJson = {
                text: 'any string',
                id: '12345',
            };
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

    describe('createStrictColumnJson()', () => {
        it('Should return a StrictColumnJSON', () => {
            const manuallyCreated: KT.ColumnJson = {
                title: 'title',
                tasks: [],
                id: '12345',
                color: '#000000',
            };
            const column = KT.createColumnJson();

            expect(Object.keys(column)).toStrictEqual(Object.keys(manuallyCreated));
            expect(typeof column.title).toBe(typeof manuallyCreated.title);
            expect(typeof column.id).toBe(typeof manuallyCreated.id);
            expect(typeof column.color).toBe(typeof manuallyCreated.color);
        });

        it('Should create a StrictColumnJSON with the given parameters', () => {
            const title = randomString();
            const tasks = [KT.createTaskJson(), KT.createTaskJson(), KT.createTaskJson()];
            const color = randomString();
            const column = KT.createColumnJson(title, tasks, color);

            expect(column.title).toBe(title);
            expect(column.tasks).toHaveLength(tasks.length);
            expect(column.color).toBe(color);
        });
    });

    describe('createStrictKanbanJSON()', () => {
        it('Should return a StrictKanbanJSON', () => {
            const manuallyCreated: KT.KanbanJson = {
                title: 'title',
                cols: [],
                autosave: false,
                saveToFile: false,
                timestamp: 123,
            };

            const kanban = KT.createKanbanJson();
            expect(Object.keys(kanban)).toStrictEqual(Object.keys(manuallyCreated));
            expect(typeof kanban.title).toBe(typeof manuallyCreated.title);
            expect(typeof kanban.autosave).toBe(typeof manuallyCreated.autosave);
        });

        it('Should create a StrictKanbanJSON with the given parameters', () => {
            const title = randomString();
            const cols = [KT.createColumnJson(), KT.createColumnJson(), KT.createColumnJson()];
            const autosave = randomBoolean();
            const saveToFile = randomBoolean();
            const kanban = KT.createKanbanJson(title, cols, autosave, saveToFile);

            expect(kanban.title).toBe(title);
            expect(kanban.cols).toStrictEqual(cols);
            expect(kanban.autosave).toBe(autosave);
        });
    });

    describe('toTaskJson()', () => {
        it('converts a string to a taskJSON', () => {
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
            const strictKeys = Object.keys(KT.createColumnJson());

            const stringTasks: KT.WeakColumnJson = {
                title: 'tasks_are_strings',
                tasks: ['a', 'b', 'c'],
            };
            const convertedStringTasks = KT.toColumnJson(stringTasks);
            expect(Object.keys(convertedStringTasks)).toStrictEqual(strictKeys);
            expect(convertedStringTasks.tasks.map((task) => task.text)).toStrictEqual(
                stringTasks.tasks
            );

            const ntasks: KT.WeakColumnJson = {
                title: 'extra_ntasks_key',
                tasks: [],
                ntasks: 0,
            };
            const convertedNtasks = KT.toColumnJson(ntasks);
            expect(Object.keys(convertedNtasks)).toStrictEqual(strictKeys);
        });

        it('does not modify StrictColumnJSONs passed into it', () => {
            const alreadyStrict = KT.createColumnJson('dont_convert', [], 'green');
            const converted = KT.toColumnJson(alreadyStrict);
            expect(converted).toStrictEqual(alreadyStrict);
        });
    });

    describe('toStrictKanbanJSON()', () => {
        const strictKeys = Object.keys(KT.createKanbanJson());

        it('converts a KanbanJSON to a StrictKanbanJSON', () => {
            const onlyColumns: KT.WeakKanbanJson = {
                cols: [KT.createColumnJson(), KT.createColumnJson()],
            };
            const convertedOnlyColumns = KT.toKanbanJson(onlyColumns);
            expect(Object.keys(convertedOnlyColumns)).toStrictEqual(strictKeys);

            const ncols: KT.WeakKanbanJson = {
                title: 'extra_ncols_key',
                cols: [],
                ncols: 0,
            };
            const convertedNcols = KT.toKanbanJson(ncols);
            expect(Object.keys(convertedNcols)).toStrictEqual(strictKeys);
        });

        it('can get autosave data from settings', () => {
            const settings: KT.WeakKanbanJson = {
                cols: [],
                settings: { autosave: randomBoolean() },
            };
            const convertedSettings = KT.toKanbanJson(settings);
            expect(convertedSettings.autosave).toBe(settings.settings!.autosave);
        });

        it('does not modify StrictKanbanJSONs passed into it', () => {
            const alreadyStrict = KT.createKanbanJson();
            const converted = KT.toKanbanJson(alreadyStrict);
            expect(converted).toStrictEqual(alreadyStrict);
        });
    });

    describe('isWeakKanbanJson()', () => {
        it('returns true when obj is a WeakKanbanJson', () => {
            expect(KT.isWeakKanbanJson(KT.createKanbanJson())).toBe(true);
        });

        it('returns false otherwise', () => {
            const fakeKanban = {
                cols: [
                    {
                        id: 'id',
                        tasks: 'wrong',
                    },
                ],
            };

            expect(KT.isWeakKanbanJson(fakeKanban)).toBe(false);
        });
    });
});
