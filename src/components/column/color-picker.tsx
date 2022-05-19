import React from 'react';
import boardState from '../../util/board-state';

const darkSwatches = [
    // colors to pick from in light mode
    '#ff6900',
    '#fcb900',
    '#7bdcb5',
    '#00d084',
    '#8ed1fc',
    '#0693e3',
    '#abb8c3',
    '#eb144c',
    '#f78da7',
    '#9900ef',
];
const lightSwatches = [
    // colors to pick from in dark mode
    '#dd302a',
    '#cf4d19',
    '#ec9c25',
    '#7ac41a',
    '#416a0b',
    '#338c84',
    '#344fa2',
    '#d741e3',
    '#9900ef',
    '#6a6a6a',
];

export default function ColorPicker({
    isOpen,
    color,
    changeColor,
}: {
    isOpen: boolean;
    color: string;
    changeColor: (color: string) => void;
}): JSX.Element {
    const [textColor, setTextColor] = React.useState(color.slice(1));
    const swatches = boardState.isLightMode ? lightSwatches : darkSwatches;

    const colorPickerStyle = {
        // CSS styles so that color picker "swipes" open and closed
        maxHeight: isOpen ? '6rem' : 0,
        pointerEvents: isOpen ? 'all' : 'none',
        transition: 'max-height 0.4s linear',
    } as const;

    return (
        <div className="column-color-picker" style={colorPickerStyle}>
            {swatches.map((swatch) => (
                <button
                    key={swatch}
                    className="column-color-picker__swatch"
                    style={{ backgroundColor: swatch }}
                    onClick={() => changeColor(swatch)}
                />
            ))}
            <div className="text-picker">
                <div className="input-tag"> # </div>
                <input
                    value={textColor}
                    onChange={(e) => {
                        const newColor = e.target.value;
                        if (newColor.length > 6 || !/^[\da-fA-F]*$/.test(newColor)) {
                            return;
                        }
                        setTextColor(newColor);
                    }}
                    onBlur={() => {
                        if (textColor.length === 3) {
                            changeColor(
                                `#${textColor[0]}${textColor[0]}${textColor[1]}${textColor[1]}${textColor[2]}${textColor[2]}`
                            );
                        } else if (textColor.length === 6) {
                            changeColor(`#${textColor}`);
                        }
                    }}
                />
            </div>
        </div>
    );
}
