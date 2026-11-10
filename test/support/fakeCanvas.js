/**
 * A stand-in for a canvas of the client, which remembers what is drawn on it. A pixel is covered when its center lies in
 * a rectangle drawn on it, and a rectangle cleared on it uncovers the pixels the same way. This ignores the partial
 * coverage of the edge pixels of a rectangle with fractional coordinates, which a browser blends with what is under it,
 * so a test which cares about them checks `fractionalCalls` instead.
 *
 * Like in a browser, setting the `width` or the `height` clears the bitmap, even to the value it already has.
 * `drawImage` has to be called with its nine arguments; the last four are the target rectangle.
 *
 * @param {{width: number, height: number}} size The initial size of the canvas.
 */
export function createFakeCanvas({ width, height }) {
    let currentWidth = width;
    let currentHeight = height;
    // How many times each pixel is covered since it was last cleared, row by row.
    let counts = new Uint8Array(currentWidth * currentHeight);
    // The target rectangles of the calls of `drawImage` and `clearRect`, in the order of the calls.
    const calls = [];

    // The index of the first pixel whose center is at or after the coordinate, limited to the canvas.
    const firstPixelFrom = (coordinate, limit) => Math.min(limit, Math.max(0, Math.ceil(coordinate - 0.5)));

    function cover(x, y, rectangleWidth, rectangleHeight, update) {
        for (
            let row = firstPixelFrom(y, currentHeight);
            row < firstPixelFrom(y + rectangleHeight, currentHeight);
            row++
        ) {
            for (
                let column = firstPixelFrom(x, currentWidth);
                column < firstPixelFrom(x + rectangleWidth, currentWidth);
                column++
            ) {
                counts[row * currentWidth + column] = update(counts[row * currentWidth + column]);
            }
        }
    }

    const context = {
        drawImage(_image, ...rest) {
            const [x, y, rectangleWidth, rectangleHeight] = rest.slice(-4);
            calls.push({ name: "drawImage", x, y, width: rectangleWidth, height: rectangleHeight });
            cover(x, y, rectangleWidth, rectangleHeight, count => Math.min(count + 1, 255));
        },
        clearRect(x, y, rectangleWidth, rectangleHeight) {
            calls.push({ name: "clearRect", x, y, width: rectangleWidth, height: rectangleHeight });
            cover(x, y, rectangleWidth, rectangleHeight, () => 0);
        },
    };

    const canvas = {
        get width() {
            return currentWidth;
        },
        set width(value) {
            currentWidth = value;
            counts = new Uint8Array(currentWidth * currentHeight);
        },
        get height() {
            return currentHeight;
        },
        set height(value) {
            currentHeight = value;
            counts = new Uint8Array(currentWidth * currentHeight);
        },
        getContext: () => context,
    };

    return {
        canvas,
        calls,

        /**
         * The rectangles drawn on the canvas, as [x, y, width, height].
         */
        drawnRectangles: () => calls.filter(call => call.name === "drawImage").map(rectangleOf),

        /**
         * The calls whose rectangle has a coordinate or a size which isn't a whole number of pixels.
         */
        fractionalCalls: () => calls.filter(call => !rectangleOf(call).every(Number.isInteger)),

        /**
         * How many pixels of the canvas are not covered, covered once and covered more than once.
         */
        coverage() {
            const summary = { uncovered: 0, once: 0, more: 0 };
            for (const count of counts) {
                summary[count === 0 ? "uncovered" : count === 1 ? "once" : "more"]++;
            }
            return summary;
        },

        /**
         * Describes the covered pixels as lines like "y 64-79: x 64-79", one for each run of rows with the same covered
         * columns. A canvas with nothing on it gives no line.
         */
        describePainted() {
            const runs = [];
            for (let row = 0; row < currentHeight; row++) {
                const isCovered = column =>
                    column >= 0 && column < currentWidth && counts[row * currentWidth + column] > 0;
                const columns = [];
                for (let column = 0; column < currentWidth; column++) {
                    if (isCovered(column) && !isCovered(column - 1)) {
                        let end = column;
                        while (isCovered(end + 1)) {
                            end++;
                        }
                        columns.push(`${column}-${end}`);
                    }
                }
                const text = columns.join(", ");
                const last = runs.at(-1);
                if (text && last?.text === text && last.lastRow === row - 1) {
                    last.lastRow = row;
                } else if (text) {
                    runs.push({ firstRow: row, lastRow: row, text });
                }
            }
            return runs.map(run => `y ${run.firstRow}-${run.lastRow}: x ${run.text}`);
        },
    };
}

function rectangleOf(call) {
    return [call.x, call.y, call.width, call.height];
}
