"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DestroySignal = void 0;
/**
 * Client-wide destroy signal.
 */
const tsyringe_1 = require("tsyringe");
const Signal_1 = require("./utils/Signal");
const StreamrClientError_1 = require("./StreamrClientError");
/**
 * Listen to onDestroy to fire cleanup code on destroy.
 * Careful not to introduce memleaks.
 * Trigger this to destroy the client.
 */
let DestroySignal = class DestroySignal {
    constructor() {
        this.onDestroy = Signal_1.Signal.once();
        this.trigger = this.destroy;
        const controller = new AbortController();
        this.abortSignal = controller.signal;
        this.onDestroy.listen(() => {
            controller.abort();
        });
    }
    destroy() {
        return this.onDestroy.trigger();
    }
    assertNotDestroyed() {
        if (this.isDestroyed()) {
            throw new StreamrClientError_1.StreamrClientError('Client is destroyed. Create a new instance', 'CLIENT_DESTROYED');
        }
    }
    isDestroyed() {
        return this.onDestroy.triggerCount() > 0;
    }
};
DestroySignal = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped),
    __metadata("design:paramtypes", [])
], DestroySignal);
exports.DestroySignal = DestroySignal;
//# sourceMappingURL=DestroySignal.js.map