import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import boardState from '../../util/board-state';
import ColumnSettings from './column-settings';

describe('ColumnSettings', () => {
    it('can delete this column', () => {
        const wrapper = render(
            <ColumnSettings
                columnId={'id'}
                toggleColorPicker={() => undefined}
                anchorProps={{}}
                isOpen={true}
                color={'#aabbcc'}
                columnIndex={0}
                numCols={1}
            />
        );
        const settings = wrapper.container as HTMLDivElement;

        const deleteButton = settings.querySelector('.column-delete')!;
        const deleteSpy = jest.spyOn(boardState, 'removeColumn');
        deleteSpy.mockClear();

        userEvent.click(deleteButton);
        expect(deleteSpy).toHaveBeenCalled();
        wrapper.unmount();
    });

    describe('move-column buttons', () => {
        it('can move a column left and right', () => {
            const wrapper = render(
                <ColumnSettings
                    columnId={'id'}
                    toggleColorPicker={() => undefined}
                    anchorProps={{}}
                    isOpen={true}
                    color={'#aabbcc'}
                    columnIndex={1}
                    numCols={3}
                />
            );
            const settings = wrapper.container as HTMLDivElement;

            const moveSpy = jest.spyOn(boardState, 'moveColumn').mockImplementation();

            const leftButton = settings.querySelector('.column-left')!;
            userEvent.click(leftButton);

            const rightButton = settings.querySelector('.column-right')!;
            userEvent.click(rightButton);

            expect(moveSpy).toHaveBeenCalledTimes(2);
            wrapper.unmount();
        });

        it('does not show up if a column has no left/right neighbors', () => {
            const wrapper = render(
                <ColumnSettings
                    columnId={'id'}
                    toggleColorPicker={() => undefined}
                    anchorProps={{}}
                    isOpen={true}
                    color={'#aabbcc'}
                    columnIndex={0}
                    numCols={1}
                />
            );
            const settings = wrapper.container as HTMLDivElement;

            const leftButton = settings.querySelector('.column-left') as HTMLAnchorElement;
            const rightButton = settings.querySelector('.column-right') as HTMLAnchorElement;

            expect(leftButton.style.display).toBe('none');
            expect(rightButton.style.display).toBe('none');

            wrapper.unmount();
        });
    });

    it('can open and close the color picker', () => {
        const toggleMock = jest.fn();
        const wrapper = render(
            <ColumnSettings
                columnId={'id'}
                toggleColorPicker={toggleMock}
                anchorProps={{}}
                isOpen={true}
                color={'#aabbcc'}
                columnIndex={1}
                numCols={3}
            />
        );
        const settings = wrapper.container as HTMLDivElement;

        const colorToggle = settings.querySelector('.column-color')!;
        userEvent.click(colorToggle);
        expect(toggleMock).toHaveBeenCalled();
    });
});
