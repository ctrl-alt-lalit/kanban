/**
 * @file A component which exists inside a {@link Column} which can change the color of that Column.
 */

import React from 'react';
import boardState from '../../util/board-state';

const darkSwatches = [
    // colors to pick from in light mode
    '#eb144c', // red
    '#ff6900', // orange
    '#fcb900', // yellow
    '#7bdcb5', // lighter green
    '#00d084', // light green
    '#8ed1fc', // lighter blue
    '#0693e3', // blue
    '#f78da7', // pink
    '#9900ef', // purple
    '#abb8c3', // light gray
];
const lightSwatches = [
    // colors to pick from in dark mode
    '#dd302a', // red
    '#cf4d19', // burnt orange
    '#ec9c25', // gold
    '#7ac41a', // light green
    '#416a0b', // green
    '#338c84', // teal
    '#344fa2', // indigo
    '#d741e3', // pink
    '#9900ef', // purple
    '#6a6a6a', // dark grey
];

function isValidColorString(color: string): boolean {
    return (color.length === 6 || color.length === 3) && /^[\da-fA-F]*$/.test(color);
}

/**
 *
 * @param cssColor {string} assumed to have one of the forms: '#rgb', '#rrggbb', or 'var(--VARNAME)'
 */
function calculateStartingColor(cssColor: string): string {
    if (isValidColorString(cssColor.slice(1))) {
        // #rgb or #rrggbb, remove leading #
        return cssColor.slice(1);
    }

    // var(--VARNAME), extract the --VARNAME
    return getComputedStyle(document.body).getPropertyValue(cssColor.slice(4, -1));
}

/**
 * Selection of colored swatches and a text input that exists within a {@link Column}.
 * Used to change the color of that Column.
 */
export default function ColorPicker({
    isOpen, // Whether this component is currently open
    color, // Containing column's current color
    changeColor, // function used to change the column's color
}: {
    isOpen: boolean;
    color: string;
    changeColor: (color: string) => void;
}): JSX.Element {
    const [textColor, setTextColor] = React.useState(calculateStartingColor(color));
    const swatches = boardState.isLightMode ? lightSwatches : darkSwatches;

    const onInputChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => setTextColor(event.target.value),
        [setTextColor]
    );

    const validateAndChangeColor = React.useCallback(
        (color: string) => {
            let colorStr = color;
            if (color.length === 3) {
                colorStr = `${color[0]}${color[0]}${color[1]}${color[1]}${color[2]}${color[2]}`;
            }

            if (isValidColorString(colorStr)) {
                changeColor('#' + colorStr);
                setTextColor(colorStr);
            }
        },
        [changeColor, setTextColor]
    );

    const makeSwatchButton = React.useCallback(
        (swatch: string) => (
            <button
                key={swatch}
                className="column-color-picker__swatch"
                style={{ backgroundColor: swatch }}
                onClick={() => validateAndChangeColor(swatch.slice(1))}
            />
        ),
        [validateAndChangeColor]
    );

    const swatchButtons = React.useMemo(
        () => swatches.map(makeSwatchButton),
        [swatches, makeSwatchButton]
    );

    const colorPickerStyle = {
        // CSS styles so that color picker "swipes" open and closed
        maxHeight: isOpen ? '6rem' : 0,
        pointerEvents: isOpen ? 'all' : 'none',
        transition: 'max-height 0.4s linear',
    } as const;

    return (
        <div className="column-color-picker" style={colorPickerStyle}>
            {swatchButtons}
            <div className="text-picker">
                <div className="input-tag"> # </div>
                <input
                    value={textColor}
                    onChange={onInputChange}
                    onBlur={() => validateAndChangeColor(textColor)}
                />
            </div>
        </div>
    );
}
