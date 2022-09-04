/**
 * @file Component contained inside a {@link Column} that can move or delete it.
 */
import React from 'react';
import boardState from '../../util/board-state';

interface ColumnSettingsArgs {
    columnId: string;
    toggleColorPicker: () => void;
    anchorProps: AnchorProperties;
    isOpen: boolean;
    color: string;
    columnIndex: number;
    numCols: number;
}

interface AnchorProperties {
    style?: { color: string };
    onMouseEnter?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => string;
    onMouseLeave?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => string;
}

/**
 * Component contained inside a {@link Column}.
 * Can be used to move, delete, or open the {@link ColorPicker} for the Column.
 */
export default function ColumnSettings({
    columnId,
    toggleColorPicker,
    anchorProps,
    isOpen,
    color,
    columnIndex,
    numCols,
}: ColumnSettingsArgs): JSX.Element {
    const settingsStyle = {
        // CSS styles so that settings menu "swipes" open and closed
        maxHeight: isOpen ? '3rem' : 0,
        pointerEvents: isOpen ? 'all' : 'none',
        transition: 'max-height 0.4s linear',
        paddingTop: '0.4rem',
    } as const;

    return (
        <div className="column-settings" style={settingsStyle}>
            <a
                className="column-color"
                title="Change Color"
                {...anchorProps}
                onClick={toggleColorPicker}
            >
                <span className="codicon codicon-symbol-color" />
            </a>

            <a
                className="column-left"
                title="Move Column Left"
                {...anchorProps}
                style={{
                    display: columnIndex > 0 ? 'block' : 'none',
                    color: color,
                }}
                onClick={() => boardState.moveColumn(columnId, columnIndex - 1)}
            >
                <span className="codicon codicon-arrow-left" />
            </a>
            <a
                className="column-right"
                title="Move Column Right"
                {...anchorProps}
                style={{
                    display: columnIndex < numCols - 1 ? 'block' : 'none',
                    color: color,
                }}
                onClick={() => boardState.moveColumn(columnId, columnIndex + 1)}
            >
                <span className="codicon codicon-arrow-right" />
            </a>

            <a
                className="column-delete"
                title="Delete Column"
                {...anchorProps}
                onClick={() => boardState.removeColumn(columnId)}
            >
                <span className="codicon codicon-trash" />
            </a>
        </div>
    );
}
