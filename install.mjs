import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import {readFileSync} from 'node:fs';


const escapeRegex = RegExp.escape ?? ((str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));


function findPackageJson(directoryPath) {
    let currentPath = directoryPath;

    while (true) {
        const packageJsonPath = path.resolve(currentPath, 'package.json');
        try {
            return JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        } catch (err) {
            const parentPath = path.dirname(currentPath);
            if (parentPath === currentPath) {
                return null;
            }
            currentPath = parentPath;
        }
    }
}


// https://nodejs.org/api/module.html#synchronous-customization-hooks
registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier.startsWith('#')) {
            // Find "package.json" from `context.parentURL`.
            const packageJson = findPackageJson(
                context.parentURL ? path.dirname(new URL(context.parentURL).pathname) : process.cwd()
            );

            for (const [key, value] of Object.entries(packageJson?.imports || {})) {
                // https://nodejs.org/api/packages.html#subpath-patterns
                if (key.includes('*')) {
                    // If * is more than once, throw an error
                    if ((key.match(/\*/g) || []).length > 1) {
                        throw new Error(`Invalid import key with multiple '*': ${key}`);
                    }

                    const PATTERN = 'THIS_IS_A_PATTERN';
                    const modulePattern = escapeRegex(key.replace(/\*/g, PATTERN)).replace(PATTERN, '(.*)');

                    const match = specifier.match(new RegExp(`^${modulePattern}$`));

                    if (match) {
                        const targetPath = value.replace(/\*/g, match[1]);

                        // Return original path to avoid NodeJS resolves symlinks.
                        return {
                            url: pathToFileURL(path.resolve(targetPath)).href,
                            // https://beta.docs.nodejs.org/module/customization-hooks#accepted-final-formats-returned-by-load
                            format:
                                targetPath.endsWith('.json')
                                    ? 'json'
                                    : packageJson.type === 'module' ? 'module' : 'commonjs',
                            shortCircuit: true,  // This is mandatory if nextResolve() is not called.
                        };

                    }
                }
            }
        }

        return nextResolve(specifier, context);
    },
});
