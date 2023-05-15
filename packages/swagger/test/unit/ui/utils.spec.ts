import { isFileURL } from '../../../src';

describe('src/ui/utils', () => {
    it('should confirm file url', () => {
        let output = isFileURL('/foo/bar.json');
        expect(output).toBeTruthy();

        output = isFileURL('file://foo/bar.json');
        expect(output).toBeTruthy();
    });

    it('should not confirm file url', () => {
        let output = isFileURL('http://foo.bar/file.json');
        expect(output).toBeFalsy();

        output = isFileURL('ftp://foo/bar/file.json');
        expect(output).toBeFalsy();
    });
});
