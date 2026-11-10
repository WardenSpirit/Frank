// A stand-in for the Image of a browser, which images.js needs: it records the requested paths in `requested` and
// rejects the decoding of the paths for which `fails(path)` is true, like a browser does for a missing file.
export function createFakeImage({ requested, fails }) {
    return class FakeImage {
        set src(path) {
            this.path = path;
            requested.push(path);
        }

        async decode() {
            if (fails(this.path)) {
                throw new Error(`cannot decode ${this.path}`);
            }
        }
    };
}
