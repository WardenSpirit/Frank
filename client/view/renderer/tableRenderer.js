import * as drawingContext from './drawingContext.js';
import * as images from '../images.js';


export function renderTable() {
    drawingContext.tableContext.drawImage(images.tableImage, 0, 0, 800, 200);
}