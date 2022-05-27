/**
 * Used for debugging. Returns a readable format of coordinations pair.
 * @param position Object that has the attributes 'x' and 'y'.
 * @returns The values of the argument's attributes x and y in this format: '[x;y]', for example '[1;0]'
 */
export function positionToString(position) {
    return "[" + position.x + "; " + position.y + "]";
}