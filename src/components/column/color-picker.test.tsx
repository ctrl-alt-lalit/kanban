import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ColorPicker from './color-picker';

describe('Color Picker', () => {
    const colorChangeMock = jest.fn();

    it("can change a column's color with clickable swatches", () => {
        const wrapper = render(
            <ColorPicker color={'#aabbcc'} isOpen={true} changeColor={colorChangeMock} />
        );
        const picker = wrapper.container as HTMLDivElement;
        const swatch = picker.querySelector('button')!;
        userEvent.click(swatch);

        expect(colorChangeMock).toHaveBeenCalled();
        colorChangeMock.mockClear();
        wrapper.unmount();
    });

    it("can change a column's color with a textbox", () => {
        const wrapper = render(
            <ColorPicker color={'#aabbcc'} isOpen={true} changeColor={colorChangeMock} />
        );
        const picker = wrapper.container as HTMLDivElement;
        const input = picker.querySelector('.text-picker input') as HTMLInputElement;

        userEvent.type(input, 'aaaaaa');
        input.blur();

        expect(colorChangeMock).toHaveBeenCalled();
        colorChangeMock.mockClear();
        wrapper.unmount();
    });
});
