"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamrClientEventEmitter = exports.initEventGateway = exports.ObservableEventEmitter = void 0;
const tsyringe_1 = require("tsyringe");
const eventemitter3_1 = __importDefault(require("eventemitter3"));
/*
 * Emits an addEventListener/removeEventListener event to a separate EventEmitter
 * whenever a listener is added or removed
 */
class ObservableEventEmitter {
    constructor() {
        this.delegate = new eventemitter3_1.default();
        this.observer = new eventemitter3_1.default();
    }
    on(eventName, listener) {
        this.delegate.on(eventName, listener);
        this.observer.emit('addEventListener', eventName);
    }
    once(eventName, listener) {
        const wrappedFn = (payload) => {
            listener(payload);
            this.observer.emit('removeEventListener', eventName);
        };
        this.delegate.once(eventName, wrappedFn);
        this.observer.emit('addEventListener', eventName);
    }
    off(eventName, listener) {
        this.delegate.off(eventName, listener);
        this.observer.emit('removeEventListener', eventName);
    }
    removeAllListeners() {
        const eventNames = this.delegate.eventNames();
        this.delegate.removeAllListeners();
        for (const eventName of eventNames) {
            this.observer.emit('removeEventListener', eventName);
        }
    }
    emit(eventName, payload) {
        this.delegate.emit(eventName, payload);
    }
    getListenerCount(eventName) {
        return this.delegate.listenerCount(eventName);
    }
    getObserver() {
        return this.observer;
    }
}
exports.ObservableEventEmitter = ObservableEventEmitter;
/*
 * Initializes a gateway which can produce events to the given emitter. The gateway is running
 * when there are any listeners for the given eventName: the start() callback is called
 * when a first event listener for the event name is added, and the stop() callback is called
 * when the last event listener is removed.
 */
const initEventGateway = (eventName, start, stop, emitter) => {
    const observer = emitter.getObserver();
    const emit = (payload) => emitter.emit(eventName, payload);
    let producer;
    observer.on('addEventListener', (sourceEvent) => {
        if ((sourceEvent === eventName) && (producer === undefined)) {
            producer = start(emit);
        }
    });
    observer.on('removeEventListener', (sourceEvent) => {
        if ((sourceEvent === eventName) && (producer !== undefined) && (emitter.getListenerCount(eventName) === 0)) {
            stop(producer);
            producer = undefined;
        }
    });
    if (emitter.getListenerCount(eventName) > 0) {
        producer = start(emit);
    }
};
exports.initEventGateway = initEventGateway;
let StreamrClientEventEmitter = class StreamrClientEventEmitter extends ObservableEventEmitter {
};
StreamrClientEventEmitter = __decorate([
    (0, tsyringe_1.scoped)(tsyringe_1.Lifecycle.ContainerScoped)
], StreamrClientEventEmitter);
exports.StreamrClientEventEmitter = StreamrClientEventEmitter;
//# sourceMappingURL=events.js.map