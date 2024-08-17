import * as drawingContext from './drawingContext.js';
import * as images from '../images.js';


export async function renderTable() {
    const IMAGE = await images.getImage("TABLE");
    drawingContext.tableContext.drawImage(IMAGE, 0, 0, 224, 47);
}