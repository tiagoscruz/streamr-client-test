"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/ban-ts-comment */
// horrible, hacky workaround to prevent tsyringe from replacing useful,
// specific errors produced by constructors with tsyringe-specific errors that
// look like "Cannot inject the dependency".  These errors lose the original
// error's stack, constructor and any additional context that was attached for
// control flow or debugging purposes e.g. err.code or err.syscall.
//
// See: https://github.com/microsoft/tsyringe/issues/177
// @ts-nocheck
const tsyringe_1 = require("tsyringe");
// `dist` import below are intentional. Will not work properly if imported directly.
// eslint-disable-next-line no-restricted-imports
const injection_token_1 = require("tsyringe/dist/cjs/providers/injection-token");
// eslint-disable-next-line no-restricted-imports
const error_helpers_1 = require("tsyringe/dist/cjs/error-helpers");
// Should be identical to original resolveParams, but replaces new Error with err.message = formatErrorCtor
// See: https://github.com/microsoft/tsyringe/blob/0cb911b799ccd0b3079629865f1a8fb04cc49658/src/dependency-container.ts#L495-L525
tsyringe_1.container.constructor.prototype.resolveParams = function resolveParams(context, ctor) {
    return (param, idx) => {
        try {
            if ((0, injection_token_1.isTokenDescriptor)(param)) {
                if ((0, injection_token_1.isTransformDescriptor)(param)) {
                    return param.multiple
                        ? this.resolve(param.transform).transform(this.resolveAll(param.token), ...param.transformArgs)
                        : this.resolve(param.transform).transform(this.resolve(param.token, context), ...param.transformArgs);
                }
                else {
                    return param.multiple
                        ? this.resolveAll(param.token)
                        : this.resolve(param.token, context);
                }
            }
            else if ((0, injection_token_1.isTransformDescriptor)(param)) {
                return this.resolve(param.transform, context).transform(this.resolve(param.token, context), ...param.transformArgs);
            }
            return this.resolve(param, context);
        }
        catch (e) {
            e.message = (0, error_helpers_1.formatErrorCtor)(ctor, idx, e);
            throw e;
        }
    };
};
//# sourceMappingURL=PatchTsyringe.js.map